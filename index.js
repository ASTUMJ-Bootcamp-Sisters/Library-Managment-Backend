const express = require("express");


const connectDB = require("./src/config/db");
require("dotenv").config();

//router
const bookRoutes = require("./src/routes/bookRoutes");
const borrowRoutes = require("./src/routes/borrowRoutes")
const mongoose = require("mongoose");
const paymentRoutes = require("./src/routes/paymentRoutes");
const membershipRoutes = require("./src/routes/membershipRoutes");

const cors = require("cors");

const authRoutes = require("./src/routes/authRoutes");


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

app.use("/api/auth", authRoutes);

app.use("/api/payments", paymentRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrow", borrowRoutes);
app.use("/api/membership", membershipRoutes);



// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

