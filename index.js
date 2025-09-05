const express = require("express");
const connectDB = require("./src/config/db");
require("dotenv").config();

//router


const mongoose = require("mongoose");
const paymentRoutes = require("./src/routes/paymentRoutes");
const membershipRoutes = require("./src/routes/membershipRoutes");

const cors = require("cors");

const authRoutes = require("./src/routes/authRoutes");
const bookRoutes = require("./src/routes/bookRoutes");
const borrowRoutes = require("./src/routes/borrowRoutes");
const settingsRoutes = require("./src/routes/settingsRoutes");

const app = express();

// ✅ Enable CORS for your frontend
app.use(
  cors({
    origin: "*", // frontend URL
    credentials: true, // allow cookies if needed
  })
);

// ✅ Parse JSON requests

app.use(express.json());
// mongo connected
connectDB();


// Serve uploads folder as static files
app.use('/uploads', express.static('uploads'));

app.use("/api/auth", authRoutes);

app.use("/api/payments", paymentRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrow", borrowRoutes);
app.use("/api/membership", membershipRoutes);
app.use("/api/settings", settingsRoutes);



// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
