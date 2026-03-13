const express = require('express');
const dotenv = require('dotenv');
const connectDB=require('./config/db');
const swaggerSpec=require('./config/swager');
const cors = require('cors');
dotenv.config();

const authRoutes = require('./router/authRoutes');
const productRoutes=require('./router/productRoutes');
const cartRoutes=require('./router/cartRoutes');
const {orderRouter,adminOrderRouter}=require('./router/orderRoutes');

const app = express();
const corsOptions = {
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));
app.use(express.json());
connectDB();
app.get("/api-docs", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alday API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { background: #0f172a; margin: 0; }
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin-bottom: 30px }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: "/api-docs/json",
        dom_id: "#swagger-ui",
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
        deepLinking: true,
      });
    };
  </script>
</body>
</html>
  `);
});

// Serve the raw spec as JSON (used by the UI above)
app.get("/api-docs/json", (req, res) => {
  res.json(swaggerSpec);
});
app.use('/api/auth', authRoutes);
app.use('/api/product',productRoutes);
app.use("/api/cart",cartRoutes);
app.use("/api/order",orderRouter);
app.use("/api/admin/order",adminOrderRouter);

app.get('/', (req, res) => {
    res.send('Welcome to Alday API');
});

// app.listen(5000, () => console.log('Server running on port 5000'));
module.exports = app;