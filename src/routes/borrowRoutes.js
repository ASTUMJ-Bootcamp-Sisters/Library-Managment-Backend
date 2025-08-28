
const express = require("express");
const router = express.Router();
const { borrowBook, returnBook } = require("../controllers/borrowController");


router.post("/", borrowBook);


router.post("/return", returnBook);

module.exports = router;
