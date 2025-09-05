const Settings = require("../models/Settings");


exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch settings", error: err.message });
  }
};


exports.updateSettings = async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
    });
    res.json(settings);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update settings", error: err.message });
  }
};
