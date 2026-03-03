const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const upload = require("../middleware/upload"); // multer/cloudinary

/**
 * @swagger
 * /api/product:
 *   post:
 *     summary: Create new product
 *     tags: [Products]
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
 */
router.post("/", upload.single("image"), productController.createProduct);

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
 * /api/product/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
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
 *         description: Product updated
 */
router.put("/:id", upload.single("image"), productController.updateProduct);

/**
 * @swagger
 * /api/product/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 */
router.delete("/:id", productController.deleteProduct);

module.exports = router;