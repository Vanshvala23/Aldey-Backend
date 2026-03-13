const Order   = require("../modules/Orders");
const Product = require("../modules/Products");

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

const calcTotals = (items, shippingCharge = 0, discountAmount = 0, taxRate = 0) => {
  const subtotal   = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const taxAmount  = parseFloat(((subtotal - discountAmount) * taxRate).toFixed(2));
  const totalAmount = parseFloat((subtotal - discountAmount + shippingCharge + taxAmount).toFixed(2));
  return { subtotal, taxAmount, totalAmount };
};

const pushStatusHistory = (order, status, note, userId) => {
  order.status = status;
  order.statusHistory.push({ status, note: note || undefined, changedBy: userId || undefined });
};

/* ─────────────────────────────────────────────────────────────
   USER — Place Order
   POST /api/orders
───────────────────────────────────────────────────────────── */

exports.placeOrder = async (req, res) => {
  try {
    const {
      items,             // [{ productId, quantity }]
      shippingAddress,
      payment,           // { method: "COD" | "RAZORPAY" | ... }
      couponCode,
      discountAmount = 0,
      shippingCharge = 0,
      taxRate        = 0, // e.g. 0.18 for 18%
    } = req.body;

    if (!items?.length)        return res.status(400).json({ message: "No items provided." });
    if (!shippingAddress)      return res.status(400).json({ message: "Shipping address is required." });
    if (!payment?.method)      return res.status(400).json({ message: "Payment method is required." });

    // ── Resolve products from DB (validate & snapshot) ──────
    const productIds = items.map((i) => i.productId);
    const dbProducts = await Product.find({ productId: { $in: productIds }, isActive: true });

    if (dbProducts.length !== productIds.length) {
      return res.status(400).json({ message: "One or more products are unavailable." });
    }

    const productMap = Object.fromEntries(dbProducts.map((p) => [p.productId, p]));

    const resolvedItems = items.map((item) => {
      const p = productMap[item.productId];
      return {
        productId:  p.productId,
        productRef: p._id,
        name:       p.name,
        image:      p.image,
        price:      p.price,
        mrp:        p.mrp,
        quantity:   item.quantity,
        category:   p.category,
      };
    });

    // ── Compute totals ───────────────────────────────────────
    const { subtotal, taxAmount, totalAmount } = calcTotals(
      resolvedItems,
      shippingCharge,
      discountAmount,
      taxRate
    );

    // ── Build initial status history ─────────────────────────
    const initStatus = payment.method === "COD" ? "CONFIRMED" : "PENDING";

    const order = new Order({
      user:            req.user._id,
      items:           resolvedItems,
      shippingAddress,
      subtotal,
      discountAmount,
      shippingCharge,
      taxAmount,
      totalAmount,
      couponCode:      couponCode || null,
      payment: {
        method:           payment.method,
        status:           payment.method === "COD" ? "PENDING" : "PENDING",
        gatewayOrderId:   payment.gatewayOrderId   || undefined,
        gatewayPaymentId: payment.gatewayPaymentId || undefined,
        gatewaySignature: payment.gatewaySignature || undefined,
      },
    });

    pushStatusHistory(order, initStatus, "Order placed.", req.user._id);

    await order.save();

    return res.status(201).json({ message: "Order placed successfully.", order });
  } catch (err) {
    console.error("placeOrder:", err);
    return res.status(500).json({ message: "Server error.", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   USER — Get My Orders (paginated)
   GET /api/orders/my?page=1&limit=10&status=SHIPPED
───────────────────────────────────────────────────────────── */

exports.getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { user: req.user._id, isActive: true };
    if (status) filter.status = status.toUpperCase();

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-statusHistory -adminNote"),
      Order.countDocuments(filter),
    ]);

    return res.json({
      orders,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error("getMyOrders:", err);
    return res.status(500).json({ message: "Server error.", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   USER — Get Single Order
   GET /api/orders/:id
───────────────────────────────────────────────────────────── */

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id:      req.params.id,
      user:     req.user._id,
      isActive: true,
    }).select("-adminNote");

    if (!order) return res.status(404).json({ message: "Order not found." });

    return res.json({ order });
  } catch (err) {
    console.error("getOrderById:", err);
    return res.status(500).json({ message: "Server error.", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   USER — Cancel Order
   PATCH /api/orders/:id/cancel
───────────────────────────────────────────────────────────── */

exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findOne({
      _id:      req.params.id,
      user:     req.user._id,
      isActive: true,
    });

    if (!order) return res.status(404).json({ message: "Order not found." });

    const cancellable = ["PENDING", "CONFIRMED", "PROCESSING"];
    if (!cancellable.includes(order.status)) {
      return res.status(400).json({ message: `Cannot cancel an order with status "${order.status}".` });
    }

    order.cancellationReason = reason || "Cancelled by customer.";
    pushStatusHistory(order, "CANCELLED", order.cancellationReason, req.user._id);

    await order.save();
    return res.json({ message: "Order cancelled.", order });
  } catch (err) {
    console.error("cancelOrder:", err);
    return res.status(500).json({ message: "Server error.", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   USER — Return Order
   PATCH /api/orders/:id/return
───────────────────────────────────────────────────────────── */

exports.returnOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findOne({
      _id:      req.params.id,
      user:     req.user._id,
      isActive: true,
    });

    if (!order)                        return res.status(404).json({ message: "Order not found." });
    if (order.status !== "DELIVERED")  return res.status(400).json({ message: "Only delivered orders can be returned." });

    order.returnReason = reason || "Return requested by customer.";
    pushStatusHistory(order, "RETURNED", order.returnReason, req.user._id);

    await order.save();
    return res.json({ message: "Return request submitted.", order });
  } catch (err) {
    console.error("returnOrder:", err);
    return res.status(500).json({ message: "Server error.", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   USER — Confirm Online Payment (after gateway callback)
   PATCH /api/orders/:id/confirm-payment
───────────────────────────────────────────────────────────── */

exports.confirmPayment = async (req, res) => {
  try {
    const { gatewayOrderId, gatewayPaymentId, gatewaySignature } = req.body;

    const order = await Order.findOne({
      _id:      req.params.id,
      user:     req.user._id,
      isActive: true,
    });

    if (!order)                          return res.status(404).json({ message: "Order not found." });
    if (order.payment.status === "PAID") return res.status(400).json({ message: "Order already marked as paid." });

    // 🔐 In production: verify Razorpay/Stripe signature here before trusting

    order.payment.gatewayOrderId   = gatewayOrderId;
    order.payment.gatewayPaymentId = gatewayPaymentId;
    order.payment.gatewaySignature = gatewaySignature;
    order.payment.status           = "PAID";
    order.payment.paidAt           = new Date();

    pushStatusHistory(order, "CONFIRMED", "Payment confirmed.", req.user._id);

    await order.save();
    return res.json({ message: "Payment confirmed.", order });
  } catch (err) {
    console.error("confirmPayment:", err);
    return res.status(500).json({ message: "Server error.", error: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════
   ADMIN CONTROLLERS
═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────
   ADMIN — Get All Orders (paginated + filters)
   GET /api/admin/orders?page=1&limit=20&status=SHIPPED&userId=xxx
───────────────────────────────────────────────────────────── */

exports.adminGetAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId, paymentStatus, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { isActive: true };
    if (status)        filter.status               = status.toUpperCase();
    if (userId)        filter.user                 = userId;
    if (paymentStatus) filter["payment.status"]    = paymentStatus.toUpperCase();
    if (search)        filter.orderNumber           = { $regex: search, $options: "i" };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    return res.json({
      orders,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error("adminGetAllOrders:", err);
    return res.status(500).json({ message: "Server error.", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   ADMIN — Get Single Order (full details)
   GET /api/admin/orders/:id
───────────────────────────────────────────────────────────── */

exports.adminGetOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("statusHistory.changedBy", "name email");

    if (!order) return res.status(404).json({ message: "Order not found." });

    return res.json({ order });
  } catch (err) {
    console.error("adminGetOrder:", err);
    return res.status(500).json({ message: "Server error.", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   ADMIN — Update Order Status
   PATCH /api/admin/orders/:id/status
   Body: { status, note, trackingNumber, shippingPartner, estimatedDelivery }
───────────────────────────────────────────────────────────── */

exports.adminUpdateStatus = async (req, res) => {
  try {
    const VALID_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];
    const { status, note, trackingNumber, shippingPartner, estimatedDelivery } = req.body;

    if (!status || !VALID_STATUSES.includes(status.toUpperCase())) {
      return res.status(400).json({ message: `Invalid status. Valid values: ${VALID_STATUSES.join(", ")}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });

    pushStatusHistory(order, status.toUpperCase(), note, req.user._id);

    if (trackingNumber)    order.trackingNumber    = trackingNumber;
    if (shippingPartner)   order.shippingPartner   = shippingPartner;
    if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);
    if (status.toUpperCase() === "DELIVERED") order.deliveredAt = new Date();

    await order.save();
    return res.json({ message: `Order status updated to ${order.status}.`, order });
  } catch (err) {
    console.error("adminUpdateStatus:", err);
    return res.status(500).json({ message: "Server error.", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   ADMIN — Update Payment Status
   PATCH /api/admin/orders/:id/payment-status
   Body: { status: "PAID" | "FAILED" | "REFUNDED" }
───────────────────────────────────────────────────────────── */

exports.adminUpdatePaymentStatus = async (req, res) => {
  try {
    const VALID = ["PENDING", "PAID", "FAILED", "REFUNDED"];
    const { status } = req.body;

    if (!status || !VALID.includes(status.toUpperCase())) {
      return res.status(400).json({ message: `Invalid payment status. Valid: ${VALID.join(", ")}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });

    order.payment.status = status.toUpperCase();
    if (status.toUpperCase() === "PAID" && !order.payment.paidAt) order.payment.paidAt = new Date();

    await order.save();
    return res.json({ message: "Payment status updated.", order });
  } catch (err) {
    console.error("adminUpdatePaymentStatus:", err);
    return res.status(500).json({ message: "Server error.", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   ADMIN — Add Internal Note
   PATCH /api/admin/orders/:id/note
───────────────────────────────────────────────────────────── */

exports.adminAddNote = async (req, res) => {
  try {
    const { note } = req.body;
    if (!note) return res.status(400).json({ message: "Note is required." });

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { adminNote: note },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found." });

    return res.json({ message: "Note updated.", order });
  } catch (err) {
    console.error("adminAddNote:", err);
    return res.status(500).json({ message: "Server error.", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   ADMIN — Soft-Delete Order
   DELETE /api/admin/orders/:id
───────────────────────────────────────────────────────────── */

exports.adminDeleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found." });

    return res.json({ message: "Order deleted (soft).", orderId: order._id });
  } catch (err) {
    console.error("adminDeleteOrder:", err);
    return res.status(500).json({ message: "Server error.", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   ADMIN — Dashboard Stats
   GET /api/admin/orders/stats
───────────────────────────────────────────────────────────── */

exports.adminGetStats = async (req, res) => {
  try {
    const [statusBreakdown, revenueData, recentOrders] = await Promise.all([
      // Count by status
      Order.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Total revenue (DELIVERED + PAID)
      Order.aggregate([
        { $match: { isActive: true, status: "DELIVERED", "payment.status": "PAID" } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, totalOrders: { $sum: 1 } } },
      ]),

      // Last 5 orders
      Order.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "name email")
        .select("orderNumber status totalAmount payment.method createdAt"),
    ]);

    const stats = Object.fromEntries(statusBreakdown.map((s) => [s._id, s.count]));

    return res.json({
      statusBreakdown: stats,
      revenue:         revenueData[0] || { totalRevenue: 0, totalOrders: 0 },
      recentOrders,
    });
  } catch (err) {
    console.error("adminGetStats:", err);
    return res.status(500).json({ message: "Server error.", error: err.message });
  }
};