"use client";

import { useState, useEffect } from 'react';
import EmbeddedMatrixChat from '../components/EmbeddedMatrixChat';

export default function StreamingPage() {
    const [chatVisible, setChatVisible] = useState(true);
    const [isLandscape, setIsLandscape] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth <= 1024);
        };
        
        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);
        
        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                <h1 className="text-xl md:text-2xl font-bold text-blue-400">kidnotkin.io</h1>
                
                <button 
                    onClick={() => setChatVisible(!chatVisible)}
                    className="hidden lg:block bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm transition-colors"
                >
                    {chatVisible ? 'Hide Chat' : 'Show Chat'}
                </button>
            </header>
            
            <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
                
                <div className={`flex-1 p-4 ${chatVisible && !isLandscape ? 'lg:pr-2' : ''}`}>
                    <div className="relative w-full h-full bg-black rounded overflow-hidden" style={{ minHeight: isLandscape ? '50vh' : '40vh' }}>
                        <iframe
                            src="https://stream.place/embed/kidnotkin.bsky.social"
                            className="absolute inset-0 w-full h-full"
                            frameBorder="0"
                            allowFullScreen
                            allow="autoplay; fullscreen; picture-in-picture; web-share"
                            loading="lazy"
                            style={{ minHeight: '400px' }}
                        />
                    </div>
                </div>
                
                {chatVisible && (
                    <div className={`
                        ${isLandscape ? 'absolute right-0 top-16 bottom-0 w-80 z-10 bg-gray-900/95 backdrop-blur' : 'lg:w-80 lg:flex-shrink-0'}
                        flex flex-col border-l border-gray-700
                    `}>
                        <EmbeddedMatrixChat />
                    </div>
                )}
                
                {!chatVisible && (
                    <button 
                        onClick={() => setChatVisible(true)}
                        className="fixed right-4 top-20 bg-[#9147ff] hover:bg-purple-600 p-3 rounded-full shadow-lg z-20 transition-colors"
                    >
                        💬
                    </button>
                )}
            </div>
        </div>
    );
}
