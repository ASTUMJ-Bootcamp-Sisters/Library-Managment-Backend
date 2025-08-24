const mongoose = require("mongoose");


const borrowSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true
    },
    borrowDate: { type: Date, default: Date.now },
    returnDate: { type: Date },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Borrowed", "Returned", "Overdue"],
      default: "Borrowed"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Borrow", borrowSchema);
=======
const borrowSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }, // who borrowed

  book: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Book", 
    required: true 
  }, // which book

  borrowDate: { type: Date, default: Date.now }, // when borrowed
  returnDate: { type: Date }, // when returned
  dueDate: { type: Date, required: true }, // deadline
  status: { 
    type: String, 
    enum: ["Borrowed", "Returned", "Overdue"], 
    default: "Borrowed" 
  }
}, { timestamps: true });

module.exports = mongoose.model("Borrow", borrowSchema);

