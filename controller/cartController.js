const Cart = require("../modules/Cart"); // Keep your exact path
const Product = require("../modules/Products");
const mongoose = require("mongoose");

// ================= GET CART =================
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.json({ success: true, items: [] });
    }

    return res.json({
      success: true,
      items: cart.items.map((item) => ({
        id: item.productId, // Frontend expects this
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
      })),
    });
  } catch (err) {
    console.error("Get Cart Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= ADD TO CART =================
exports.addToCart = async (req, res) => {
  try {
    // 🔥 FIX: Backend now accepts full product details from the frontend
    const { productId, quantity = 1, name, price, image, category } = req.body;
    const userId = req.user.id || req.user._id;

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    let productDetails = { name, price, image, category };

    // ONLY search database if it's a real MongoDB ObjectId (Prevents the 500 Crash!)
    if (mongoose.Types.ObjectId.isValid(productId)) {
      const dbProduct = await Product.findById(productId);
      if (dbProduct) {
        productDetails.name = dbProduct.name;
        productDetails.price = dbProduct.price;
        productDetails.image = dbProduct.image || (dbProduct.images && dbProduct.images[0]) || "";
        productDetails.category = Array.isArray(dbProduct.category) ? dbProduct.category[0] : dbProduct.category;
      }
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    // Match exact strings
    const existingItem = cart.items.find((item) => String(item.productId) === String(productId));

    if (existingItem) {
      existingItem.quantity += Number(quantity);
    } else {
      cart.items.push({
        productId: String(productId),
        name: productDetails.name || "Special Item",
        image: productDetails.image || "",
        price: Number(productDetails.price) || 0,
        category: productDetails.category || "ALDAY",
        quantity: Number(quantity),
      });
    }

    await cart.save();
    res.json({ success: true, message: "Added to cart" });
  } catch (err) {
    console.error("Add to Cart Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= UPDATE QUANTITY =================
exports.updateQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id || req.user._id;

    if (!productId || quantity < 1) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.find((i) => String(i.productId) === String(productId));
    if (!item) return res.status(404).json({ success: false, message: "Item not in cart" });

    item.quantity = Number(quantity);
    await cart.save();

    res.json({ success: true, message: "Quantity updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= REMOVE ITEM =================
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id || req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter((item) => String(item.productId) !== String(productId));
    await cart.save();

    res.json({ success: true, message: "Item removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= CLEAR CART =================
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    await Cart.findOneAndUpdate({ user: userId }, { items: [] });
    res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};