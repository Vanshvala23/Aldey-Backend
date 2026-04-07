const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const upload = require("../middleware/upload");
const adminAuth = require("../middleware/adminAuth");

/**
 * @swagger
 * /api/product:
 *   post:
 *     summary: Create new product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - name
 *               - category
 *               - price
 *               - description
 *               - image
 *             properties:
 *               productId:
 *                 type: string
 *               name:
 *                 type: string
 *               title:
 *                 type: string
 *               subtitle:
 *                 type: string
 *               vendor:
 *                 type: string
 *               category:
 *                 type: string
 *               concern:
 *                 type: string
 *               price:
 *                 type: number
 *               mrp:
 *                 type: number
 *               sale:
 *                 type: boolean
 *               tag:
 *                 type: string
 *               rating:
 *                 type: number
 *               reviewCount:
 *                 type: number
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/", adminAuth, upload.single("image"), productController.createProduct);

/**
 * @swagger
 * /api/product:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products
 */
router.get("/", productController.getProducts);

/**
 * @swagger
 * /api/product/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get("/:id", productController.getProductById);

/**
 * @swagger
 * /api/product/{id}/review:
 *   post:
 *     summary: Add review
 *     tags: [Products]
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
 *               - rating
 *               - title
 *               - comment
 *             properties:
 *               rating:
 *                 type: number
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review added
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 */
router.post("/:id/review", productController.addProductReview);

/**
 * @swagger
 * /api/product/{id}:
 *   put:
 *     summary: Update product (Admin only)
 *     tags: [Products]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated
 */
router.put("/:id", adminAuth, upload.single("image"), productController.updateProduct);

/**
 * @swagger
 * /api/product/{id}:
 *   delete:
 *     summary: Delete product (Admin only)
 *     tags: [Products]
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
 *         description: Deleted
 */
router.delete("/:id", adminAuth, productController.deleteProduct);

/**
 * @swagger
 * /api/product/{id}:
 *   patch:
 *     summary: Partial update (Admin only)
 *     tags: [Products]
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
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               mrp:
 *                 type: number
 *               category:
 *                 type: array
 *                 items:
 *                   type: string
 *               tag:
 *                 type: string
 *               sale:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Partially updated
 */
router.patch("/:id", adminAuth, upload.single("image"), productController.updateProduct);

module.exports = router;