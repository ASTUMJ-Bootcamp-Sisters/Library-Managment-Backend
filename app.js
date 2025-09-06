// const paymentRoutes = require("./routes/paymentRoutes");
// app.use("/api/payments", paymentRoutes);
const favoriteRoutes = require("./routes/favoriteRoutes");
app.use("/api/favorites", favoriteRoutes);

const feedbackRoutes = require("./routes/feedbackRoutes");
app.use("/api/feedback", feedbackRoutes);
