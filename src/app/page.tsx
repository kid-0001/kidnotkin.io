"use client";

import { useState, useEffect } from 'react';

export default function StreamingPage() {
  const [chatVisible, setChatVisible] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);

  // Detect orientation changes
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

  const openChat = () => {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      window.open('https://cinny.kidnotkin.io/#/room/!Hbp8rkibQKPAM_zITbO2NFXtuTelQllH2eBFA2vrdRk:kidnotkin.io', '_blank');
    } else {
      window.open('https://cinny.kidnotkin.io/#/room/!Hbp8rkibQKPAM_zITbO2NFXtuTelQllH2eBFA2vrdRk:kidnotkin.io', 
        'matrixchat', 'width=800,height=600,scrollbars=yes,resizable=yes');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with chat toggle */}
      <header className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-blue-400">kidnotkin.io</h1>
        
        {/* Chat toggle - hidden on mobile portrait */}
        {!(!isLandscape && window.innerWidth <= 768) && (
          <button 
            onClick={() => setChatVisible(!chatVisible)}
            className="md:hidden lg:block bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm transition-colors"
          >
            {chatVisible ? 'Hide Chat' : 'Show Chat'}
          </button>
        )}
      </header>
      
      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
        
        {/* Video Section */}
        <div className={`flex-1 p-4 ${chatVisible && !isLandscape ? 'lg:pr-2' : ''}`}>
          <div className="relative w-full h-full bg-black rounded overflow-hidden" style={{ minHeight: isLandscape ? '50vh' : '40vh' }}>
            <iframe
              src="https://stream.place/embed/kidnotkin.bsky.social?mode=hls&autoplay=false"
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture; web-share"
              loading="lazy"
              style={{ minHeight: '400px' }}
            />
          </div>
        </div>
        
        {/* Chat Section - Collapsible */}
        {chatVisible && (
          <div className={`
            ${isLandscape ? 'absolute right-0 top-16 bottom-0 w-80 z-10 bg-gray-900/95 backdrop-blur' : 'lg:w-80 lg:flex-shrink-0'}
            flex flex-col border-l border-gray-700
          `}>
            
            {/* Chat Header */}
            <div className="p-3 bg-[#18181b] border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-sm md:text-base font-semibold">STREAM CHAT</h3>
              <button 
                onClick={() => setChatVisible(false)}
                className="text-gray-400 hover:text-white text-lg"
              >
                ×
              </button>
            </div>
            
            {/* Chat Content */}
            <div className="flex-1 bg-[#0e0e10] flex items-center justify-center p-4">
              <div className="text-center space-y-4">
                <div className="text-gray-400 text-sm">Join the live discussion</div>
                <button 
                  onClick={openChat}
                  className="bg-[#9147ff] hover:bg-purple-600 px-4 py-2 rounded font-semibold transition-colors text-sm w-full"
                >
                  Open Live Chat
                </button>
                <div className="text-xs text-gray-500">
                  <a href="https://cinny.kidnotkin.io" target="_blank" className="text-[#9147ff] hover:underline">
                    Create account →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Show chat button when hidden */}
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
