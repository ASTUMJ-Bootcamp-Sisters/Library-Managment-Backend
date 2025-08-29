const express = require("express");
const router = express.Router();
const { borrowBook, returnBook } = require("../controllers/borrowController");
const { authenticate } = require("../middleware/auth"); // your auth middleware


router.post("/", authenticate, borrowBook);


router.post("/return", authenticate, returnBook);

module.exports = router;
