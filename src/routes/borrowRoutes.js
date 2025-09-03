const express = require("express");
const router = express.Router();
const {
  borrowBook,
  returnBook,
  approveBorrow,
  rejectBorrow,
  getPendingBorrows,
  getStudentBorrowHistory,
  getAdminBorrowHistory
} = require("../controllers/borrowController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const multer = require("multer");

// Upload setup
const upload = multer({ dest: "uploads/" });

// Route for users to request to borrow a book
router.post("/", authenticate, upload.fields([
  { name: 'idCardImage', maxCount: 1 },
  { name: 'paymentImage', maxCount: 1 }
]), borrowBook);

// Route for users to return a book (borrowId in req.body)
router.post("/return", authenticate, returnBook);

// Routes for admin to manage borrow requests
router.put(
  "/approve/:id",
  authenticate,
  authorizeRoles("admin", "super-admin"),
  approveBorrow
);

router.delete(
  "/reject/:id",
  authenticate,
  authorizeRoles("admin", "super-admin"),
  rejectBorrow
);

// ✅ New route to get all pending borrow requests
router.get(
  "/pending",
  authenticate,
  authorizeRoles("admin", "super-admin"),
  getPendingBorrows
);


router.get(
  "/history",
  authenticate,
  getStudentBorrowHistory
);


router.get(
  "/admin/history",
  authenticate,
  authorizeRoles("admin", "super-admin"),
  getAdminBorrowHistory
);

module.exports = router;