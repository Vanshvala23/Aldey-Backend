const mongoose = require("mongoose");

/* ------------------ Sub Schemas ------------------ */

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type:     String,
      required: true,
      trim:     true,
    },
    productRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "Product",
    },
    name:     { type: String, required: true, trim: true },
    image:    { type: String, trim: true },
    price:    { type: Number, required: true, min: 0 },
    mrp:      { type: Number, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    // snapshot of category at time of order
    category: { type: [String], default: [] },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    fullName:   { type: String, required: true, trim: true },
    phone:      { type: String, required: true, trim: true },
    line1:      { type: String, required: true, trim: true },
    line2:      { type: String, trim: true },
    city:       { type: String, required: true, trim: true },
    state:      { type: String, required: true, trim: true },
    pincode:    { type: String, required: true, trim: true },
    country:    { type: String, default: "India", trim: true },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type:     String,
      enum:     ["COD", "RAZORPAY", "STRIPE", "OTHER"],
      required: true,
    },
    status: {
      type:    String,
      enum:    ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    // For online payments — store gateway reference
    gatewayOrderId:   { type: String, trim: true },   // e.g. Razorpay order_id
    gatewayPaymentId: { type: String, trim: true },   // e.g. Razorpay payment_id
    gatewaySignature: { type: String, trim: true },
    paidAt:           { type: Date },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status:    { type: String, required: true },
    note:      { type: String, trim: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

/* ------------------ Main Order Schema ------------------ */

const orderSchema = new mongoose.Schema(
  {
    // Human-readable order number e.g. "ORD-20240315-0042"
    orderNumber: {
      type:   String,
      unique: true,
      index:  true,
    },

    // Owner
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },

    // Line items
    items: {
      type:     [orderItemSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message:   "Order must have at least one item.",
      },
    },

    // Delivery
    shippingAddress: {
      type:     addressSchema,
      required: true,
    },

    // Pricing breakdown
    subtotal:        { type: Number, required: true, min: 0 }, // sum of price × qty
    discountAmount:  { type: Number, default: 0, min: 0 },
    shippingCharge:  { type: Number, default: 0, min: 0 },
    taxAmount:       { type: Number, default: 0, min: 0 },
    totalAmount:     { type: Number, required: true, min: 0 }, // final charged

    couponCode:      { type: String, trim: true, default: null },

    // Payment
    payment: {
      type:     paymentSchema,
      required: true,
    },

    // Lifecycle status
    status: {
      type:    String,
      enum:    ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"],
      default: "PENDING",
      index:   true,
    },

    statusHistory: {
      type:    [statusHistorySchema],
      default: [],
    },

    // Shipping / tracking
    trackingNumber:  { type: String, trim: true, default: null },
    shippingPartner: { type: String, trim: true, default: null },
    estimatedDelivery: { type: Date, default: null },
    deliveredAt:     { type: Date, default: null },

    // Cancellation / Return
    cancellationReason: { type: String, trim: true, default: null },
    returnReason:       { type: String, trim: true, default: null },

    // Admin notes (internal)
    adminNote: { type: String, trim: true, default: null },

    // Soft delete
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

/* ------------------ Pre-save: generate orderNumber ------------------ */

orderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderNumber) {
    const today   = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // "20240315"
    // Count orders created today for a sequential suffix
    const count   = await mongoose.model("Order").countDocuments({
      createdAt: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      },
    });
    this.orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

/* ------------------ Indexes (Performance) ------------------ */

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ "payment.status": 1 });

module.exports = mongoose.model("Order", orderSchema);