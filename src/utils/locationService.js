export class LocationService {
  static busRoutes = {
    '66d0123456a1b2c3d4e5f601': [
      { lat: 28.9730, lng: 77.6410, name: 'MIET Campus' },
      { lat: 28.9954, lng: 77.6456, name: 'rohta bypass' }, // Updated to your actual location
      { lat: 28.9938, lng: 77.6822, name: 'Meerut Cantt' },
      { lat: 29.0661, lng: 77.7104, name: 'modipuram' }
    ],
    '66d0123456a1b2c3d4e5f602': [
      { lat: 28.9730, lng: 77.6410, name: 'MIET Campus, Meerut' },
      { lat: 28.9938, lng: 77.6822, name: 'Meerut Cantt' },
      { lat: 28.6692, lng: 77.4538, name: 'Ghaziabad' },
      { lat: 28.61, lng: 77.23, name: 'Delhi Border' },
      { lat: 28.6477, lng: 77.3145, name: 'ISBT Anand Vihar' },
      { lat: 28.6304, lng: 77.2177, name: 'Connaught Place, Delhi' }
    ]
  };

  static busInfo = {
    '66d0123456a1b2c3d4e5f601': {
      busNumber: 'BUS-001',
      route: 'MIET to Muzaffarnagar',
      driver: 'Rajesh Kumar',
      stops: [
        'MIET Campus',
        'rohta bypass', 
        'Meerut Cantt',
        'modipuram'
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
    // First try to get real GPS location from driver
    const realLocation = this.getRealLocation(busId);
    if (realLocation) {
      console.log('📍 Using real driver GPS location for admin/student:', realLocation);
      return {
        lat: realLocation.lat,
        lng: realLocation.lng,
        currentStop: realLocation.currentStop,
        nextStop: realLocation.nextStop,
        routeProgress: realLocation.routeProgress,
        progressStatus: realLocation.progressStatus,
        speed: realLocation.speed || 0,
        timestamp: new Date(realLocation.timestamp).getTime(),
        name: realLocation.currentStop || 'Live GPS Location',
        lastUpdated: realLocation.timestamp,
        isRealLocation: true,
        locationSource: 'Driver GPS',
        distanceToCurrentStop: realLocation.distanceToCurrentStop,
        distanceToNextStop: realLocation.distanceToNextStop,
        driverName: realLocation.driverName,
        busNumber: realLocation.busNumber
      };
    }

    // Fallback - no simulation, return null if no real GPS data
    console.log('❌ No real GPS data available for bus:', busId);
    return null;
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
  }  static startLocationUpdates(callback, interval = 10000) { // Changed to 10 seconds
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
      
      // Calculate enhanced route information
      const routeProgress = this.getRouteProgress(locationData.lat, locationData.lng, locationData.busId);
      
      // Enhanced location data with route information
      const enhancedLocationData = {
        ...locationData,
        busNumber: busInfo.busNumber,
        route: busInfo.route,
        stops: busInfo.stops,
        currentStop: this.getCurrentStop(locationData.lat, locationData.lng, locationData.busId),
        nextStop: this.getNextStop(locationData.lat, locationData.lng, locationData.busId),
        routeProgress: routeProgress.percentage,
        progressStatus: routeProgress.status,
        distanceToCurrentStop: routeProgress.distanceToCurrentStop,
        distanceToNextStop: routeProgress.distanceToNextStop
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

    let closestStopIndex = 0;
    let minDistance = this.calculateDistance(lat, lng, route[0].lat, route[0].lng);

    // Find the closest stop
    route.forEach((stop, index) => {
      const distance = this.calculateDistance(lat, lng, stop.lat, stop.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestStopIndex = index;
      }
    });

    const closestStop = route[closestStopIndex];
    const nextStopIndex = closestStopIndex + 1;
    const nextStop = nextStopIndex < route.length ? route[nextStopIndex] : null;

    // Distance thresholds (in km)
    const AT_STOP_THRESHOLD = 0.3;     // 300m - At the stop
    const NEAR_STOP_THRESHOLD = 1.0;   // 1km - Near the stop
    const LEFT_STOP_THRESHOLD = 1.5;   // 1.5km - Left the stop

    // At current stop (within 300m)
    if (minDistance <= AT_STOP_THRESHOLD) {
      return `Arrived at ${closestStop.name}`;
    }

    // If there's a next stop, check if we're approaching it
    if (nextStop) {
      const distanceToNext = this.calculateDistance(lat, lng, nextStop.lat, nextStop.lng);
      
      // Approaching next stop (within 1km of next stop and closer to next than current)
      if (distanceToNext <= NEAR_STOP_THRESHOLD && distanceToNext < minDistance) {
        return `Approaching ${nextStop.name}`;
      }
    }

    // Left current stop but not near next stop yet
    if (minDistance > AT_STOP_THRESHOLD && minDistance <= LEFT_STOP_THRESHOLD) {
      return `Left ${closestStop.name}`;
    }

    // En route between stops
    if (nextStop) {
      return `En route to ${nextStop.name}`;
    } else {
      return `Near ${closestStop.name}`;
    }
  }

  static getNextStop(lat, lng, busId) {
    const route = this.busRoutes[busId];
    if (!route) return 'Unknown';

    let closestStopIndex = 0;
    let minDistance = this.calculateDistance(lat, lng, route[0].lat, route[0].lng);

    // Find current position in route
    route.forEach((stop, index) => {
      const distance = this.calculateDistance(lat, lng, stop.lat, stop.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestStopIndex = index;
      }
    });

    const AT_STOP_THRESHOLD = 0.3; // 300m

    // If we're at a stop (within 300m), return the next stop
    if (minDistance <= AT_STOP_THRESHOLD) {
      if (closestStopIndex < route.length - 1) {
        return route[closestStopIndex + 1].name;
      } else {
        return 'Final Destination';
      }
    }

    // If we're between stops, check if we're closer to the next stop
    if (closestStopIndex < route.length - 1) {
      const nextStopDistance = this.calculateDistance(lat, lng, route[closestStopIndex + 1].lat, route[closestStopIndex + 1].lng);
      
      // If closer to next stop, show the stop after that
      if (nextStopDistance < minDistance && closestStopIndex + 1 < route.length - 1) {
        return route[closestStopIndex + 2].name;
      }
      
      // Otherwise, next stop is the one after current closest
      return route[closestStopIndex + 1].name;
    }

    return 'Final Destination';
  }

  static getRouteProgress(lat, lng, busId) {
    const route = this.busRoutes[busId];
    if (!route) return { completed: 0, total: 0, percentage: 0, status: 'unknown' };

    let closestStopIndex = 0;
    let minDistance = this.calculateDistance(lat, lng, route[0].lat, route[0].lng);

    // Find the closest stop
    route.forEach((stop, index) => {
      const distance = this.calculateDistance(lat, lng, stop.lat, stop.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestStopIndex = index;
      }
    });

    const nextStopIndex = closestStopIndex + 1;
    const nextStop = nextStopIndex < route.length ? route[nextStopIndex] : null;

    // Distance thresholds (in km)
    const AT_STOP_THRESHOLD = 0.3;     // 300m - At the stop
    const NEAR_STOP_THRESHOLD = 1.0;   // 1km - Near the stop
    const LEFT_STOP_THRESHOLD = 1.5;   // 1.5km - Left the stop

    let progressPercentage = 0;
    let status = 'unknown';

    // At current stop (within 300m)
    if (minDistance <= AT_STOP_THRESHOLD) {
      progressPercentage = Math.round((closestStopIndex / (route.length - 1)) * 100);
      status = 'arrived';
    }
    // If there's a next stop, check if we're approaching it
    else if (nextStop) {
      const distanceToNext = this.calculateDistance(lat, lng, nextStop.lat, nextStop.lng);
      
      // Approaching next stop (within 1km of next stop and closer to next than current)
      if (distanceToNext <= NEAR_STOP_THRESHOLD && distanceToNext < minDistance) {
        // Progress is between current and next stop, closer to next
        const progressBetweenStops = 1 - (distanceToNext / NEAR_STOP_THRESHOLD);
        progressPercentage = Math.round(((closestStopIndex + progressBetweenStops) / (route.length - 1)) * 100);
        status = 'approaching';
      }
      // Left current stop but not near next stop yet
      else if (minDistance > AT_STOP_THRESHOLD && minDistance <= LEFT_STOP_THRESHOLD) {
        // Just left current stop, progress slightly after current stop
        progressPercentage = Math.round(((closestStopIndex + 0.3) / (route.length - 1)) * 100);
        status = 'left';
      }
      // En route between stops
      else {
        // Calculate progress based on position between stops
        const totalDistance = this.calculateDistance(
          route[closestStopIndex].lat, route[closestStopIndex].lng,
          nextStop.lat, nextStop.lng
        );
        const distanceFromCurrent = minDistance;
        const progressBetweenStops = Math.min(0.8, distanceFromCurrent / totalDistance);
        progressPercentage = Math.round(((closestStopIndex + progressBetweenStops) / (route.length - 1)) * 100);
        status = 'enroute';
      }
    }
    else {
      // At or near final stop
      progressPercentage = Math.round((closestStopIndex / (route.length - 1)) * 100);
      status = minDistance <= AT_STOP_THRESHOLD ? 'arrived' : 'near_final';
    }

    // Ensure percentage is between 0 and 100
    progressPercentage = Math.max(0, Math.min(100, progressPercentage));

    return {
      completed: closestStopIndex,
      total: route.length,
      percentage: progressPercentage,
      status: status,
      distanceToCurrentStop: minDistance,
      distanceToNextStop: nextStop ? this.calculateDistance(lat, lng, nextStop.lat, nextStop.lng) : null
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
      // Get enhanced location data with route calculations
      const routeProgress = this.getRouteProgress(location.lat, location.lng, busId);
      const currentStop = this.getCurrentStop(location.lat, location.lng, busId);
      const nextStop = this.getNextStop(location.lat, location.lng, busId);
      const busInfo = this.busInfo[busId] || {};
      
      // Create enhanced location object
      const enhancedLocation = {
        ...location,
        busId,
        busNumber: busInfo.busNumber || `BUS-${busId.slice(-3)}`,
        route: busInfo.route || 'Unknown Route',
        driverName: busInfo.driver || location.driverName || 'Unknown Driver',
        currentStop: currentStop,
        nextStop: nextStop,
        routeProgress: routeProgress.percentage,
        progressStatus: routeProgress.status,
        distanceToCurrentStop: routeProgress.distanceToCurrentStop,
        distanceToNextStop: routeProgress.distanceToNextStop,
        lastUpdated: new Date().toISOString(),
        timestamp: location.timestamp || new Date().toISOString()
      };
      
      // Store the latest location for this bus
      localStorage.setItem(`latest_location_${busId}`, JSON.stringify(enhancedLocation));
      
      // Also store in session for immediate access
      sessionStorage.setItem(`current_bus_location_${busId}`, JSON.stringify(enhancedLocation));
      
      console.log(`✅ Updated enhanced location for bus ${busId}:`, enhancedLocation);
      console.log(`📊 Route progress: ${routeProgress.percentage}% (${routeProgress.status})`);
      console.log(`🚏 Current: ${currentStop} | Next: ${nextStop}`);
      
      return true;
    } catch (error) {
      console.error('Error updating bus location:', error);
      return false;
    }
  }
}
