const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
require("dotenv").config();

//router
const bookRoute = require("./src/routes/bookRoute");
const borrowRoutes = require("./src/routes/borrowRoutes");

const app = express();
app.use(cors());
app.use(express.json());
// mongo connected
connectDB();

// test route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// book routes and borrow
app.use("/api/books", bookRoute);
app.use("/api/borrow", borrowRoutes);

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});