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

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173", 
    "http://localhost:5174",
    "https://bus-tracking-system-bice.vercel.app",
    process.env.FRONTEND_URL
  ].filter(Boolean),  // Remove undefined values
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
})); 

app.use(express.json());

app.use("/api/auth", authRoutes);

// Connect to DB (optional - location API works without it)
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bus';

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

// API: Get all buses
app.get("/api/buses", async (req, res) => {
  const buses = await Bus.find();
  res.json(buses);
});

// 🚌 GPS LOCATION API ROUTES FOR CROSS-DEVICE SYNC
// Store for real-time location data (in production, use MongoDB)
const locationData = new Map();

// API: Update driver location (driver posts GPS data)
app.post("/api/location/update-location/:busId", async (req, res) => {
  try {
    const { busId } = req.params;
    const locationInfo = req.body;
    
    // Store location with timestamp
    const enhancedLocation = {
      ...locationInfo,
      busId,
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    locationData.set(busId, enhancedLocation);
    
    console.log(`📍 Location updated for bus ${busId}:`, {
      lat: locationInfo.lat,
      lng: locationInfo.lng,
      currentStop: locationInfo.currentStop,
      progressStatus: locationInfo.progressStatus
    });
    
    res.json({ 
      success: true, 
      message: 'Location updated successfully',
      busId,
      timestamp: enhancedLocation.timestamp
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
        console.log(`📱 Serving location for bus ${busId} to student`);
        res.json({ 
          success: true, 
          location,
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

// For Render deployment - listen on PORT environment variable
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Location API endpoints available`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/location/health`);
});