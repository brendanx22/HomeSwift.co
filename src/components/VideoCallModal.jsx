import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Minimize2,
  Maximize2,
  X
} from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';

const VideoCallModal = ({ isOpen, onClose, targetUser, targetUserId }) => {
  const {
    isConnected,
    isConnecting,
    error,
    callType,
    isCallInitiated,
    incomingCall,
    localVideoRef,
    remoteVideoRef,
    startConnection,
    acceptCall,
    rejectCall,
    startVideoCall,
    endCall,
    toggleVideo,
    toggleAudio,
    clearError
  } = useWebRTC(targetUserId);

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (isOpen && targetUserId) {
      startConnection('video');
    }
  }, [isOpen, targetUserId]);

  useEffect(() => {
    let interval;
    if (isConnected) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  const handleStartVideoCall = async () => {
    try {
      await startVideoCall();
    } catch (err) {
      console.error('Failed to start video call:', err);
    }
  };

  const handleEndCall = () => {
    endCall();
    onClose();
  };

  const handleToggleVideo = async () => {
    const newVideoState = toggleVideo();
    setIsVideoOn(newVideoState);
  };

  const handleToggleAudio = async () => {
    const newAudioState = toggleAudio();
    setIsAudioOn(newAudioState);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle incoming call
  if (incomingCall && incomingCall.callType === 'video') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gray-900 rounded-2xl overflow-hidden w-full max-w-md p-6"
          >
            {/* Incoming Call Header */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden mx-auto mb-4">
                {incomingCall.callerData?.avatar_url ? (
                  <img
                    src={incomingCall.callerData.avatar_url}
                    alt={incomingCall.callerData?.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-semibold text-gray-600">
                    {(incomingCall.callerData?.full_name || incomingCall.callerData?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">
                {incomingCall.callerData?.full_name || incomingCall.callerData?.email}
              </h3>
              <p className="text-gray-400">Incoming video call...</p>
            </div>

            {/* Call Controls */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={rejectCall}
                className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                onClick={acceptCall}
                className="p-4 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all duration-200"
              >
                <Video className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className={`bg-gray-900 rounded-2xl overflow-hidden ${
            isFullscreen ? 'w-full h-full' : 'w-full max-w-4xl h-[600px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                {targetUser?.avatar_url ? (
                  <img
                    src={targetUser.avatar_url}
                    alt={targetUser?.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-gray-600">
                    {(targetUser?.full_name || targetUser?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  {targetUser?.full_name || targetUser?.email}
                </h3>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-400 text-sm">
                    {isConnected ? formatDuration(duration) : isConnecting ? 'Connecting...' : 'Video Call'}
                  </p>
                  {isConnected && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs">Connected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Video Area */}
          <div className="relative flex-1 bg-black">
            {/* Remote Video (Main) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Local Video (Small overlay) */}
            <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isVideoOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <VideoOff className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Connection Status */}
            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-[#FF6B35] mx-auto mb-4"></div>
                  <p className="text-lg font-semibold">
                    {isConnecting ? 'Connecting...' : 'Starting video call...'}
                  </p>
                  <p className="text-gray-400 mt-2">Please wait</p>
                </div>
              </div>
            )}

            {/* Start Call Button */}
            {!isConnected && !isConnecting && isCallInitiated && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={handleStartVideoCall}
                  className="px-8 py-3 bg-[#FF6B35] text-white rounded-full font-semibold hover:bg-[#e85e2f] transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Start Video Call
                </button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="absolute bottom-4 left-4 right-4 bg-red-500 text-white p-3 rounded-lg">
                <p className="text-sm">{error}</p>
                <button
                  onClick={clearError}
                  className="text-xs underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-6 p-6 bg-gray-800">
            {/* Video Toggle */}
            <button
              onClick={handleToggleVideo}
              className={`p-4 rounded-full transition-all duration-200 ${
                isVideoOn
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={handleToggleAudio}
              className={`p-4 rounded-full transition-all duration-200 ${
                isAudioOn
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>

            {/* End Call */}
            <button
              onClick={handleEndCall}
              className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoCallModal;
