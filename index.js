const express = require("express");


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
    origin: "*", 
    credentials: true, 
  })
);

app.use(express.json());
// mongo connected
connectDB();

app.use("/api/auth", authRoutes);

app.use("/api/books", bookRoutes);
app.use("/api/borrow", borrowRoutes);



// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

