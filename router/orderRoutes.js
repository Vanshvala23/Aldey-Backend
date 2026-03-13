const express = require("express");
const router  = express.Router();
const ctrl    = require("../controller/orderController");
const auth    = require("../middleware/authMiddleware");

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden. Admins only." });
  }
  next();
};

/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: User order management
 *   - name: Admin - Orders
 *     description: Admin order management
 */

/**
 * @swagger
 * /api/order:
 *   post:
 *     summary: Place a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - shippingAddress
 *               - payment
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                       example: "prod-001"
 *                     quantity:
 *                       type: number
 *                       example: 2
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - fullName
 *                   - phone
 *                   - line1
 *                   - city
 *                   - state
 *                   - pincode
 *                 properties:
 *                   fullName:
 *                     type: string
 *                     example: "Jane Doe"
 *                   phone:
 *                     type: string
 *                     example: "9876543210"
 *                   line1:
 *                     type: string
 *                     example: "12 MG Road"
 *                   line2:
 *                     type: string
 *                     example: "Apt 4B"
 *                   city:
 *                     type: string
 *                     example: "Mumbai"
 *                   state:
 *                     type: string
 *                     example: "Maharashtra"
 *                   pincode:
 *                     type: string
 *                     example: "400001"
 *                   country:
 *                     type: string
 *                     example: "India"
 *               payment:
 *                 type: object
 *                 required:
 *                   - method
 *                 properties:
 *                   method:
 *                     type: string
 *                     enum: [COD, RAZORPAY, STRIPE]
 *                     example: "COD"
 *               couponCode:
 *                 type: string
 *                 example: "SAVE10"
 *               discountAmount:
 *                 type: number
 *                 example: 50
 *               shippingCharge:
 *                 type: number
 *                 example: 40
 *               taxRate:
 *                 type: number
 *                 example: 0.18
 *     responses:
 *       201:
 *         description: Order placed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", auth, ctrl.placeOrder);

/**
 * @swagger
 * /api/order/my:
 *   get:
 *     summary: Get logged-in user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED]
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/my", auth, ctrl.getMyOrders);

/**
 * @swagger
 * /api/order/{id}:
 *   get:
 *     summary: Get a single order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order MongoDB _id
 *     responses:
 *       200:
 *         description: Order fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.get("/:id", auth, ctrl.getOrderById);

/**
 * @swagger
 * /api/order/{id}/cancel:
 *   patch:
 *     summary: Cancel an order (PENDING / CONFIRMED / PROCESSING only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Changed my mind"
 *     responses:
 *       200:
 *         description: Order cancelled
 *       400:
 *         description: Cannot cancel order in current status
 *       404:
 *         description: Order not found
 */
router.patch("/:id/cancel", auth, ctrl.cancelOrder);

/**
 * @swagger
 * /api/order/{id}/return:
 *   patch:
 *     summary: Request a return (DELIVERED orders only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Product damaged"
 *     responses:
 *       200:
 *         description: Return request submitted
 *       400:
 *         description: Only delivered orders can be returned
 *       404:
 *         description: Order not found
 */
router.patch("/:id/return", auth, ctrl.returnOrder);

/* ═══════════════════════════════════════════════════════════
   ADMIN ROUTES
═══════════════════════════════════════════════════════════ */

const adminRouter = express.Router();

/**
 * @swagger
 * /api/admin/order/stats:
 *   get:
 *     summary: Dashboard stats (status breakdown, revenue, recent orders)
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats fetched successfully
 *       403:
 *         description: Forbidden
 */
adminRouter.get("/stats", auth, adminOnly, ctrl.adminGetStats);

/**
 * @swagger
 * /api/admin/order:
 *   get:
 *     summary: Get all orders with filters
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED]
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, FAILED, REFUNDED]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: "ORD-20240315"
 *         description: Search by order number
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *       403:
 *         description: Forbidden
 */
adminRouter.get("/", auth, adminOnly, ctrl.adminGetAllOrders);

/**
 * @swagger
 * /api/admin/order/{id}:
 *   get:
 *     summary: Get full order details
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order fetched
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
adminRouter.get("/:id", auth, adminOnly, ctrl.adminGetOrder);

/**
 * @swagger
 * /api/admin/order/{id}/status:
 *   patch:
 *     summary: Update order lifecycle status
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED]
 *               note:
 *                 type: string
 *                 example: "Dispatched from warehouse"
 *               trackingNumber:
 *                 type: string
 *                 example: "BD123456789IN"
 *               shippingPartner:
 *                 type: string
 *                 example: "Blue Dart"
 *               estimatedDelivery:
 *                 type: string
 *                 format: date
 *                 example: "2024-03-20"
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
adminRouter.patch("/:id/status", auth, adminOnly, ctrl.adminUpdateStatus);

/**
 * @swagger
 * /api/admin/order/{id}/payment-status:
 *   patch:
 *     summary: Manually update payment status
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PAID, FAILED, REFUNDED]
 *     responses:
 *       200:
 *         description: Payment status updated
 *       400:
 *         description: Invalid payment status
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
adminRouter.patch("/:id/payment-status", auth, adminOnly, ctrl.adminUpdatePaymentStatus);

/**
 * @swagger
 * /api/admin/order/{id}/note:
 *   patch:
 *     summary: Add internal admin note to an order
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *                 example: "Customer called, address confirmed."
 *     responses:
 *       200:
 *         description: Note updated
 *       400:
 *         description: Note is required
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
adminRouter.patch("/:id/note", auth, adminOnly, ctrl.adminAddNote);

/**
 * @swagger
 * /api/admin/order/{id}:
 *   delete:
 *     summary: Soft-delete an order
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order deleted (soft)
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
adminRouter.delete("/:id", auth, adminOnly, ctrl.adminDeleteOrder);

module.exports = { orderRoutes: router, adminOrderRoutes: adminRouter };