const Product = require("../modules/Products");

exports.createProduct = async (req, res) => {
  try {
    const { name, category, price, tag, rating, description } = req.body;

    const product = await Product.create({
      name,
      category,
      price,
      tag,
      rating,
      description,
      image: req.file.path, // Cloudinary URL
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
