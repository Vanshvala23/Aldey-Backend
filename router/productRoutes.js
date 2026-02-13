const {createProduct}=require('../controller/productController');
const express = require('express');
const router = express.Router();
const upload=require('../middleware/upload');

router.post('/',upload.single("image"),createProduct);

module.exports=router;