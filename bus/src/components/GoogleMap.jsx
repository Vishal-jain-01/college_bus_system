import { useState, useEffect } from 'react';

export default function GoogleMap({ busLocations, selectedBus, center, zoom = 12 }) {
  const [currentBus, setCurrentBus] = useState(null);

  useEffect(() => {
    if (busLocations && busLocations.length > 0) {
      const bus = selectedBus 
        ? busLocations.find(b => b.id === selectedBus)
        : busLocations[0];
      setCurrentBus(bus);
    }
  }, [busLocations, selectedBus]);

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg border border-gray-300 flex items-center justify-center relative overflow-hidden">
      {/* Map placeholder with bus info */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-blue-100 to-purple-100"></div>
      
      {/* Grid pattern to simulate map */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="border-b border-gray-300" style={{ height: '5%' }}></div>
        ))}
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute border-r border-gray-300 top-0 bottom-0" style={{ left: `${i * 5}%`, width: '1px' }}></div>
        ))}
      </div>

      {/* Bus locations */}
      <div className="relative z-10 text-center">
        {currentBus ? (
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 max-w-sm">
            <div className="text-6xl mb-4 animate-bounce">🚌</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{currentBus.busNumber}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Driver:</strong> {currentBus.driver}</p>
              <p><strong>Current Location:</strong> {currentBus.name || 'Moving'}</p>
              <p><strong>Speed:</strong> {currentBus.speed || 0} km/h</p>
              <p><strong>Next Stop:</strong> {currentBus.nextStop || 'Unknown'}</p>
              {currentBus.estimatedArrival && (
                <p><strong>ETA:</strong> {currentBus.estimatedArrival}</p>
              )}
              <div className="flex items-center justify-center mt-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-green-600 font-semibold">Live Tracking</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Map View</h3>
            <p className="text-gray-600">Bus locations will appear here</p>
            <p className="text-sm text-gray-500 mt-2">
              Note: Add Google Maps API key for interactive map
            </p>
          </div>
        )}
      </div>

      {/* Floating bus icons for multiple buses */}
      {busLocations && busLocations.length > 1 && (
        <div className="absolute top-4 right-4 space-y-2">
          {busLocations.map((bus, index) => (
            <div
              key={bus.id}
              className={`p-2 rounded-full ${
                selectedBus === bus.id ? 'bg-blue-500' : 'bg-gray-500'
              } text-white text-sm shadow-lg transform hover:scale-110 transition-all cursor-pointer`}
              onClick={() => setCurrentBus(bus)}
              style={{
                animationDelay: `${index * 0.5}s`
              }}
            >
              🚌
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
