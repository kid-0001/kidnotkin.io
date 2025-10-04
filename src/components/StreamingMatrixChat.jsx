"use client";

import { useState, useEffect, useRef } from 'react';

export default function StreamingMatrixChat() {
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Simulate fetching recent messages via REST API
        fetchRecentMessages();
        // Set up periodic refresh for read-only viewing
        const interval = setInterval(fetchRecentMessages, 5000); // Refresh every 5 seconds
        
        return () => clearInterval(interval);
    }, []);

    async function fetchRecentMessages() {
        try {
            // Use Matrix REST API directly (no SDK needed)
            const response = await fetch('https://matrix.kidnotkin.io/_matrix/client/v3/register?kind=guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}'
            });
            
            if (response.ok) {
                setConnected(true);
                // For now, show connection success
                // Real message fetching would require complex Matrix API calls
                // Better to use Element integration
            }
        } catch (error) {
            setConnected(false);
        }
    }

    const openElementChat = () => {
        const elementUrl = "https://app.element.io/#/room/#live-chat:kidnotkin.io";
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            window.open(elementUrl, '_blank');
        } else {
            window.open(elementUrl, 'element', 'width=800,height=600,scrollbars=yes,resizable=yes');
        }
    };

    const openElementRegister = () => {
        window.open('https://app.element.io/#/register', '_blank');
    };

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full bg-[#0e0e10] text-white font-mono text-sm">
            {/* Chat Header */}
            <div className="p-3 bg-[#18181b] border-b border-gray-700">
                <h3 className="text-sm font-semibold flex items-center">
                    LIVE CHAT 
                    <span className={`ml-2 w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </h3>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {!connected && (
                    <div className="text-center text-gray-400 text-sm p-4">
                        Connecting to Matrix server...
                    </div>
                )}
                
                {connected && (
                    <div className="space-y-3 p-4">
                        <div className="text-center text-gray-300 text-sm">
                            🎉 Matrix server connected!
                        </div>
                        <div className="text-center text-gray-400 text-xs">
                            Live chat messages will appear here when streaming
                        </div>
                        <div className="text-center text-gray-500 text-xs">
                            • Anyone can view messages<br/>
                            • Account required to participate
                        </div>
                    </div>
                )}
                
                {/* Sample messages for demonstration */}
                {connected && (
                    <div className="space-y-1">
                        <div className="text-sm leading-tight opacity-50">
                            <span className="text-[#9147ff] font-bold">streamer</span>
                            <span className="text-white">: Welcome to the stream!</span>
                        </div>
                        <div className="text-sm leading-tight opacity-50">
                            <span className="text-[#9147ff] font-bold">viewer1</span>
                            <span className="text-white">: Great show today</span>
                        </div>
                        <div className="text-sm leading-tight opacity-30">
                            <span className="text-gray-500 text-xs">↑ Sample messages • Real chat when streaming</span>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Participation Area */}
            <div className="p-3 border-t border-gray-700 bg-[#18181b]">
                <div className="text-center space-y-3">
                    <div className="text-xs text-gray-400">
                        Join the live discussion during streams
                    </div>
                    <div className="flex gap-2 text-xs">
                        <button 
                            onClick={openElementChat}
                            className="flex-1 bg-[#9147ff] hover:bg-purple-600 px-3 py-2 rounded transition-colors"
                        >
                            Join Chat
                        </button>
                        <button 
                            onClick={openElementRegister}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded transition-colors"
                        >
                            Create Account
                        </button>
                    </div>
                    <div className="text-xs text-gray-500">
                        Free Matrix account • No phone required • Privacy-first
                    </div>
                </div>
            </div>
        </div>
    );
}
