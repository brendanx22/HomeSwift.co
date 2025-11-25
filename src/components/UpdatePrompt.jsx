import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

const UpdatePrompt = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered:', r);
            // Check for updates every hour
            r && setInterval(() => {
                r.update();
            }, 60 * 60 * 1000);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    const handleUpdate = () => {
        updateServiceWorker(true);
    };

    return (
        <AnimatePresence>
            {(offlineReady || needRefresh) && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-4 right-4 z-[9999] max-w-md"
                >
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#FF6B35] to-orange-500 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <RefreshCw className="w-5 h-5 text-white" />
                                <h3 className="text-white font-semibold">
                                    {offlineReady ? 'App ready to work offline' : 'New version available!'}
                                </h3>
                            </div>
                            <button
                                onClick={close}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4">
                            <p className="text-gray-700 text-sm mb-4">
                                {offlineReady
                                    ? 'The app is ready to work offline.'
                                    : 'A new version of HomeSwift is available. Click "Update" to get the latest features and fixes.'}
                            </p>

                            <div className="flex items-center space-x-3">
                                {needRefresh && (
                                    <button
                                        onClick={handleUpdate}
                                        className="flex-1 bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white px-4 py-2.5 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        <span>Update Now</span>
                                    </button>
                                )}
                                <button
                                    onClick={close}
                                    className="px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                                >
                                    {needRefresh ? 'Later' : 'Close'}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UpdatePrompt;
