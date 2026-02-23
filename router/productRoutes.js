const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const upload = require("../middleware/upload"); // multer/cloudinary

router.post("/", upload.single("image"), productController.createProduct);
router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.put("/:id", upload.single("image"), productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

module.exports = router;