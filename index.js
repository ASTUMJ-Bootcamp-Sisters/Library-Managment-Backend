const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes");

const app = express();
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
