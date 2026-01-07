import { useState, useEffect, useRef } from 'react';
import { useMessaging } from '../contexts/MessagingContext';

export const useWebRTC = (targetUserId) => {
  const { socket, initiateWebRTCConnection, sendWebRTCMessage, peerConnections } = useMessaging();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [callType, setCallType] = useState('video');
  const [isCallInitiated, setIsCallInitiated] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStream = useRef(null);
  const peerConnectionRef = useRef(null);

  // Listen for incoming calls
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      console.log('Incoming call:', data);
      setIncomingCall(data);
    };

    const handleCallInitiated = (data) => {
      console.log('Call initiated:', data);
      setIsCallInitiated(true);
    };

    const handleCallResponse = (data) => {
      console.log('Call response:', data);
      if (data.accepted) {
        setIsConnected(true);
      } else {
        setError('Call was rejected');
        setIsConnecting(false);
      }
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_initiated', handleCallInitiated);
    socket.on('call_response', handleCallResponse);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_initiated', handleCallInitiated);
      socket.off('call_response', handleCallResponse);
    };
  }, [socket]);

  // Initialize WebRTC connection
  const startConnection = async (type = 'video') => {
    if (!targetUserId || isConnecting) return;

    setCallType(type);
    setIsConnecting(true);
    setIsConnected(false);
    setError(null);
    setIsCallInitiated(false);
    setIncomingCall(null);

    try {
      // First, get user media based on call type
      const stream = await getUserMedia(type);
      
      // Create the WebRTC peer connection
      const peerConnection = await initiateWebRTCConnection(targetUserId, type);

      // Add tracks before sending offer (this should be handled by initiateWebRTCConnection or manually here)
      if (peerConnection && stream) {
        // Remove old tracks if any
        const senders = peerConnection.getSenders();
        senders.forEach(sender => peerConnection.removeTrack(sender));
        
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });

        // If we're the initiator, we need to send an offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('webrtc_offer', {
          targetUserId,
          offer,
          callType: type
        });
      }

      // Notify the target user about the incoming call
      socket.emit('initiate_call', {
        targetUserId,
        callType: type
      });

      // Wait for call initiation confirmation or timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Call initiation timeout'));
        }, 10000); // 10 second timeout

        const handleInitiated = () => {
          clearTimeout(timeout);
          socket.off('call_initiated', handleInitiated);
          resolve();
        };

        socket.on('call_initiated', handleInitiated);
      });

      console.log(`Call initiated successfully for ${type}`);
      setIsCallInitiated(true);
    } catch (err) {
      setError('Failed to initiate call');
      console.error('Call initiation error:', err);
      setIsConnecting(false);
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall) return;

    setIsConnecting(true);
    setError(null);
    setCallType(incomingCall.callType);

    try {
      // First, get user media based on call type
      const stream = await getUserMedia(incomingCall.callType);

      // Get the peer connection (it should have been created by handleWebRTCOffer in context)
      const peerConnection = await initiateWebRTCConnection(incomingCall.from, incomingCall.callType);
      
      if (peerConnection && stream) {
        // Add tracks
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });

        // Set up remote stream handling
        peerConnection.ontrack = (event) => {
          console.log('Received remote stream:', event.streams[0]);
          if (event.streams[0] && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // Create and send answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        socket.emit('webrtc_answer', {
          targetUserId: incomingCall.from,
          answer,
          callType: incomingCall.callType
        });
      }

      // Notify caller that call was accepted
      socket.emit('call_response', {
        targetUserId: incomingCall.from,
        accepted: true,
        callType: incomingCall.callType
      });

      setIncomingCall(null);
      setIsConnected(true);
    } catch (err) {
      setError('Failed to accept call');
      console.error('Call acceptance error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (!incomingCall) return;

    socket.emit('call_response', {
      targetUserId: incomingCall.from,
      accepted: false,
      callType: incomingCall.callType
    });

    setIncomingCall(null);
    setError('Call rejected');
  };

  // Get user media based on call type
  const getUserMedia = async (type = 'video') => {
    const constraints = type === 'voice'
      ? { video: false, audio: true }
      : { video: true, audio: true };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStream.current = stream;

      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err) {
      setError(`Failed to access ${type === 'voice' ? 'microphone' : 'camera and microphone'}`);
      console.error(`${type} call error:`, err);
      throw err;
    }
  };

  // startVideoCall and startVoiceCall have been merged into startConnection

  // Toggle video on/off during call
  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  };

  // Toggle audio on/off during call
  const toggleAudio = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  };

  // End call
  const endCall = () => {
    // Stop local stream
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsCallInitiated(false);
    setIncomingCall(null);
    setCallType('video');
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return {
    // Connection state
    isConnected,
    isConnecting,
    error,
    callType,
    isCallInitiated,
    incomingCall,

    // Media refs
    localVideoRef,
    remoteVideoRef,

    // Actions
    startConnection,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
    clearError,

    // Utilities
    getUserMedia
  };
};

export default useWebRTC;
