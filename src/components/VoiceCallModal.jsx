import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Minimize2,
  Maximize2,
  X,
  User
} from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';

const VoiceCallModal = ({ isOpen, onClose, targetUser, targetUserId }) => {
  const {
    isConnected,
    isConnecting,
    error,
    callType,
    isCallInitiated,
    incomingCall,
    startConnection,
    acceptCall,
    rejectCall,
    startVoiceCall,
    endCall,
    toggleAudio,
    clearError
  } = useWebRTC(targetUserId);

  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (isOpen && targetUserId) {
      startConnection('voice');
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

  const handleStartVoiceCall = async () => {
    try {
      await startVoiceCall();
    } catch (err) {
      console.error('Failed to start voice call:', err);
    }
  };

  const handleEndCall = () => {
    endCall();
    onClose();
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
  if (incomingCall && incomingCall.callType === 'voice') {
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
                  <User className="w-10 h-10 text-gray-600" />
                )}
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">
                {incomingCall.callerData?.full_name || incomingCall.callerData?.email}
              </h3>
              <p className="text-gray-400">Incoming voice call...</p>
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
                <Mic className="w-6 h-6" />
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
            isFullscreen ? 'w-full h-full' : 'w-full max-w-md h-[500px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                {targetUser?.avatar_url ? (
                  <img
                    src={targetUser.avatar_url}
                    alt={targetUser?.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-600" />
                )}
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  {targetUser?.full_name || targetUser?.email}
                </h3>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-400 text-sm">
                    {isConnected ? formatDuration(duration) : isConnecting ? 'Connecting...' : 'Voice Call'}
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

          {/* Call Area */}
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 p-8">
            <div className="text-center">
              {/* Large Avatar */}
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden mx-auto mb-8 shadow-2xl">
                {targetUser?.avatar_url ? (
                  <img
                    src={targetUser.avatar_url}
                    alt={targetUser?.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-600" />
                )}
              </div>

              {/* User Info */}
              <h2 className="text-2xl font-bold text-white mb-2">
                {targetUser?.full_name || targetUser?.email}
              </h2>
              <p className="text-gray-400 mb-8">
                {targetUser?.user_type && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                    {targetUser.user_type}
                  </span>
                )}
                {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Voice Call'}
              </p>

              {/* Connection Status */}
              {!isConnected && !isConnecting && isCallInitiated && (
                <div className="mb-8">
                  <button
                    onClick={handleStartVoiceCall}
                    className="px-8 py-3 bg-[#FF6B35] text-white rounded-full font-semibold hover:bg-[#e85e2f] transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Start Voice Call
                  </button>
                </div>
              )}

              {/* Connecting Animation */}
              {!isConnected && isConnecting && (
                <div className="flex items-center justify-center space-x-2 mb-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-600 border-t-[#FF6B35]"></div>
                  <span className="text-white">Connecting...</span>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-500 text-white p-3 rounded-lg mb-4">
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
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-6 p-6 bg-gray-800">
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

export default VoiceCallModal;
