const express = require("express");
const router = express.Router();
const cartController = require("../controller/cartController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, cartController.getCart);
router.post("/add", auth, cartController.addToCart);
router.put("/update", auth, cartController.updateQuantity);
router.delete("/remove/:productId", auth, cartController.removeFromCart);
router.delete("/clear", auth, cartController.clearCart);

module.exports = router;