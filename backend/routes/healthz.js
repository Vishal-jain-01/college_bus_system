import express from "express";

const router = express.Router();

// Health check endpoint for UptimeRobot to keep Render backend awake
router.get("/", (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`🏥 Health check pinged at ${timestamp}`);
  
  res.status(200).json({
    status: "ok",
    timestamp: timestamp,
    message: "Backend is alive and running",
    uptime: process.uptime()
  });
});

export default router;
