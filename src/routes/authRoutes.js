const { Router } = require("express");
const authController = require("../controllers/authController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

const router = Router();


// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected routes (all authenticated users)

router.get("/profile", authenticate, authController.getProfile);


// Get all users (admin + super-admin)
router.get(
  "/users",
  authenticate,
  authorizeRoles("admin", "super-admin"),
  authController.getAllUsers
);

// Delete a user (admin + super-admin)
router.delete(
  "/users/:id",
  authenticate,
  authorizeRoles("admin", "super-admin"),
  authController.deleteUser
);



// Update user role (only super-admin can promote/demote users)
router.put(
  "/users/:id/role",
  authenticate,
  authorizeRoles("super-admin"),
  authController.updateUserRole
);

module.exports = router;
