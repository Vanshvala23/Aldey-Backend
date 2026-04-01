const auth = require("./authMiddleware");

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }
    next();
  });
};

module.exports = adminAuth;