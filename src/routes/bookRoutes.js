const express = require ("express");
const {
  getBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
  rateBook,
  addComment,
  editComment,
  deleteComment,
} = require("../controllers/bookController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const router = express.Router();

// Routes
router.get("/", getBooks);
router.get("/:id", getBookById);
router.post("/", authenticate, authorizeRoles("admin", "super-admin"), addBook);
router.put("/:id", authenticate, authorizeRoles("admin", "super-admin"), updateBook);
router.delete("/:id", authenticate, authorizeRoles("admin", "super-admin"), deleteBook);
// rate
router.post("/rate", authenticate, rateBook);
// comments
router.post("/comment", authenticate, addComment);
router.put("/comment/edit", authenticate, editComment);
router.delete("/comment/delete", authenticate, deleteComment);
module.exports = router;