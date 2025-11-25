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

  // Automatically start the voice call when connection is initiated
  useEffect(() => {
    if (isCallInitiated && !isConnected && !isConnecting) {
      handleStartVoiceCall();
    }
  }, [isCallInitiated, isConnected, isConnecting]);

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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl"
          >
            {/* Incoming Call Header */}
            <div className="bg-gradient-to-r from-[#FF6B35] to-orange-500 p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden mx-auto mb-4 backdrop-blur-sm">
                {incomingCall.callerData?.avatar_url ? (
                  <img
                    src={incomingCall.callerData.avatar_url}
                    alt={incomingCall.callerData?.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-white" />
                )}
              </div>
              <h3 className="text-white text-xl font-bold mb-2">
                {incomingCall.callerData?.full_name || incomingCall.callerData?.email}
              </h3>
              <p className="text-white/90 text-sm">Incoming voice call</p>
            </div>

            {/* Call Controls */}
            <div className="p-6 flex items-center justify-center space-x-6">
              <button
                onClick={rejectCall}
                className="flex flex-col items-center space-y-2 p-4 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                  <PhoneOff className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium">Decline</span>
              </button>

              <button
                onClick={acceptCall}
                className="flex flex-col items-center space-y-2 p-4 rounded-full bg-green-50 hover:bg-green-100 text-green-600 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium">Accept</span>
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
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={`bg-white rounded-3xl overflow-hidden shadow-2xl ${isFullscreen ? 'w-full h-full' : 'w-full max-w-md h-[600px]'
            }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                {targetUser?.avatar_url ? (
                  <img
                    src={targetUser.avatar_url}
                    alt={targetUser?.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {targetUser?.full_name || targetUser?.email}
                </h3>
                <div className="flex items-center space-x-2">
                  <p className="text-white/90 text-sm">
                    {isConnected ? formatDuration(duration) : isConnecting ? 'Connecting...' : 'Voice Call'}
                  </p>
                  {isConnected && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-200 text-xs font-medium">Connected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Call Area */}
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            {/* Hidden audio element for remote stream */}
            <audio
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="hidden"
            />

            <div className="text-center">
              {/* Large Avatar */}
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-white to-gray-100 flex items-center justify-center overflow-hidden mx-auto mb-8 shadow-2xl border-4 border-white">
                {targetUser?.avatar_url ? (
                  <img
                    src={targetUser.avatar_url}
                    alt={targetUser?.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>

              {/* User Info */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {targetUser?.full_name || targetUser?.email}
              </h2>
              <div className="flex items-center justify-center space-x-2 mb-8">
                {targetUser?.user_type && (
                  <span className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                    {targetUser.user_type}
                  </span>
                )}
                <span className="text-gray-500 text-sm">
                  {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Voice Call'}
                </span>
              </div>

              {/* Connecting Animation */}
              {(isConnecting || (isCallInitiated && !isConnected)) && (
                <div className="flex items-center justify-center space-x-3 mb-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#FF6B35]"></div>
                  <span className="text-gray-700 font-medium">Connecting...</span>
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
          <div className="flex items-center justify-center space-x-6 p-6 bg-gray-50">
            {/* Audio Toggle */}
            <button
              onClick={handleToggleAudio}
              className={`p-4 rounded-full transition-all duration-200 ${isAudioOn
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
