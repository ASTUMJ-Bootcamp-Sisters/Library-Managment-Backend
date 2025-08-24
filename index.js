const express = require("express");

const cors = require("cors");
const connectDB = require("./src/config/db");
require("dotenv").config();

//router
const bookRoutes = require("./src/routes/bookRoutes");
const borrowRoutes = require("./src/routes/borrowRoutes")
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
// mongo connected
connectDB();

// ✅ Routes
app.use("/api/auth", authRoutes);
// book routes and borrow
app.use("/api/books", bookRoutes);
app.use("/api/borrow", borrowRoutes);



// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

