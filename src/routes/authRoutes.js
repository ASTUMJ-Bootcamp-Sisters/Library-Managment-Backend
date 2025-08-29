const { Router } = require("express");
const authController = require("../controllers/authController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
// Admin stats route
const { getAdminStats } = require("../controllers/authController");

// Admin dashboard stats (admin only)

const router = Router();
router.get(
  "/admin/stats",
  authenticate,
  authorizeRoles("admin", "super-admin"),
  getAdminStats
);
// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);

// Protected routes
router.post("/logout", authenticate, authController.logout);
router.get("/profile", authenticate, authController.getProfile);

router.get(
  "/users",
  authenticate,
  authorizeRoles("admin", "super-admin"),
  authController.getAllUsers
);
router.put(
  "/users/:id/role",
  authenticate,
  authorizeRoles("admin", "super-admin"),
  authController.updateUserRole
);

router.put(
  "/users/:id/blacklist",
  authenticate,
  authorizeRoles("admin", "super-admin"),
  authController.blacklistUser
);

module.exports = router;
