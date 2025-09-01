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

module.exports = router;