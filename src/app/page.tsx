"use client";

export default function StreamingPage() {
  const openChat = () => {
    // Better mobile detection
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // Direct link on mobile
      window.open('https://cinny.kidnotkin.io/#/room/!Hbp8rkibQKPAM_zITbO2NFXtuTelQllH2eBFA2vrdRk:kidnotkin.io', '_blank');
    } else {
      // Popup on desktop
      window.open('https://cinny.kidnotkin.io/#/room/!Hbp8rkibQKPAM_zITbO2NFXtuTelQllH2eBFA2vrdRk:kidnotkin.io', 
        'matrixchat', 'width=800,height=600,scrollbars=yes,resizable=yes');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile-first header */}
      <header className="p-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-xl md:text-2xl font-bold text-blue-400">kidnotkin.io</h1>
      </header>
      
      <div className="p-4">
        {/* Responsive grid - stacks on mobile */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          
          {/* Video - full width on mobile */}
          <div className="xl:col-span-2 order-1">
            <div className="relative w-full aspect-video bg-black rounded overflow-hidden">
              <iframe
                src="https://stream.place/embed/kidnotkin.bsky.social"
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </div>
          </div>
          
          {/* Chat - below video on mobile, sidebar on desktop */}
          <div className="order-2 xl:order-2">
            <div className="h-64 md:h-96 xl:h-[600px] bg-[#0e0e10] rounded overflow-hidden flex flex-col">
              <div className="p-3 bg-[#18181b] border-b border-gray-700">
                <h3 className="text-sm md:text-base font-semibold">STREAM CHAT</h3>
              </div>
              
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                  <div className="text-gray-400 text-sm md:text-base">Join the live discussion</div>
                  <button 
                    onClick={openChat}
                    className="bg-[#9147ff] hover:bg-purple-600 px-4 md:px-6 py-2 md:py-3 rounded font-semibold transition-colors text-sm md:text-base w-full md:w-auto"
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
          </div>
        </div>
      </div>
    </div>
  );
}
