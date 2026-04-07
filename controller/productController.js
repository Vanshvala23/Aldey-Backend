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
      countInStock, 
    } = req.body;

    if (!productId || !name || !category || !price || !description) {
      return res.status(400).json({
        message: "productId, name, category, price, description are required",
      });
    }

    category        = parseCategory(category);
    images          = safeParse(images);
    keyActives      = safeParse(keyActives);
    ritual          = safeParse(ritual);
    fullIngredients = safeParse(fullIngredients);

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
      countInStock,
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
      category,      // React might send it as ?category=
      cat,           // React might send it directly as ?cat=
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

    const andConditions = [];

    // 🔥 FIX 1: Safely grab the category filter no matter what the frontend named it
    const activeCategory = category || cat;

    // 🔥 FIX 2: Case-Insensitive Filter for Categories & Concerns
    if (activeCategory) {
      const catArray = Array.isArray(activeCategory) ? activeCategory : [activeCategory];
      
      const regexCatArray = catArray.map(c => new RegExp(c, "i"));

      andConditions.push({
        $or: [
          { category: { $in: regexCatArray } },
          { concern: { $in: regexCatArray } },
          { "keyActives.name": { $in: regexCatArray } }, 
          { "fullIngredients.name": { $in: regexCatArray } }
        ]
      });
    }

    if (vendor) query.vendor = vendor;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 🔥 FIX 3: Deep Regex Search (Catching all possible frontend query names)
    const activeSearch = search || req.query.keyword || req.query.q;

    if (activeSearch) {
      andConditions.push({
        $or: [
          { name: { $regex: activeSearch, $options: "i" } },
          { description: { $regex: activeSearch, $options: "i" } },
          { title: { $regex: activeSearch, $options: "i" } },
          { subtitle: { $regex: activeSearch, $options: "i" } },
          { category: { $regex: activeSearch, $options: "i" } },
          { concern: { $regex: activeSearch, $options: "i" } },
          { tag: { $regex: activeSearch, $options: "i" } },
          { "keyActives.name": { $regex: activeSearch, $options: "i" } },
          { "fullIngredients.name": { $regex: activeSearch, $options: "i" } }
        ]
      });
    }

    // Apply conditions
    if (andConditions.length > 0) {
      query.$and = andConditions;
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
      $or: [{ productId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }],
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

    if (updates.category)        updates.category        = parseCategory(updates.category);
    if (updates.images)          updates.images          = safeParse(updates.images);
    if (updates.keyActives)      updates.keyActives      = safeParse(updates.keyActives);
    if (updates.ritual)          updates.ritual          = safeParse(updates.ritual);
    if (updates.fullIngredients) updates.fullIngredients = safeParse(updates.fullIngredients);

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

/* =====================================================
   ⭐ ADD PRODUCT REVIEW (🔥 FIXED 404 ERROR)
===================================================== */
exports.addProductReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body;
    
    // Safely check for the product using either MongoDB _id OR custom productId
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId 
      ? { $or: [{ _id: req.params.id }, { productId: req.params.id }] }
      : { productId: req.params.id };

    const product = await Product.findOne(query);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Create the review object
    const review = {
      name: req.user ? (req.user.fullName || req.user.name) : "Verified Customer",
      rating: Number(rating),
      title,
      comment,
      user: req.user ? req.user._id : undefined
    };

    // Initialize the array if it doesn't exist just in case
    if (!product.reviews) {
      product.reviews = [];
    }

    // Add review to array
    product.reviews.push(review);

    // Automatically update the total review count and calculate the new average rating
    product.reviewCount = product.reviews.length;
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();
    
    res.status(201).json({ success: true, message: 'Review added successfully', data: product.reviews });
  } catch (err) {
    console.error("Review Error:", err);
    res.status(500).json({ message: err.message });
  }
};