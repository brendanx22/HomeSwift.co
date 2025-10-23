import { useState, useEffect, useRef } from 'react';
import { useMessaging } from '../contexts/MessagingContext';

export const useWebRTC = (targetUserId) => {
  const { socket, initiateWebRTCConnection, sendWebRTCMessage, peerConnections } = useMessaging();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [callType, setCallType] = useState('video'); // 'video' or 'voice'
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStream = useRef(null);

  // Initialize WebRTC connection
  const startConnection = async (type = 'video') => {
    if (!targetUserId || isConnecting) return;

    setCallType(type);
    setIsConnecting(true);
    setError(null);

    try {
      await initiateWebRTCConnection(targetUserId, type);
      setIsConnected(true);
    } catch (err) {
      setError('Failed to establish WebRTC connection');
      console.error('WebRTC connection error:', err);
    } finally {
      setIsConnecting(false);
    }
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
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };
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
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };
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

    // Media refs
    localVideoRef,
    remoteVideoRef,

    // Actions
    startConnection,
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
