const express = require("express");
const router = express.Router();
const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");
const { authenticate, authorizeRoles } = require("../middleware/auth");


router.get("/", getSettings);
router.put(
  "/",
  authenticate,
  authorizeRoles("admin", "super-admin"),
  updateSettings
);

module.exports = router;
