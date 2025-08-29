const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref:"User", required: true },// who commented
  text: {type:String, required:true },
  createdAt: { type: Date, default: Date.now}
});

const ratingsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User"},
  value: {type:Number, min:1, max:5 },
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
      name: { type: String, required: true },   // e.g. Tafsir, Hadith, Fiqh
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
      sparse: true, // allows some books without ISBN
    },
    copies: {
       hardCopy: { type: Number, default: 0 },   // physical copies
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

bookSchema.virtual("averageRating").get(function (){
  if (this.ratings.length === 0) return 0;
  const total = this.ratings.reduce((sum, r) => sum +r.value, 0);
  return (total / this.ratings.length).toFixed(1);
});
module.exports = mongoose.model("Book", bookSchema);
