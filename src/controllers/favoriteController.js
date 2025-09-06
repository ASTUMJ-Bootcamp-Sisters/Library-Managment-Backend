// controllers/favoriteController.js
const Favorite = require("../models/Favorite");

exports.addFavorite = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    const favorite = await Favorite.create({ user: userId, book: bookId });

    res.status(201).json({ message: "Book added to favorites", favorite });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Book already in favorites" });
    }
    res.status(500).json({ message: "Error adding favorite", error: err.message });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    await Favorite.findOneAndDelete({ user: userId, book: bookId });

    res.json({ message: "Book removed from favorites" });
  } catch (err) {
    res.status(500).json({ message: "Error removing favorite", error: err.message });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await Favorite.find({ user: userId }).populate("book");

    res.json(favorites);
  } catch (err) {
    res.status(500).json({ message: "Error fetching favorites", error: err.message });
  }
};
