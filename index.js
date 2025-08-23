const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes");

const app = express();

// ✅ Enable CORS for your frontend
app.use(
  cors({
    origin: "http://localhost:5174", // frontend URL
    credentials: true, // allow cookies if needed
  })
);

// ✅ Parse JSON requests
app.use(express.json());

// ✅ Routes
app.use("/api/auth", authRoutes);

// ✅ Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
