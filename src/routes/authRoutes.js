const { Router } = require("express");
const authController = require("../controllers/authController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const multer = require("multer");

const router = Router();




const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"), // folder to store images
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });



router.get(
  "/admin/stats",
  authenticate,
  authorizeRoles("admin", "super-admin"),
  authController.getAdminStats
);
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);

router.post("/logout", authenticate, authController.logout);
router.get("/profile", authenticate, authController.getProfile);


router.put("/profile", authenticate, upload.single("profilePic"), authController.updateProfile);


router.put("/profile/change-password", authenticate, authController.changePassword);


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
router.post("/request-email-otp", authenticate, authController.requestEmailOtp);
router.post("/verify-email-otp", authenticate, authController.verifyEmailOtp);
router.delete(
  "/users/:id",
  authenticate,
  authorizeRoles("admin", "super-admin"),
  async (req, res) => {
    const User = require("../models/User");
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to delete user", error: err.message });
    }
  }
);
module.exports = router;