import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleMaps } from '../hooks/useGoogleMaps.js';
import { LocationService } from '../utils/locationService.js';
import GoogleMap from '../components/GoogleMap.jsx';

export default function LiveMap() {
  const [busLocations, setBusLocations] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const navigate = useNavigate();
  
  // Replace with your Google Maps API key
  const { isLoaded, error } = useGoogleMaps('AIzaSyDRrEGi2nzH-3W2qqhOCFzZuRms5tGeYvI');

  const buses = [
    {
      id: '66d0123456a1b2c3d4e5f601',
      busNumber: 'BUS-001',
      route: 'Route A - City Center to College',
      driver: 'Rajesh Kumar',
      status: 'Active'
    },
    {
      id: '66d0123456a1b2c3d4e5f602',
      busNumber: 'BUS-002',
      route: 'Route B - Airport to College', 
      driver: 'Suresh Singh',
      status: 'Active'
    }
  ];

  useEffect(() => {
    // Start location updates
    const intervalId = LocationService.startLocationUpdates((locations) => {
      const updatedBuses = buses.map(bus => {
        const locationData = locations.find(loc => loc.busId === bus.id);
        return {
          ...bus,
          lat: locationData?.location?.lat || 28.6139,
          lng: locationData?.location?.lng || 77.2090,
          lastUpdate: new Date().toLocaleTimeString(),
          speed: locationData?.location?.speed || 0
        };
      });
      setBusLocations(updatedBuses);
    }, 5000); // Update every 5 seconds

    return () => LocationService.stopLocationUpdates(intervalId);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Map Loading Error</h2>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Please check your Google Maps API key</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <div className="relative bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200 z-10">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                🗺️ <span className="ml-2">Live Bus Tracking</span>
              </h1>
              <p className="text-gray-600">Real-time bus locations and routes</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-bold mb-4">Active Buses</h2>
            <div className="space-y-3">
              {busLocations.map(bus => (
                <div
                  key={bus.id}
                  onClick={() => setSelectedBus(bus.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedBus === bus.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{bus.busNumber}</h3>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-xs text-green-600">Live</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{bus.driver}</p>
                  <p className="text-xs text-gray-500 mb-2">{bus.route}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Speed: {bus.speed || 0} km/h</span>
                    <span>Updated: {bus.lastUpdate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1">
          <GoogleMap
            busLocations={busLocations}
            selectedBus={selectedBus}
            center={{ lat: 28.6139, lng: 77.2090 }}
            zoom={12}
          />
        </div>
      </div>
    </div>
  );
}
