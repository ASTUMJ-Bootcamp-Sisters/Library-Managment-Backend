// middleware/checkMembership.js
const Payment = require("../models/Payment");

async function checkMembership(req, res, next) {
  try {
    const studentId = req.user.id;

    // Get latest approved payment
    const payment = await Payment.findOne({
      student: studentId,
      status: "Approved",
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(403).json({ error: "Membership not approved" });
    }

    // If expiry is set, check validity
    if (payment.expiryDate && payment.expiryDate < new Date()) {
      return res.status(403).json({ error: "Membership expired" });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = checkMembership;
