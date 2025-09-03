// controllers/paymentController.js
const Payment = require("../models/Payment");

// Student: Submit payment
exports.submitPayment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { reference, amount, method, borrowId } = req.body;
    const screenshot = req.file ? req.file.path : null; // using multer

    if (!screenshot) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment screenshot required" 
      });
    }

    if (!amount) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment amount required" 
      });
    }

    if (!method) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment method required" 
      });
    }

    // Create payment record
    const payment = new Payment({
      student: studentId,
      borrow: borrowId, // Can be null for membership payments
      amount: parseFloat(amount),
      method,
      description: reference || "Membership payment",
      screenshot
    });

    await payment.save();
    
    res.status(201).json({ 
      success: true,
      message: "Payment submitted successfully", 
      payment 
    });
  } catch (err) {
    console.error("Error in submitPayment:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to submit payment", 
      error: err.message 
    });
  }
};

// Admin: View all payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate("student", "fullName email");
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Approve/Reject
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status, expiryMonths } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) return res.status(404).json({ error: "Payment not found" });

    payment.status = status;

    // If approved and expiry set
    if (status === "Approved" && expiryMonths) {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + expiryMonths);
      payment.expiryDate = expiry;
    }

    await payment.save();
    res.json({ message: "Payment updated", payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
