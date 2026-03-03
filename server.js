const express = require('express');
const dotenv = require('dotenv');
const connectDB=require('./config/db');
const swaggerUi=require('swagger-ui-express');
const swaggerSpec=require('./config/swager');
const cors = require('cors');
dotenv.config();

const authRoutes = require('./router/authRoutes');
const productRoutes=require('./router/productRoutes');
const cartRoutes=require('./router/cartRoutes');

const app = express();
app.use(cors(
    {
        origin: "*",
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }
));
app.use(express.json());
connectDB();
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "Alday API Docs",
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin-bottom: 30px }
      body { background: #0f172a; }
    `,
  })
);
app.use('/api/auth', authRoutes);
app.use('/api/product',productRoutes);
app.use("/api/cart",cartRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to Alday API');
});

// app.listen(5000, () => console.log('Server running on port 5000'));
module.exports = app;