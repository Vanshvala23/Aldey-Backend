const express = require('express');
const dotenv = require('dotenv');
const connectDB=require('./config/db');
dotenv.config();

const authRoutes = require('./router/authRoutes');
const productRoutes=require('./router/productRoutes');
const cartRoutes=require('./router/cartRoutes');

const app = express();
app.use(express.json());
connectDB();
app.use('/api/auth', authRoutes);
app.use('/api/product',productRoutes);
app.use("/api/cart",cartRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to Alday API');
});

app.listen(5000, () => console.log('Server running on port 5000'));
