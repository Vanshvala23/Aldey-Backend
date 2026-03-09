const Product = require("../modules/Products");

/* =====================================================
   🧠 Helper — Safe JSON Parse
===================================================== */
const safeParse = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  try {
    return typeof field === "string" ? JSON.parse(field) : field;
  } catch {
    return [];
  }
};

/* =====================================================
   🧠 Helper — Safe Category Parse
   Accepts:  "Face Wash"  →  ["Face Wash"]
             ["Face Wash", "Skin Care"]  →  ["Face Wash", "Skin Care"]
             '["Face Wash","Skin Care"]'  →  ["Face Wash", "Skin Care"]
===================================================== */
const parseCategory = (category) => {
  if (!category) return [];
  if (Array.isArray(category)) return category;
  try {
    const parsed = JSON.parse(category);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [category]; // plain string fallback
  }
};

/* =====================================================
   ➕ CREATE PRODUCT
===================================================== */
exports.createProduct = async (req, res) => {
  try {
    let {
      productId,
      name,
      title,
      subtitle,
      vendor,
      category,
      concern,
      price,
      mrp,
      sale,
      tag,
      rating,
      reviewCount,
      description,
      images,
      keyActives,
      ritual,
      fullIngredients,
      isActive,
    } = req.body;

    // ✅ required validation
    if (!productId || !name || !category || !price || !description) {
      return res.status(400).json({
        message: "productId, name, category, price, description are required",
      });
    }

    // 🔥 parse all arrays safely
    category        = parseCategory(category);
    images          = safeParse(images);
    keyActives      = safeParse(keyActives);
    ritual          = safeParse(ritual);
    fullIngredients = safeParse(fullIngredients);

    // ✅ handle main image (file OR raw URL)
    let mainImage = null;
    if (req.file?.path) {
      mainImage = req.file.path;
    } else if (req.body.image) {
      mainImage = req.body.image;
    }

    if (!mainImage) {
      return res.status(400).json({ message: "Product image is required" });
    }

    const product = await Product.create({
      productId,
      name,
      title,
      subtitle,
      vendor,
      category,
      concern,
      price,
      mrp,
      sale,
      tag,
      rating,
      reviewCount,
      description,
      image: mainImage,
      images,
      keyActives,
      ritual,
      fullIngredients,
      isActive,
    });

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Product with this productId already exists",
      });
    }
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   📦 GET ALL PRODUCTS (filters + pagination)
===================================================== */
exports.getProducts = async (req, res) => {
  try {
    const {
      page           = 1,
      limit          = 10,
      category,
      vendor,
      search,
      minPrice,
      maxPrice,
      sort           = "-createdAt",
      includeInactive = false,
    } = req.query;

    const query = {};

    // ✅ hide soft-deleted by default
    if (includeInactive !== "true") {
      query.isActive = true;
    }

    // ✅ category filter works on arrays — matches any product
    //    whose category array contains the queried value
    if (category) query.category = category;
    if (vendor)   query.vendor   = vendor;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 🔍 text search
    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query)
      .sort(sort)
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / limit),
      data:  products,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   🔍 GET SINGLE PRODUCT
===================================================== */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      productId: req.params.id,
      isActive:  true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   ✏️ UPDATE PRODUCT
===================================================== */
exports.updateProduct = async (req, res) => {
  try {
    const updates = { ...req.body };

    // 🔥 parse arrays if present
    if (updates.category)        updates.category        = parseCategory(updates.category);
    if (updates.images)          updates.images          = safeParse(updates.images);
    if (updates.keyActives)      updates.keyActives      = safeParse(updates.keyActives);
    if (updates.ritual)          updates.ritual          = safeParse(updates.ritual);
    if (updates.fullIngredients) updates.fullIngredients = safeParse(updates.fullIngredients);

    // ✅ new image upload
    if (req.file?.path) {
      updates.image = req.file.path;
    }

    const product = await Product.findOneAndUpdate(
      { productId: req.params.id },
      updates,
      { returnDocument: "after", runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   ❌ DELETE PRODUCT (soft delete)
===================================================== */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { productId: req.params.id },
      { isActive: false },
      { returnDocument: "after" }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};