"use client";

import { useState, useEffect } from 'react';
import StreamingMatrixChat from '../components/StreamingMatrixChat.jsx';

export default function StreamingPage() {
    const [chatVisible, setChatVisible] = useState(true);
    const [chatWidth, setChatWidth] = useState(320);
    const [isLandscape, setIsLandscape] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

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

    const handleMouseDown = (e: React.MouseEvent) => {  // Fix: Add proper typing
        setIsResizing(true);
        const startX = e.clientX;
        const startWidth = chatWidth;

        const handleMouseMove = (e: MouseEvent) => {  // Fix: Add proper typing
            const deltaX = startX - e.clientX;
            const newWidth = Math.min(Math.max(280, startWidth + deltaX), 600);
            setChatWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

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
            
            <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)] relative">
                
                {/* Video Section - Dynamic Width */}
                <div 
                    className="flex-1 p-4"
                    style={{ 
                        width: chatVisible && typeof window !== 'undefined' && window.innerWidth >= 1024 ? `calc(100% - ${chatWidth}px)` : '100%',
                        transition: isResizing ? 'none' : 'width 0.2s ease'
                    }}
                >
                    {/* Responsive Video Container - NO BLACK BARS */}
                    <div 
                        className="relative w-full bg-black rounded overflow-hidden"
                        style={{ 
                            aspectRatio: '16 / 9',  // Perfect 16:9 ratio
                            maxHeight: isLandscape ? '50vh' : '70vh'
                        }}
                    >
                        <iframe
                            src="https://stream.place/embed/kidnotkin.bsky.social"
                            className="absolute inset-0 w-full h-full"
                            style={{ 
                                border: 'none',
                                objectFit: 'fill'  // Fill container completely
                            }}
                            allowFullScreen
                            allow="autoplay; fullscreen; picture-in-picture; web-share"
                            loading="lazy"
                        />
                    </div>
                </div>
                
                {/* Resizable Chat Sidebar */}
                {chatVisible && (
                    <div 
                        className={`
                            ${isLandscape ? 'absolute right-0 top-16 bottom-0 bg-gray-900/95 backdrop-blur z-10' : 'lg:flex-shrink-0'}
                            flex flex-col border-l border-gray-700 relative
                        `}
                        style={{ 
                            width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${chatWidth}px` : 'auto',
                            transition: isResizing ? 'none' : 'width 0.2s ease'
                        }}
                    >
                        {/* Resize Handle - Desktop Only */}
                        <div 
                            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize bg-transparent hover:bg-blue-500 transition-colors hidden lg:block z-10"
                            onMouseDown={handleMouseDown}
                            style={{ marginLeft: '-2px' }}
                            title="Drag to resize chat"
                        />
                        
                        <StreamingMatrixChat />
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
