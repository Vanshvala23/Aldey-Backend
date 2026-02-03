import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
}, { timestamps: true });

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      unique: true,
      required: true,
    },
    brand: {
      type: String,
      default: "Alday",
    },
    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
      enum: ["Skin Care", "Face Wash", "Herbal", "Ayurvedic", "Beauty"],
      default: "Skin Care",
    },

    ingredients: [String], // list of natural or herbal ingredients

    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    stocks: {
      type: Number,
      required: true,
      min: 0,
    },
    
    images: [
      {
        url: String,
        alt: String,
      }
    ],

    sizeVariants: [
      {
        size: String, // e.g., "100ml", "200ml"
        price: Number,
        stocks: Number,
      },
    ],

    tags: [String], // e.g., ["herbal", "ayurvedic", "oil control"]

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: [reviewSchema],

    isActive: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
