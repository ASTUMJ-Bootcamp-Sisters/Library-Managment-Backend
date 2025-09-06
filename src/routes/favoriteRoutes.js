const express = require("express");
const router = express.Router();
const favoriteController = require("../controllers/favoriteController");
const { authenticate } = require("../middleware/auth");

// Add a book to favorites
router.post("/", authenticate, favoriteController.addFavorite);

// Remove a book from favorites
router.delete("/:bookId", authenticate, favoriteController.removeFavorite);

// Get all favorites for the logged-in user
router.get("/", authenticate, favoriteController.getFavorites);

// Get a single favorite by its ID
router.get("/:favoriteId", authenticate, favoriteController.getFavoriteById);

module.exports = router;
