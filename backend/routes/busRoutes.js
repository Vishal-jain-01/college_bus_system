// routes/busRoutes.js - API endpoints for managing bus routes
import express from "express";
import jwt from "jsonwebtoken";
import BusRoute from "../models/BusRoute.js";
import Bus from "../models/Bus.js";
import Student from "../models/Student.js";

const router = express.Router();

// Middleware to verify JWT (copy from auth.js)
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, "SECRETKEY");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Get all bus routes
router.get("/routes", async (req, res) => {
  try {
    const routes = await BusRoute.find();
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get specific bus route by bus ID
router.get("/routes/:busId", async (req, res) => {
  try {
    const route = await BusRoute.findOne({ busId: req.params.busId });
    if (!route) {
      return res.status(404).json({ message: "Bus route not found" });
    }
    res.json(route);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update bus route (Admin only)
router.put("/routes/:busId", async (req, res) => {
  try {
    const { busNumber, route, driver, stops, coordinates } = req.body;
    const busId = req.params.busId;

    // Update or create the bus route
    const updatedRoute = await BusRoute.findOneAndUpdate(
      { busId: busId },
      {
        busId,
        busNumber,
        route,
        driver,
        stops,
        coordinates
      },
      { 
        upsert: true, // Create if doesn't exist
        new: true     // Return updated document
      }
    );

    // Also update the Bus model
    await Bus.findOneAndUpdate(
      { _id: busId },
      {
        busNumber,
        route
      },
      { upsert: true, new: true }
    );

    res.json({
      message: "Bus route updated successfully",
      route: updatedRoute
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new bus route
router.post("/routes", async (req, res) => {
  try {
    const { busId, busNumber, route, driver, stops, coordinates } = req.body;

    const newRoute = new BusRoute({
      busId,
      busNumber,
      route,
      driver,
      stops,
      coordinates
    });

    await newRoute.save();

    // Also create/update the Bus model
    await Bus.findOneAndUpdate(
      { _id: busId },
      {
        busNumber,
        route
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      message: "Bus route created successfully",
      route: newRoute
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete bus route
router.delete("/routes/:busId", async (req, res) => {
  try {
    const deletedRoute = await BusRoute.findOneAndDelete({ busId: req.params.busId });
    if (!deletedRoute) {
      return res.status(404).json({ message: "Bus route not found" });
    }
    res.json({ message: "Bus route deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
