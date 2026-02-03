import Product from "../modules/Products.js";

/* ---------------- CREATE PRODUCT ---------------- */
export const createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    const saved = await product.save();

    res.status(201).json({
      success: true,
      data: saved,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ---------------- GET ALL PRODUCTS ---------------- */
export const getProducts = async (req, res) => {
  try {
    const { keyword, category, minPrice, maxPrice } = req.query;

    let filter = {};

    // Search by name
    if (keyword) {
      filter.name = { $regex: keyword, $options: "i" };
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ---------------- GET SINGLE PRODUCT ---------------- */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------- UPDATE PRODUCT ---------------- */
export const updateProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------- DELETE PRODUCT ---------------- */
export const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------- ADD REVIEW ---------------- */
export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const review = {
      user: req.user?._id, // if using auth
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);

    // Update average rating
    product.rating =
      product.reviews.reduce((acc, item) => acc + item.rating, 0) /
      product.reviews.length;

    await product.save();

    res.json({
      success: true,
      message: "Review added",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
