// server.js (or index.js)
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import Student from "./models/Student.js";
import Bus from "./models/Bus.js";
import authRoutes from "./routes/auth.js";
import healthzRoutes from "./routes/healthz.js";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173", 
    "http://localhost:5174",
    "https://bus-tracking-system-r1lv.vercel.app",
    "https://college-bus-tracking-system-lime.vercel.app",
    "https://bus-tracking-system-bice.vercel.app",
    process.env.FRONTEND_URL
  ].filter(Boolean),  // Remove undefined values
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  credentials: true
})); 

app.use(express.json());

app.use("/api/auth", authRoutes);
// Health check endpoint for UptimeRobot
app.use("/api/healthz", healthzRoutes);

// DEVELOPMENT: Seed route data endpoint (remove in production)
app.post("/api/seed-routes", async (req, res) => {
  try {
    console.log("🌱 Manual route seeding requested");
    
    // Clear existing buses
    await Bus.deleteMany();
    console.log("🗑️ Cleared existing bus data");

    // Create buses with specific ObjectIDs that frontend expects
    const { ObjectId } = require('mongoose').Types;
    
    const bus1 = await Bus.create({ 
      _id: new ObjectId('66d0123456a1b2c3d4e5f601'), // Frontend expects this ID
      busNumber: "BUS-101", 
      route: "MIET to Muzaffarnagar",
      capacity: 50,
      isActive: true,
      stops: [
        { name: 'MIET Campus', lat: 28.9730, lng: 77.6410, order: 1 },
        { name: 'rohta bypass', lat: 28.9954, lng: 77.6456, order: 2 },
        { name: 'Meerut Cantt', lat: 28.9938, lng: 77.6822, order: 3 },
        { name: 'modipuram', lat: 29.0661, lng: 77.7104, order: 4 }
      ]
    });
    
    const bus2 = await Bus.create({ 
      _id: new ObjectId('66d0123456a1b2c3d4e5f602'), // Frontend expects this ID
      busNumber: "BUS-102", 
      route: "MIET to Delhi",
      capacity: 45,
      isActive: true,
      stops: [
        { name: 'MIET Campus, Meerut', lat: 28.9730, lng: 77.6410, order: 1 },
        { name: 'Meerut Cantt', lat: 28.9938, lng: 77.6822, order: 2 },
        { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538, order: 3 },
        { name: 'Delhi Border', lat: 28.61, lng: 77.23, order: 4 },
        { name: 'ISBT Anand Vihar', lat: 28.6477, lng: 77.3145, order: 5 },
        { name: 'Connaught Place, Delhi', lat: 28.6304, lng: 77.2177, order: 6 }
      ]
    });

    // Refresh the bus routes cache
    await refreshBusRoutes();

    console.log(`🚌 Created buses with route data and frontend-expected IDs`);
    console.log(`✅ Bus 1 ID: ${bus1._id}, Bus 2 ID: ${bus2._id}`);
    
    res.json({
      success: true,
      message: "Route data seeded successfully with expected IDs",
      buses: [
        { id: bus1._id, number: bus1.busNumber, stops: bus1.stops.length },
        { id: bus2._id, number: bus2.busNumber, stops: bus2.stops.length }
      ]
    });
  } catch (error) {
    console.error("❌ Error seeding route data:", error);
    res.status(500).json({ error: error.message });
  }
});

// Connect to DB (optional - location API works without it)
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI ;

console.log('🔍 Attempting MongoDB connection...');
console.log('📡 Connection string format:', MONGODB_URI ? 'Found' : 'Missing');

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.log('⚠️ MongoDB connection failed (location API will still work):', err.message);
    console.log('📍 Cross-device GPS tracking available via API endpoints');
  });

// API: Get all students
app.get("/api/students", async (req, res) => {
  const students = await Student.find().populate("bus");
  res.json(students);
});

// API: Get all buses with populated driver and route data
app.get("/api/buses", async (req, res) => {
  try {
    const buses = await Bus.find().populate("driver").sort({ busNumber: 1 });
    res.json(buses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get bus route by ID
app.get("/api/buses/:busId/route", async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.busId);
    if (!bus) {
      return res.status(404).json({ error: "Bus not found" });
    }
    res.json({ busId: bus._id, route: bus.route, stops: bus.stops });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🚌 GPS LOCATION API ROUTES FOR CROSS-DEVICE SYNC
// Store for real-time location data (in production, use MongoDB)
const locationData = new Map();

// Cache for bus routes (refreshed from database)
let busRoutesCache = {};

// Function to refresh bus routes from database
async function refreshBusRoutes() {
  try {
    const buses = await Bus.find().select('_id stops');
    busRoutesCache = {};
    
    buses.forEach(bus => {
      if (bus.stops && bus.stops.length > 0) {
        // Sort stops by order and convert to route format
        const sortedStops = bus.stops.sort((a, b) => a.order - b.order);
        busRoutesCache[bus._id.toString()] = sortedStops.map(stop => ({
          lat: stop.lat,
          lng: stop.lng,
          name: stop.name
        }));
      }
    });
    
    console.log('📍 Bus routes refreshed from database:', Object.keys(busRoutesCache).length, 'routes loaded');
  } catch (error) {
    console.error('❌ Error refreshing bus routes:', error.message);
    // Fallback to hardcoded routes if database fails
    busRoutesCache = {
      '66d0123456a1b2c3d4e5f601': [
        { lat: 28.9730, lng: 77.6410, name: 'MIET Campus' },
        { lat: 28.9954, lng: 77.6456, name: 'rohta bypass' },
        { lat: 28.9938, lng: 77.6822, name: 'Meerut Cantt' },
        { lat: 29.0661, lng: 77.7104, name: 'modipuram' }
      ]
    };
  }
}

// Refresh routes on startup and every 5 minutes
refreshBusRoutes();
setInterval(refreshBusRoutes, 5 * 60 * 1000);

// Calculate distance between two points (in km)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate route progress and current stop
function calculateRouteProgress(busId, lat, lng) {
  const route = busRoutesCache[busId];
  if (!route || route.length === 0) {
    console.log(`⚠️ No route found for bus ${busId}, returning default progress`);
    return { 
      currentStop: 'Loading route...', 
      nextStop: 'Calculating...', 
      routeProgress: 0,
      distanceToCurrentStop: 0,
      distanceToNextStop: 0
    };
  }

  let closestStopIndex = 0;
  let minDistance = Infinity;

  // Find closest stop
  route.forEach((stop, index) => {
    const distance = calculateDistance(lat, lng, stop.lat, stop.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closestStopIndex = index;
    }
  });

  const currentStop = route[closestStopIndex];
  const nextStop = route[closestStopIndex + 1];
  const routeProgress = Math.round((closestStopIndex / (route.length - 1)) * 100);

  // Determine status based on distance to closest stop
  let currentStopName = currentStop.name;
  if (minDistance <= 0.3) {
    currentStopName = `At ${currentStop.name}`;
  } else if (minDistance <= 1.0) {
    currentStopName = `Near ${currentStop.name}`;
  } else {
    currentStopName = `Heading to ${currentStop.name}`;
  }

  return {
    currentStop: currentStopName,
    nextStop: nextStop ? nextStop.name : 'End of Route',
    routeProgress,
    distanceToCurrentStop: minDistance,
    distanceToNextStop: nextStop ? calculateDistance(lat, lng, nextStop.lat, nextStop.lng) : 0
  };
}

// API: Update driver location (driver posts GPS data)
app.post("/api/location/update-location/:busId", async (req, res) => {
  try {
    const { busId } = req.params;
    const locationInfo = req.body;
    
    // Calculate route progress from GPS coordinates
    const routeInfo = calculateRouteProgress(busId, locationInfo.lat, locationInfo.lng);
    
    // Store location with timestamp and calculated route info
    const enhancedLocation = {
      ...locationInfo,
      ...routeInfo,  // Add currentStop, nextStop, routeProgress, distances
      busId,
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      source: locationInfo.source || 'driver_gps'
    };
    
    locationData.set(busId, enhancedLocation);
    
    console.log(`📍 Location updated for bus ${busId}:`, {
      lat: locationInfo.lat,
      lng: locationInfo.lng,
      currentStop: routeInfo.currentStop,
      routeProgress: `${routeInfo.routeProgress}%`,
      nextStop: routeInfo.nextStop,
      source: enhancedLocation.source
    });
    
    res.json({ 
      success: true, 
      message: 'Location updated successfully',
      busId,
      timestamp: enhancedLocation.timestamp,
      routeInfo: {
        currentStop: routeInfo.currentStop,
        nextStop: routeInfo.nextStop,
        routeProgress: routeInfo.routeProgress
      }
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// API: Get current location for a bus (students fetch driver GPS data)
app.get("/api/location/current-location/:busId", async (req, res) => {
  try {
    const { busId } = req.params;
    const location = locationData.get(busId);
    
    if (location) {
      // Check if location is recent (within last 5 minutes)
      const now = new Date();
      const locationTime = new Date(location.timestamp);
      const timeDiff = (now - locationTime) / (1000 * 60); // minutes
      
      if (timeDiff <= 5) {
        console.log(`📱 Serving FRESH location for bus ${busId}:`, {
          currentStop: location.currentStop,
          routeProgress: `${location.routeProgress}%`,
          age: `${Math.round(timeDiff)} minutes ago`
        });
        
        res.json({ 
          success: true, 
          location: {
            ...location,
            isRecent: true,
            ageInMinutes: Math.round(timeDiff)
          },
          age: `${Math.round(timeDiff)} minutes ago`
        });
      } else {
        console.log(`⏰ Location too old for bus ${busId} (${Math.round(timeDiff)} min)`);
        res.json({ 
          success: false, 
          message: 'Location data is too old',
          lastSeen: `${Math.round(timeDiff)} minutes ago`
        });
      }
    } else {
      console.log(`❌ No location data found for bus ${busId}`);
      res.json({ 
        success: false, 
        message: 'No location data available'
      });
    }
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// API: Get all active bus locations
app.get("/api/location/all-locations", async (req, res) => {
  try {
    const activeLocations = [];
    const now = new Date();
    
    for (const [busId, location] of locationData.entries()) {
      const locationTime = new Date(location.timestamp);
      const timeDiff = (now - locationTime) / (1000 * 60); // minutes
      
      if (timeDiff <= 5) { // Only active locations (within 5 minutes)
        activeLocations.push(location);
      }
    }
    
    res.json({ 
      success: true, 
      locations: activeLocations,
      count: activeLocations.length
    });
  } catch (error) {
    console.error('Error fetching all locations:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// API: Health check for location service
app.get("/api/location/health", (req, res) => {
  res.json({ 
    success: true, 
    message: 'Location service is running',
    activeBuses: locationData.size,
    timestamp: new Date().toISOString()
  });
});

app.listen(3001, () => console.log("Server running on http://localhost:3001"));