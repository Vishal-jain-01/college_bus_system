import { useState, useEffect, useRef, useMemo } from 'react';

export default function GoogleMap({ busLocations, selectedBus, center, zoom = 15, onRefresh, isGoogleMapsAvailable = false }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [currentBus, setCurrentBus] = useState(null);
  const [useInteractiveMap, setUseInteractiveMap] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bounceIntervals, setBounceIntervals] = useState({});

  // Memoize bus locations to detect actual changes
  const memoizedBusLocations = useMemo(() => {
    if (!busLocations || busLocations.length === 0) return [];
    
    return busLocations.map(bus => ({
      id: bus.id || bus.busId,
      lat: parseFloat(bus.lat),
      lng: parseFloat(bus.lng),
      busNumber: bus.busNumber,
      driver: bus.driver,
      route: bus.route,
      speed: bus.speed || 0,
      name: bus.name || 'Moving',
      nextStop: bus.nextStop,
      timestamp: bus.timestamp || bus.lastUpdated,
      // Create a unique key to detect changes
      locationKey: `${bus.lat}-${bus.lng}-${bus.speed}-${bus.timestamp}`
    }));
  }, [busLocations]);

  useEffect(() => {
    if (memoizedBusLocations && memoizedBusLocations.length > 0) {
      const bus = selectedBus 
        ? memoizedBusLocations.find(b => b.id === selectedBus)
        : memoizedBusLocations[0];
      setCurrentBus(bus);
    } else {
      setCurrentBus(null);
    }
  }, [memoizedBusLocations, selectedBus]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    console.log('Manual refresh triggered');
    
    try {
      if (onRefresh) {
        await onRefresh();
      }
      
      // Add a brief delay for visual feedback
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error during manual refresh:', error);
      setIsRefreshing(false);
    }
  };

  // Check if bus locations have actually changed
  const locationsChanged = useMemo(() => {
    if (!lastUpdateTime || !memoizedBusLocations.length) return true;
    
    const hasNewData = memoizedBusLocations.some(bus => {
      const busTime = new Date(bus.timestamp).getTime();
      return busTime > lastUpdateTime;
    });
    
    return hasNewData;
  }, [memoizedBusLocations, lastUpdateTime]);

  // Try to load Google Maps API
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    // If parent component says Google Maps is available, wait for it
    if (isGoogleMapsAvailable) {
      let waitCount = 0;
      const checkInterval = setInterval(() => {
        waitCount++;
        if (window.google && window.google.maps) {
          console.log('Google Maps API found and loaded');
          setIsGoogleMapsLoaded(true);
          clearInterval(checkInterval);
        } else if (waitCount > 20) { // Wait up to 10 seconds
          console.warn('Google Maps API not accessible after waiting, using enhanced fallback map');
          setUseInteractiveMap(false);
          clearInterval(checkInterval);
        }
      }, 500);

      return () => clearInterval(checkInterval);
    }

    // Wait a bit for the API to load before falling back
    let waitCount = 0;
    const checkInterval = setInterval(() => {
      waitCount++;
      if (window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true);
        clearInterval(checkInterval);
      } else if (waitCount > 10) { // Wait up to 5 seconds
        console.warn('Google Maps API not loaded after waiting, using enhanced fallback map');
        setUseInteractiveMap(false);
        clearInterval(checkInterval);
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [isGoogleMapsAvailable]);

  // Initialize Google Map (only once)
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current || !useInteractiveMap || map) return;

    try {
      const mapCenter = center || (currentBus ? { lat: currentBus.lat, lng: currentBus.lng } : { lat: 28.6139, lng: 77.2090 });
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: zoom,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(mapInstance);
      console.log('Google Map initialized');
    } catch (error) {
      console.error('Error initializing Google Map:', error);
      setUseInteractiveMap(false);
    }
  }, [isGoogleMapsLoaded, useInteractiveMap, map]);

  // Continuous bouncing effect for active buses (only for interactive map)
  useEffect(() => {
    if (!markers.length || !useInteractiveMap || !isGoogleMapsLoaded) return;

    // Clear existing bounce intervals
    Object.values(bounceIntervals).forEach(interval => clearInterval(interval));
    
    // Create new bounce intervals for each marker
    const newBounceIntervals = {};
    
    markers.forEach((marker, index) => {
      if (marker && memoizedBusLocations[index]) {
        const busId = memoizedBusLocations[index].id;
        
        // Start continuous bouncing every 4 seconds for active buses
        newBounceIntervals[busId] = setInterval(() => {
          if (marker && marker.setAnimation) {
            marker.setAnimation(window.google.maps.Animation.BOUNCE);
            setTimeout(() => {
              if (marker && marker.setAnimation) marker.setAnimation(null);
            }, 2000);
          }
        }, 4000);
      }
    });
    
    setBounceIntervals(newBounceIntervals);
    
    return () => {
      Object.values(newBounceIntervals).forEach(interval => clearInterval(interval));
    };
  }, [markers, memoizedBusLocations, useInteractiveMap, isGoogleMapsLoaded]);

  // Update markers only when locations actually change
  useEffect(() => {
    if (!map || !memoizedBusLocations.length || !locationsChanged) {
      return;
    }

    console.log('Updating map markers due to location changes');

    // Clear existing markers
    markers.forEach(marker => {
      if (marker.setMap) {
        marker.setMap(null);
      }
    });

    const newMarkers = memoizedBusLocations.map((bus, busIndex) => {
      const marker = new window.google.maps.Marker({
        position: { lat: bus.lat, lng: bus.lng },
        map: map,
        title: `${bus.busNumber} - ${bus.driver}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="white" stroke-width="2"/>
              <text x="20" y="28" text-anchor="middle" fill="white" font-size="20">🚌</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20)
        },
        animation: window.google.maps.Animation.BOUNCE
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 300px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 24px; margin-right: 10px;">🚌</span>
              <h3 style="margin: 0; color: #1f2937; font-weight: bold;">${bus.busNumber || `Bus ${bus.id?.slice(-3)}`}</h3>
            </div>
            <div style="color: #4b5563; font-size: 14px;">
              <p style="margin: 5px 0;"><strong>Driver:</strong> ${bus.driver || 'Unknown Driver'}</p>
              <p style="margin: 5px 0;"><strong>Current Location:</strong> ${bus.name || 'Moving'}</p>
              <p style="margin: 5px 0;"><strong>Speed:</strong> ${bus.speed || 0} km/h</p>
              <p style="margin: 5px 0;"><strong>GPS Coordinates:</strong> ${bus.lat.toFixed(6)}, ${bus.lng.toFixed(6)}</p>
              <p style="margin: 5px 0;"><strong>Last Update:</strong> ${bus.timestamp ? new Date(bus.timestamp).toLocaleString() : 'Loading...'}</p>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        markers.forEach(m => { if (m.infoWindow) m.infoWindow.close(); });
        infoWindow.open(map, marker);
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 3000);
      });

      marker.infoWindow = infoWindow;
      
      // Stop bouncing after 3 seconds for new markers
      setTimeout(() => {
        marker.setAnimation(null);
      }, 3000);

      return marker;
    });

    setMarkers(newMarkers);

    // Update the map center only if there's a significant location change
    if (memoizedBusLocations.length > 0) {
      const firstBus = memoizedBusLocations[0];
      map.setCenter({ lat: firstBus.lat, lng: firstBus.lng });
      
      // Auto-open info window for first bus only on first load
      setTimeout(() => {
        if (newMarkers[0] && newMarkers[0].infoWindow && !lastUpdateTime) {
          newMarkers[0].infoWindow.open(map, newMarkers[0]);
        }
      }, 1000);
    }

    // Update the last update time
    setLastUpdateTime(Date.now());

  }, [map, memoizedBusLocations, locationsChanged]);

  // Enhanced fallback map when Google Maps is not available
  if (!useInteractiveMap || (!isGoogleMapsLoaded && useInteractiveMap)) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 rounded-lg border border-gray-300 relative overflow-hidden">
        {/* Enhanced map-like background */}
        <div className="absolute inset-0">
          {/* Street grid pattern */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(15)].map((_, i) => (
              <div key={`h-${i}`} className="border-b border-gray-400" style={{ height: '6.66%' }}></div>
            ))}
            {[...Array(15)].map((_, i) => (
              <div key={`v-${i}`} className="absolute border-r border-gray-400 top-0 bottom-0" style={{ left: `${i * 6.66}%`, width: '1px' }}></div>
            ))}
          </div>
          
          {/* Landmarks */}
          <div className="absolute top-6 left-6 text-2xl opacity-40">🏢</div>
          <div className="absolute top-12 right-8 text-2xl opacity-40">🏪</div>
          <div className="absolute bottom-8 left-12 text-2xl opacity-40">🏠</div>
          <div className="absolute bottom-6 right-6 text-2xl opacity-40">🌳</div>
        </div>

        {/* Multiple bouncing bus markers */}
        {memoizedBusLocations && memoizedBusLocations.map((bus, index) => (
          <div 
            key={bus.id || index}
            className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: `${30 + (index * 30)}%`, 
              top: `${35 + (index * 15)}%`
            }}
          >
            <div className="relative">
              {/* Bus icon with continuous bouncing */}
              <div 
                className="text-4xl animate-bounce" 
                style={{ 
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                  animation: `bounce ${1.5 + (index * 0.3)}s infinite`,
                  animationDelay: `${index * 0.5}s`
                }}
              >
                🚌
              </div>
              {/* Bus number badge */}
              <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg animate-pulse">
                {bus.busNumber?.replace('BUS-', '') || bus.id?.slice(-3) || `${index + 1}`}
              </div>
              {/* Live indicator with pulsing */}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex items-center bg-white rounded-full px-2 py-1 shadow-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                <span className="text-xs font-semibold text-green-600">LIVE</span>
              </div>
              {/* Speed indicator */}
              {bus.speed > 0 && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  {Math.round(bus.speed)} km/h
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Fallback single bus marker if no memoized locations */}
        {(!memoizedBusLocations || memoizedBusLocations.length === 0) && currentBus && (
          <div 
            className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: '50%', 
              top: '45%'
            }}
          >
            <div className="relative">
              {/* Bus icon with continuous bouncing */}
              <div 
                className="text-4xl animate-bounce" 
                style={{ 
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                  animation: 'bounce 1.5s infinite'
                }}
              >
                🚌
              </div>
              {/* Bus number badge */}
              <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg animate-pulse">
                {currentBus.busNumber?.replace('BUS-', '') || currentBus.id?.slice(-3) || '001'}
              </div>
              {/* Live indicator with pulsing */}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex items-center bg-white rounded-full px-2 py-1 shadow-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                <span className="text-xs font-semibold text-green-600">LIVE</span>
              </div>
              {/* Speed indicator */}
              {currentBus.speed > 0 && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  {Math.round(currentBus.speed)} km/h
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bus info panel - Multiple buses or single bus */}
        {memoizedBusLocations && memoizedBusLocations.length > 0 ? (
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-white/50 max-h-40 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-800">
                {memoizedBusLocations.length === 1 
                  ? memoizedBusLocations[0].busNumber
                  : `${memoizedBusLocations.length} Buses Tracking`
                }
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-semibold text-sm">Live GPS</span>
              </div>
            </div>
            
            {memoizedBusLocations.length === 1 ? (
              // Single bus detailed view
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div><strong>Driver:</strong> {memoizedBusLocations[0].driver}</div>
                <div><strong>Speed:</strong> {memoizedBusLocations[0].speed || 0} km/h</div>
                <div className="col-span-2"><strong>Route:</strong> {memoizedBusLocations[0].route}</div>
                <div className="col-span-2"><strong>Location:</strong> {memoizedBusLocations[0].name || 'Moving'}</div>
                {memoizedBusLocations[0].timestamp && (
                  <div className="col-span-2"><strong>Last Update:</strong> {new Date(memoizedBusLocations[0].timestamp).toLocaleTimeString()}</div>
                )}
              </div>
            ) : (
              // Multiple buses compact view
              <div className="space-y-2">
                {memoizedBusLocations.map((bus, index) => (
                  <div key={bus.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🚌</span>
                      <div>
                        <div className="font-semibold text-sm">{bus.busNumber}</div>
                        <div className="text-xs text-gray-600">{bus.driver}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{bus.speed || 0} km/h</div>
                      <div className="text-xs text-gray-600">
                        {bus.timestamp ? new Date(bus.timestamp).toLocaleTimeString() : 'Loading...'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : currentBus && (
          // Fallback single bus view
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-white/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-800">{currentBus.busNumber}</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-semibold text-sm">Live GPS</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div><strong>Driver:</strong> {currentBus.driver}</div>
              <div><strong>Speed:</strong> {currentBus.speed || 0} km/h</div>
              <div className="col-span-2"><strong>Route:</strong> {currentBus.route}</div>
              <div className="col-span-2"><strong>Location:</strong> {currentBus.name || 'Moving'}</div>
              {currentBus.timestamp && (
                <div className="col-span-2"><strong>Last Update:</strong> {new Date(currentBus.timestamp).toLocaleTimeString()}</div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600 font-semibold text-sm">Enhanced Map</span>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`ml-3 p-1 rounded-full transition-all ${
                isRefreshing 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-110'
              }`}
              title="Refresh bus locations"
            >
              <span className={`text-xs ${isRefreshing ? 'animate-spin' : ''}`}>
                {isRefreshing ? '🔄' : '🔄'}
              </span>
            </button>
          </div>
          {memoizedBusLocations && memoizedBusLocations.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mt-1">
                {memoizedBusLocations.length} bus{memoizedBusLocations.length > 1 ? 'es' : ''} tracking
              </p>
              <p className="text-xs text-blue-600">
                Last Updated: {lastUpdateTime ? new Date(lastUpdateTime).toLocaleTimeString() : 'Loading...'}
              </p>
              <p className="text-xs text-gray-500">
                {locationsChanged ? '🔄 Data refreshed' : '✓ No changes'}
              </p>
            </div>
          )}
        </div>

        {/* Notification about fallback mode */}
        <div className="absolute top-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-2 max-w-sm">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <p className="text-xs font-semibold text-yellow-800">Enhanced Map Mode</p>
              <p className="text-xs text-yellow-700">Using optimized fallback due to Google Maps limitations</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state for Google Maps
  if (useInteractiveMap && !isGoogleMapsLoaded) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg border border-gray-300 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🔄</div>
          <h3 className="text-lg font-semibold text-gray-700">Loading Interactive Map...</h3>
          <p className="text-gray-600">Initializing Google Maps API</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-full relative rounded-lg overflow-hidden">
        <div ref={mapRef} className="w-full h-full" />
        
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600 font-semibold text-sm">Interactive Map</span>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`ml-3 p-1 rounded-full transition-all ${
                isRefreshing 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-110'
              }`}
              title="Refresh bus locations"
            >
              <span className={`text-xs ${isRefreshing ? 'animate-spin' : ''}`}>
                {isRefreshing ? '🔄' : '🔄'}
              </span>
            </button>
          </div>
          {memoizedBusLocations && memoizedBusLocations.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mt-1">
                {memoizedBusLocations.length} bus{memoizedBusLocations.length > 1 ? 'es' : ''} tracking
              </p>
              <p className="text-xs text-blue-600">
                Last Updated: {lastUpdateTime ? new Date(lastUpdateTime).toLocaleTimeString() : 'Loading...'}
              </p>
              <p className="text-xs text-gray-500">
                {locationsChanged ? '🔄 Data refreshed' : '✓ No changes'}
              </p>
            </div>
          )}
        </div>

        {memoizedBusLocations && memoizedBusLocations.length > 1 && (
          <div className="absolute top-4 right-4 space-y-2">
            {memoizedBusLocations.map((bus, index) => (
              <button
                key={bus.id}
                onClick={() => {
                  map.panTo({ lat: bus.lat, lng: bus.lng });
                  map.setZoom(16);
                  const marker = markers[index];
                  if (marker && marker.infoWindow) {
                    markers.forEach(m => { if (m.infoWindow) m.infoWindow.close(); });
                    marker.infoWindow.open(map, marker);
                    if (marker.setAnimation) {
                      marker.setAnimation(window.google.maps.Animation.BOUNCE);
                      setTimeout(() => marker.setAnimation(null), 3000);
                    }
                  }
                }}
                className="block p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all hover:scale-110"
                title={`${bus.busNumber} - ${bus.driver}`}
              >
                <span className="text-sm">🚌</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <style>
        {`
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% {
              animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
              transform: translate3d(0,0,0);
            }
            40%, 43% {
              animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
              transform: translate3d(0, -20px, 0);
            }
            70% {
              animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
              transform: translate3d(0, -10px, 0);
            }
            90% {
              transform: translate3d(0, -4px, 0);
            }
          }
        `}
      </style>
    </>
  );
}
