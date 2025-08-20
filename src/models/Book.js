import mongoose from "mongoose";

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
    category: {
      type: String,
      enum: [
        "Quran",
        "Hadith",
        "Fiqh",
        "Aqeedah",
        "Tafsir",
        "Seerah",
        "Islamic History",
        "Other",
      ],
      default: "Other",
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
      type: Number,
      default: 1,
      min: 0,
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
  },
  { timestamps: true }
);

export default mongoose.model("Book", bookSchema);
