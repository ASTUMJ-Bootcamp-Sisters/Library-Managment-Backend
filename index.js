const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
// for mongo connected
connectDB();

// test route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
