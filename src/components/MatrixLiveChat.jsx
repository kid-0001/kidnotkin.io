"use client";

import { useState, useEffect } from 'react';

export default function MatrixLiveChat() {
    const [showIframe, setShowIframe] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);

    useEffect(() => {
        // Since API access is blocked by room permissions, go straight to iframe
        setShowIframe(true);
    }, []);

    const openElementRoom = () => {
        const url = 'https://app.element.io/#/room/#live-chat:kidnotkin.io';
        window.open(url, '_blank');
    };

    if (!showIframe) {
        return (
            <div className="flex items-center justify-center h-full bg-[#0e0e10] text-white p-4">
                <div className="text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <div className="text-sm text-gray-400">Loading chat...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0e0e10]">
            {/* Header */}
            <div className="p-2 bg-[#18181b] border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                <span className="text-sm font-semibold text-white">LIVE CHAT</span>
                <button 
                    onClick={openElementRoom}
                    className="text-xs bg-[#9147ff] hover:bg-purple-600 px-2 py-1 rounded transition-colors text-white"
                >
                    Pop Out
                </button>
            </div>

            {/* Element Iframe */}
            <div className="flex-1 relative">
                {!iframeLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0e0e10] text-white">
                        <div className="text-center">
                            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                            <div className="text-sm text-gray-400">Loading Element...</div>
                        </div>
                    </div>
                )}
                
                <iframe
                    src="https://app.element.io/#/room/#live-chat:kidnotkin.io"
                    className="w-full h-full border-0"
                    onLoad={() => setIframeLoaded(true)}
                    onError={() => {
                        console.error('Element iframe failed to load');
                        setIframeLoaded(true); // Remove loading spinner even on error
                    }}
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-popups-to-escape-sandbox"
                    referrerPolicy="no-referrer"
                />
            </div>
        </div>
    );
}
