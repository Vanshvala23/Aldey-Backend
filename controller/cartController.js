const Cart = require("../modeues/Cart");
const Product = require("../modules/Products");

// ================= GET CART =================
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.json({ success: true, items: [] });
    }

    return res.json({
      success: true,
      items: cart.items.map((item) => ({
        id: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= ADD TO CART =================
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId is required",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        image: product.image,
        price: product.price,
        category: product.category,
        quantity,
      });
    }

    await cart.save();

    res.json({ success: true, message: "Added to cart" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= UPDATE QUANTITY =================
exports.updateQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid data",
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (i) => i.productId.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not in cart",
      });
    }

    item.quantity = quantity;
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

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();

    res.json({ success: true, message: "Item removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= CLEAR CART =================
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [] }
    );

    res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};