const Borrow = require("../models/Borrow");
const Book = require("../models/book");

// Borrow a book
const borrowBook = async (req, res) => {
  try {
    const { student, book, dueDate } = req.body;

    // Decrease availability when borrowing
    const foundBook = await Book.findById(book);
    if (!foundBook || foundBook.available <= 0) {
      return res.status(400).json({ message: "Book not available" });
    }

    foundBook.available -= 1;
    await foundBook.save();

    const newBorrow = new Borrow({ student, book, dueDate, status: "Borrowed" });
    const savedBorrow = await newBorrow.save();

    res.status(201).json({ message: "Book borrowed successfully", borrow: savedBorrow });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Return a book
const returnBook = async (req, res) => {
  try {
    const borrowId = req.params.id;
    const borrow = await Borrow.findById(borrowId).populate("book");

    if (!borrow) return res.status(404).json({ message: "Borrow record not found" });
    if (borrow.status === "Returned" || borrow.status === "Overdue") {
      return res.status(400).json({ message: "Book already returned" });
    }

    borrow.returnDate = new Date();

    // Overdue check
    if (borrow.returnDate > borrow.dueDate) {
      borrow.status = "Overdue";
    } else {
      borrow.status = "Returned";
    }

    // Increase availability when returned
    await Book.findByIdAndUpdate(borrow.book._id, { $inc: { available: 1 } });

    await borrow.save();

    res.json({ message: "Book returned successfully", borrow });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { borrowBook, returnBook };
