export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">kidnotkin.io</h1>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <iframe
            src="https://stream.place/embed/kidnotkin.bsky.social"
            className="w-full aspect-video"
            frameBorder="0"
            allowFullScreen
          />
        </div>
        
        <div className="bg-gray-800 rounded p-4">
          <iframe
            src="https://cinny.kidnotkin.io"
            className="w-full h-96"
            frameBorder="0"
          />
        </div>
      </div>
    </div>
  );
}
