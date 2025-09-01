export class LocationService {
  static busRoutes = {
    '66d0123456a1b2c3d4e5f601': [
      { lat: 29.0167, lng: 77.6833, name: 'MIET Campus, Meerut' },
      { lat: 29.0456, lng: 77.7042, name: 'Meerut Bypass' },
      { lat: 29.1234, lng: 77.7456, name: 'Partapur' },
      { lat: 29.1678, lng: 77.8123, name: 'Hastinapur Road' },
      { lat: 29.4567, lng: 77.9234, name: 'Muzaffarnagar Bypass' },
      { lat: 29.4700, lng: 77.7100, name: 'Muzaffarnagar City Center' }
    ],
    '66d0123456a1b2c3d4e5f602': [
      { lat: 29.0167, lng: 77.6833, name: 'MIET Campus, Meerut' },
      { lat: 28.9845, lng: 77.7036, name: 'Meerut Cantt' },
      { lat: 28.6692, lng: 77.4538, name: 'Ghaziabad' },
      { lat: 28.6304, lng: 77.2177, name: 'Delhi Border' },
      { lat: 28.6466, lng: 77.2781, name: 'ISBT Anand Vihar' },
      { lat: 28.6139, lng: 77.2090, name: 'Connaught Place, Delhi' }
    ]
  };

  static busInfo = {
    '66d0123456a1b2c3d4e5f601': {
      busNumber: 'BUS-001',
      route: 'MIET to Muzaffarnagar',
      driver: 'Rajesh Kumar',
      stops: [
        'MIET Campus',
        'Meerut Bypass', 
        'Partapur',
        'Hastinapur Road',
        'Muzaffarnagar Bypass',
        'Muzaffarnagar City Center'
      ]
    },
    '66d0123456a1b2c3d4e5f602': {
      busNumber: 'BUS-002',
      route: 'MIET to Delhi',
      driver: 'Suresh Singh',
      stops: [
        'MIET Campus',
        'Meerut Cantt',
        'Ghaziabad', 
        'Delhi Border',
        'ISBT Anand Vihar',
        'Connaught Place'
      ]
    }
  };

  static getCurrentLocation(busId) {
    const route = this.busRoutes[busId];
    if (!route) return null;

    try {
      // More realistic movement simulation - updated every 10 seconds
      const currentTime = Date.now();
      const cycleLength = route.length * 10000; // 10 seconds per stop
      const cyclePosition = (currentTime % cycleLength) / cycleLength;
      const totalStops = route.length;
      
      // Calculate current position along the route
      const exactPosition = cyclePosition * totalStops;
      const currentStopIndex = Math.floor(exactPosition) % totalStops;
      const nextStopIndex = (currentStopIndex + 1) % totalStops;
      
      // Interpolate between current and next stop
      const progress = exactPosition - Math.floor(exactPosition);
      const currentStop = route[currentStopIndex];
      const nextStop = route[nextStopIndex];
      
      const lat = currentStop.lat + (nextStop.lat - currentStop.lat) * progress;
      const lng = currentStop.lng + (nextStop.lng - currentStop.lng) * progress;
      
      return {
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
        name: progress < 0.5 ? currentStop.name : nextStop.name,
        timestamp: currentTime,
        speed: Math.floor(Math.random() * 30) + 25, // 25-55 km/h
        heading: this.calculateHeading(currentStop, nextStop),
        nextStop: nextStop.name,
        estimatedArrival: this.getEstimatedArrival(progress, currentStopIndex, totalStops),
        currentStop: this.getCurrentStopFromRoute(progress, currentStop, nextStop),
        routeProgress: Math.round((currentStopIndex + progress) / totalStops * 100)
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return route[0]; // Return first stop as fallback
    }
  }

  static calculateHeading(from, to) {
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    
    const heading = Math.atan2(y, x) * 180 / Math.PI;
    return (heading + 360) % 360;
  }

  static getEstimatedArrival(progress, currentStopIndex, totalStops) {
    if (currentStopIndex >= totalStops - 1) return 'Final Stop';
    
    // Calculate remaining time to next stop (10 seconds per stop in simulation)
    const remainingProgress = 1 - progress;
    const secondsToNextStop = Math.ceil(remainingProgress * 10);
    
    if (secondsToNextStop < 60) {
      return `${secondsToNextStop}s`;
    } else {
      const minutes = Math.floor(secondsToNextStop / 60);
      const seconds = secondsToNextStop % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  static getCurrentStopFromRoute(progress, currentStop, nextStop) {
    if (progress < 0.1) {
      return `At ${currentStop.name.split(',')[0]}`;
    } else if (progress > 0.9) {
      return `Approaching ${nextStop.name.split(',')[0]}`;
    } else {
      return `En route to ${nextStop.name.split(',')[0]}`;
    }
  }

  static getAllBusLocations() {
    // Only return real GPS locations, no simulated data
    return this.getAllRealLocations();
  }

  static startLocationUpdates(callback, interval = 10000) { // Changed to 10 seconds
    // Initial call
    const locations = this.getAllBusLocations();
    callback(locations);
    
    const updateInterval = setInterval(() => {
      const locations = this.getAllBusLocations();
      callback(locations);
    }, interval);

    return updateInterval;
  }

  static stopLocationUpdates(intervalId) {
    clearInterval(intervalId);
  }

  // Real GPS tracking methods
  static async getCurrentRealLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp,
            altitude: position.coords.altitude
          });
        },
        (error) => {
          reject(error);
        },
        options
      );
    });
  }

  static startRealTimeTracking(driverId, busId, callback) {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          driverId,
          busId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0,
          timestamp: position.timestamp,
          altitude: position.coords.altitude
        };

        // Save to backend/localStorage
        this.saveRealLocation(locationData);
        
        // Call callback with new location
        callback(locationData);
      },
      (error) => {
        console.error('GPS tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 second timeout
        maximumAge: 10000 // 10 second cache
      }
    );

    return watchId;
  }

  static stopRealTimeTracking(watchId) {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  static async saveRealLocation(locationData) {
    try {
      // Get bus info
      const busInfo = this.busInfo[locationData.busId] || {};
      
      // Enhanced location data with route information
      const enhancedLocationData = {
        ...locationData,
        busNumber: busInfo.busNumber,
        route: busInfo.route,
        stops: busInfo.stops,
        currentStop: this.getCurrentStop(locationData.lat, locationData.lng, locationData.busId),
        nextStop: this.getNextStop(locationData.lat, locationData.lng, locationData.busId)
      };

      // Save to localStorage
      const key = `real_location_${locationData.busId}`;
      const existingData = JSON.parse(localStorage.getItem(key) || '[]');
      
      existingData.unshift({
        ...enhancedLocationData,
        savedAt: new Date().toISOString()
      });

      if (existingData.length > 100) {
        existingData.splice(100);
      }

      localStorage.setItem(key, JSON.stringify(existingData));
      localStorage.setItem(`latest_location_${locationData.busId}`, JSON.stringify(enhancedLocationData));

      return { success: true };
    } catch (error) {
      console.error('Error saving real location:', error);
      return { success: false, error: error.message };
    }
  }

  static getCurrentStop(lat, lng, busId) {
    const route = this.busRoutes[busId];
    if (!route) return 'Unknown Location';

    let closestStop = route[0];
    let minDistance = this.calculateDistance(lat, lng, route[0].lat, route[0].lng);

    route.forEach(stop => {
      const distance = this.calculateDistance(lat, lng, stop.lat, stop.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestStop = stop;
      }
    });

    // If very close to a stop (within 500m), show as "at stop"
    if (minDistance < 0.5) {
      return `At ${closestStop.name}`;
    } else {
      return `Near ${closestStop.name}`;
    }
  }

  static getNextStop(lat, lng, busId) {
    const route = this.busRoutes[busId];
    if (!route) return 'Unknown';

    // Find current position in route
    let closestStopIndex = 0;
    let minDistance = this.calculateDistance(lat, lng, route[0].lat, route[0].lng);

    route.forEach((stop, index) => {
      const distance = this.calculateDistance(lat, lng, stop.lat, stop.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestStopIndex = index;
      }
    });

    // Return next stop in sequence
    if (closestStopIndex < route.length - 1) {
      return route[closestStopIndex + 1].name;
    }

    return 'Final Destination';
  }

  static getRouteProgress(lat, lng, busId) {
    const route = this.busRoutes[busId];
    if (!route) return { completed: 0, total: 0, percentage: 0 };

    let currentStopIndex = 0;
    let minDistance = this.calculateDistance(lat, lng, route[0].lat, route[0].lng);

    route.forEach((stop, index) => {
      const distance = this.calculateDistance(lat, lng, stop.lat, stop.lng);
      if (distance < minDistance) {
        minDistance = distance;
        currentStopIndex = index;
      }
    });

    return {
      completed: currentStopIndex,
      total: route.length,
      percentage: Math.round((currentStopIndex / (route.length - 1)) * 100)
    };
  }

  // Method to check if bus is at the correct location for attendance submission
  static isAtSubmissionLocation(lat, lng, busId, tripType) {
    const route = this.busRoutes[busId];
    if (!route) return false;

    let targetStop = null;
    
    if (tripType === 'home-to-campus') {
      // Enable submit at the last stop before campus (second last stop)
      targetStop = route[route.length - 2]; // Second last stop
    } else if (tripType === 'campus-to-home') {
      // Enable submit at the student end stop (last stop - home)
      targetStop = route[route.length - 1]; // Last stop (home)
    }

    if (!targetStop) return false;

    // Calculate distance to target stop
    const distance = this.calculateDistance(lat, lng, targetStop.lat, targetStop.lng);
    
    // Allow submission if within 1km of target stop
    return distance <= 1.0; // 1km radius
  }

  // Get the target stop name for submission
  static getSubmissionStopName(busId, tripType) {
    const route = this.busRoutes[busId];
    if (!route) return 'Unknown Location';

    if (tripType === 'home-to-campus') {
      return route[route.length - 2]?.name || 'Second Last Stop';
    } else if (tripType === 'campus-to-home') {
      return route[route.length - 1]?.name || 'Final Stop';
    }
    
    return 'Unknown Location';
  }

  // Get distance to submission location
  static getDistanceToSubmissionLocation(lat, lng, busId, tripType) {
    const route = this.busRoutes[busId];
    if (!route) return null;

    let targetStop = null;
    
    if (tripType === 'home-to-campus') {
      targetStop = route[route.length - 2];
    } else if (tripType === 'campus-to-home') {
      targetStop = route[route.length - 1];
    }

    if (!targetStop) return null;

    const distance = this.calculateDistance(lat, lng, targetStop.lat, targetStop.lng);
    return {
      distance: distance,
      targetStop: targetStop.name,
      withinRange: distance <= 1.0
    };
  }

  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static getRealLocation(busId) {
    try {
      const latest = localStorage.getItem(`latest_location_${busId}`);
      return latest ? JSON.parse(latest) : null;
    } catch (error) {
      console.error('Error getting real location:', error);
      return null;
    }
  }

  static getAllRealLocations() {
    const locations = [];
    for (const busId of Object.keys(this.busRoutes)) {
      const location = this.getRealLocation(busId);
      if (location) {
        locations.push(location);
      }
    }
    return locations;
  }

  static updateBusLocation(busId, location) {
    try {
      // Store the latest location for this bus
      localStorage.setItem(`latest_location_${busId}`, JSON.stringify({
        ...location,
        busId,
        lastUpdated: new Date().toISOString()
      }));
      
      // Also store in session for immediate access
      sessionStorage.setItem(`current_bus_location_${busId}`, JSON.stringify(location));
      
      console.log(`Updated location for bus ${busId}:`, location);
      return true;
    } catch (error) {
      console.error('Error updating bus location:', error);
      return false;
    }
  }
}
