const mongoose = require("mongoose");

const bookReviewSchema = new mongoose.Schema(
  {
    bookTitle: { type: String, required: true },
    author: { type: String, required: true },
    image: { type: String }, // book cover image URL
    dateTime: { type: Date, required: true },
    location: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female", "Both"], default: "Both" },
    eventNumber: { type: String, required: true }, // Example: "#1 Book Review Name"
  },
  { timestamps: true }
);

module.exports = mongoose.model("BookReview", bookReviewSchema);
