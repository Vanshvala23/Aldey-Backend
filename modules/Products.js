const mongoose = require("mongoose");

/* ------------------ Sub Schemas ------------------ */

const keyActiveSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    desc: { type: String, trim: true },
    img: { type: String, trim: true },
  },
  { _id: false }
);

const ritualSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    desc: { type: String, trim: true },
  },
  { _id: false }
);

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    source: { type: String, trim: true },
    function: { type: String, trim: true },
    type: { type: String, trim: true },
  },
  { _id: false }
);

/* ------------------ Main Product Schema ------------------ */

const productSchema = new mongoose.Schema(
  {
    // 🔑 frontend id mapping
    productId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    // Basic info
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    title: {
      type: String,
      trim: true,
    },

    subtitle: {
      type: String,
      trim: true,
    },

    vendor: {
      type: String,
      trim: true,
      index: true,
    },

    category: {
      type: String,
      required: true,
      index: true,
    },

    concern: {
      type: String,
      trim: true,
      index: true,
    },

    // 💰 Pricing
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    mrp: {
      type: Number,
      min: 0,
    },

    sale: {
      type: Boolean,
      default: false,
    },

    // ⭐ Ratings
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // 🖼 Images
    image: {
      type: String,
      required: true,
      trim: true,
    },

    images: {
      type: [String],
      default: [],
    },

    // 📝 Description
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // 🧪 Rich Content
    keyActives: {
      type: [keyActiveSchema],
      default: [],
    },

    ritual: {
      type: [ritualSchema],
      default: [],
    },

    fullIngredients: {
      type: [ingredientSchema],
      default: [],
    },

    // 🏷 Optional tag (bestseller, new, etc.)
    tag: {
      type: String,
      default: null,
      trim: true,
    },

    // 📦 Future-ready flags
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ------------------ Indexes (Performance) ------------------ */

productSchema.index({ category: 1, price: 1 });
productSchema.index({ vendor: 1, rating: -1 });
productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);