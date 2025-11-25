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
      // Create the WebRTC peer connection first
      await initiateWebRTCConnection(targetUserId, type);

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

      // Create WebRTC connection
      await initiateWebRTCConnection(incomingCall.from, incomingCall.callType);

      // Get the peer connection and add media tracks
      const peerConnection = peerConnections.get(incomingCall.from);
      if (peerConnection && stream) {
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });

        // Set up remote stream handling
        peerConnection.ontrack = (event) => {
          console.log('Received remote stream:', event.streams[0]);
          if (event.streams[0]) {
            if (incomingCall.callType === 'video' && remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
            } else if (incomingCall.callType === 'voice' && remoteVideoRef.current) {
              // For voice calls, we still use the video ref for audio
              remoteVideoRef.current.srcObject = event.streams[0];
            }
          }
        };
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

  // Start video call
  const startVideoCall = async () => {
    try {
      const stream = await getUserMedia('video');

      // Add media tracks to peer connection
      const peerConnection = peerConnections.get(targetUserId);
      if (peerConnection) {
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });

        // Set up remote stream handling
        peerConnection.ontrack = (event) => {
          console.log('Received remote stream:', event.streams[0]);
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setIsConnected(true);
          }
        };
      } else {
        throw new Error('Peer connection not found. Please try again.');
      }

      return stream;
    } catch (err) {
      setError('Failed to start video call');
      console.error('Video call error:', err);
      throw err;
    }
  };

  // Start voice call
  const startVoiceCall = async () => {
    try {
      const stream = await getUserMedia('voice');

      // Add media tracks to peer connection
      const peerConnection = peerConnections.get(targetUserId);
      if (peerConnection) {
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });

        // Set up remote stream handling (audio only)
        peerConnection.ontrack = (event) => {
          console.log('Received remote audio stream:', event.streams[0]);
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setIsConnected(true);
          }
        };
      } else {
        throw new Error('Peer connection not found. Please try again.');
      }

      return stream;
    } catch (err) {
      setError('Failed to start voice call');
      console.error('Voice call error:', err);
      throw err;
    }
  };

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
    startVideoCall,
    startVoiceCall,
    endCall,
    toggleVideo,
    toggleAudio,
    clearError,

    // Utilities
    getUserMedia
  };
};

export default useWebRTC;
