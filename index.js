const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
require("dotenv").config();

// Routes
const bookRoute = require("./src/routes/bookRoute");
const borrowRoutes = require("./src/routes/borrowRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect MongoDB
connectDB();

// Test route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Book & Borrow routes
app.use("/api/books", bookRoute);
app.use("/api/borrow", borrowRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
