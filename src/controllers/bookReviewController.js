const BookReview = require("../models/BookReview");

// ➕ Add new event
exports.createBookReview = async (req, res) => {
  try {
    const review = new BookReview(req.body);
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 📚 Get all events
exports.getBookReviews = async (req, res) => {
  try {
    const reviews = await BookReview.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🗑 Delete event
exports.deleteBookReview = async (req, res) => {
  try {
    const review = await BookReview.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: "Event not found" });
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
