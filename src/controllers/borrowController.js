const Borrow = require("../models/Borrow");

// Borrow a book function
const borrowBook = async (req, res) => {
  try {
    const { student, book, dueDate } = req.body;

    const newBorrow = new Borrow({
      student,
      book,
      dueDate,
      status: "Borrowed",
    });

    const savedBorrow = await newBorrow.save();
    res.status(201).json({ message: "Book borrowed successfully", borrow: savedBorrow });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Return a book function
const returnBook = async (req, res) => {
  try {
    const borrowId = req.params.id;
    const borrow = await Borrow.findById(borrowId);

    if (!borrow) return res.status(404).json({ message: "Borrow record not found" });
    if (borrow.status === "Returned") return res.status(400).json({ message: "Book already returned" });

    borrow.status = "Returned";
    borrow.returnDate = new Date();
    borrow.updatedAt = new Date();

    await borrow.save();
    res.json({ message: "Book returned successfully", borrow });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { borrowBook, returnBook };
