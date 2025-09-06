const Feedback = require("../models/Feedback");

exports.submitFeedback = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Feedback message is required." });
    }
    const feedback = await Feedback.create({
      user: req.user.id,
      message,
    });
    res.status(201).json({ message: "Feedback submitted.", feedback });
  } catch (err) {
    res.status(500).json({ message: "Error submitting feedback.", error: err.message });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().populate("user", "fullName email").sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: "Error fetching feedback.", error: err.message });
  }
};
