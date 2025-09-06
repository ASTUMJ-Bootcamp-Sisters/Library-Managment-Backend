const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref:"User", required: true },
  text: { type:String, required:true },
  createdAt: { type: Date, default: Date.now}
});
const ratingsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  value: { type: Number, min: 1, max: 5, required: true },
});

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type:String
    },
    category: {
      name: { type: String, required: true },
      type: { type: String, enum: ["Islamic", "History", "Other"], default: "Islamic" }
    },
    language: {
      type: String,
      enum: ["Arabic", "Amharic", "English", "Other"],
      default: "Amharic",
    },
    publisher: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
    },
    isbn: {
      type: String,
      unique: true,
      sparse: true,
    },
    copies: {
        hardCopy: { type: Number, default: 0 },
      eBook: { type: Boolean, default: false }
    },
    available: {
      type: Number,
      default: 1,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    comments:[commentSchema],
    ratings: [ratingsSchema],
  },
  { timestamps: true }
);
bookSchema.virtual("averageRating").get(function () {
  const ratingsArray = this.ratings || [];
  if (ratingsArray.length === 0) return 0;

  const total = ratingsArray.reduce((sum, r) => sum + r.value, 0);
  return (total / ratingsArray.length).toFixed(1);
});


// Ensures virtual fields are included in JSON output
bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Book || mongoose.model("Book", bookSchema);