export default function StreamingPage() {
  const openChat = () => {
    window.open('https://cinny.kidnotkin.io/#/room/!Hbp8rkibQKPAM_zITbO2NFXtuTelQllH2eBFA2vrdRk:kidnotkin.io', 
      'matrixchat', 'width=800,height=600,scrollbars=yes,resizable=yes');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-blue-400">kidnotkin.io</h1>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <iframe
            src="https://stream.place/embed/kidnotkin.bsky.social"
            className="w-full aspect-video rounded"
            frameBorder="0"
            allowFullScreen
          />
        </div>
        
        <div className="h-[600px] bg-[#0e0e10] rounded overflow-hidden flex flex-col">
          <div className="p-3 bg-[#18181b] border-b border-gray-700">
            <h3 className="text-white font-semibold">STREAM CHAT</h3>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-gray-400">Join the live discussion</div>
              <button 
                onClick={openChat}
                className="bg-[#9147ff] hover:bg-purple-600 px-6 py-3 rounded font-semibold transition-colors"
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
  );
}
