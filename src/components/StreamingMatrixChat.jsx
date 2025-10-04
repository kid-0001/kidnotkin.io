"use client";

import { useState, useEffect } from 'react';

export default function StreamingMatrixChat() {
    const [connected, setConnected] = useState(false);
    const [hasElementSession, setHasElementSession] = useState(false);

    useEffect(() => {
        testMatrixConnection();
        checkElementSession();
    }, []);

    async function testMatrixConnection() {
        try {
            const response = await fetch('https://matrix.kidnotkin.io/_matrix/client/versions');
            const data = await response.json();
            setConnected(data.versions && data.versions.length > 0);
        } catch (error) {
            setConnected(false);
        }
    }

    function checkElementSession() {
        // Check if user has active Element session
        const elementTokens = [
            localStorage.getItem('mx_access_token'),
            sessionStorage.getItem('mx_access_token'),
            localStorage.getItem('@riot-web/access-token'),
            // Element Web stores tokens in various keys
        ].filter(Boolean);
        
        setHasElementSession(elementTokens.length > 0);
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

    return (
        <div className="flex flex-col h-full bg-[#0e0e10] text-white font-mono text-sm">
            <div className="p-3 bg-[#18181b] border-b border-gray-700">
                <h3 className="text-sm font-semibold flex items-center">
                    LIVE CHAT 
                    <span className={`ml-2 w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </h3>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-64">
                    {connected ? (
                        <>
                            <div className="text-white text-sm font-medium">
                                💬 Live Chat Active
                            </div>
                            <div className="text-gray-400 text-xs leading-relaxed">
                                {hasElementSession ? 
                                    'Continue your Matrix session →' : 
                                    'Anyone can view • Account needed to chat'
                                }
                            </div>
                            <button 
                                onClick={openElementChat}
                                className="w-full bg-[#9147ff] hover:bg-purple-600 px-4 py-3 rounded font-medium transition-colors text-sm"
                            >
                                {hasElementSession ? 'Continue Chatting' : 'Join Discussion'}
                            </button>
                            {!hasElementSession && (
                                <button 
                                    onClick={() => window.open('https://app.element.io/#/register', '_blank')}
                                    className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium transition-colors text-xs"
                                >
                                    Create Free Account
                                </button>
                            )}
                            <div className="text-gray-500 text-xs">
                                Matrix-powered • Privacy-first
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-red-400 text-sm">Chat Offline</div>
                            <button 
                                onClick={openElementChat}
                                className="w-full bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-medium transition-colors text-sm"
                            >
                                Try Element Chat
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="p-2 border-t border-gray-700 bg-[#18181b] text-center">
                <div className="text-xs text-gray-400">
                    Secure decentralized chat
                </div>
            </div>
        </div>
    );
}
