const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const swaggerSpec = require('./config/swager');
const cors = require('cors');
dotenv.config();

const authRoutes = require('./router/authRoutes');
const productRoutes = require('./router/productRoutes');
const cartRoutes = require('./router/cartRoutes');
const { orderRoutes, adminOrderRoutes } = require('./router/orderRoutes');

const app = express();
const corsOptions = {
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH' , 'OPTIONS'],
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
    /* ── Base ── */
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; background: #0f172a; }

    /* ── Hide default topbar ── */
    .swagger-ui .topbar { display: none !important; }

    /* ── Custom header ── */
    #custom-header {
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    #custom-header h1 {
      margin: 0;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: #f1f5f9;
      letter-spacing: -0.3px;
    }
    .header-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      background: #1e293b;
      color: #38bdf8;
      border: 1px solid #0369a1;
    }
    .header-badge.live {
      color: #4ade80;
      border-color: #166534;
      background: #052e16;
    }

    /* ── Swagger wrapper ── */
    #swagger-ui { background: #0f172a; }
    .swagger-ui { background: #0f172a; color: #cbd5e1; font-family: 'Inter', system-ui, sans-serif; }

    /* ── Info block ── */
    .swagger-ui .info { margin: 24px 0 8px; padding: 0 24px; }
    .swagger-ui .info .title { color: #f1f5f9 !important; font-size: 22px; font-weight: 600; }
    .swagger-ui .info p, .swagger-ui .info li { color: #94a3b8; }
    .swagger-ui .info a { color: #38bdf8; }

    /* ── Tag / section headers ── */
    .swagger-ui .opblock-tag {
      color: #e2e8f0 !important;
      border-bottom: 1px solid #1e293b !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      padding: 10px 24px !important;
    }
    .swagger-ui .opblock-tag:hover { background: #1e293b !important; }
    .swagger-ui .opblock-tag-section { background: #0f172a !important; }

    /* ── Endpoint blocks ── */
    .swagger-ui .opblock {
      background: #1e293b !important;
      border: 1px solid #334155 !important;
      border-radius: 8px !important;
      margin: 6px 0 !important;
      box-shadow: none !important;
    }
    .swagger-ui .opblock:hover { border-color: #475569 !important; }
    .swagger-ui .opblock-summary { padding: 10px 16px !important; }
    .swagger-ui .opblock-summary-description { color: #94a3b8 !important; font-size: 13px !important; }
    .swagger-ui .opblock-summary-path { color: #e2e8f0 !important; font-size: 13px !important; font-family: 'JetBrains Mono', monospace !important; }
    .swagger-ui .opblock-summary-path__deprecated { color: #64748b !important; }

    /* ── Method colours ── */
    .swagger-ui .opblock-get    { border-left: 3px solid #10b981 !important; background: #0d2318 !important; }
    .swagger-ui .opblock-post   { border-left: 3px solid #3b82f6 !important; background: #0d1526 !important; }
    .swagger-ui .opblock-put    { border-left: 3px solid #f59e0b !important; background: #1c1505 !important; }
    .swagger-ui .opblock-patch  { border-left: 3px solid #a78bfa !important; background: #160d26 !important; }
    .swagger-ui .opblock-delete { border-left: 3px solid #f87171 !important; background: #1c0505 !important; }

    .swagger-ui .opblock-get    .opblock-summary-method { background: #10b981 !important; }
    .swagger-ui .opblock-post   .opblock-summary-method { background: #3b82f6 !important; }
    .swagger-ui .opblock-put    .opblock-summary-method { background: #f59e0b !important; }
    .swagger-ui .opblock-patch  .opblock-summary-method { background: #a78bfa !important; }
    .swagger-ui .opblock-delete .opblock-summary-method { background: #f87171 !important; }

    .swagger-ui .opblock-summary-method {
      font-family: 'JetBrains Mono', monospace !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      min-width: 70px !important;
      text-align: center !important;
      border-radius: 4px !important;
      color: #fff !important;
      padding: 5px 8px !important;
    }

    /* ── Expanded body ── */
    .swagger-ui .opblock-body { background: #0f1929 !important; border-top: 1px solid #1e293b !important; }
    .swagger-ui .opblock-section-header { background: #1e293b !important; border-bottom: 1px solid #334155 !important; }
    .swagger-ui .opblock-section-header h4 { color: #94a3b8 !important; font-size: 11px !important; font-weight: 500 !important; letter-spacing: .8px !important; text-transform: uppercase !important; }

    /* ── Tables ── */
    .swagger-ui table thead tr th { background: #1e293b !important; color: #64748b !important; font-size: 11px !important; border-bottom: 1px solid #334155 !important; }
    .swagger-ui table tbody tr td { border-bottom: 1px solid #1e293b !important; color: #cbd5e1 !important; }
    .swagger-ui .parameter__name { color: #7dd3fc !important; font-family: 'JetBrains Mono', monospace !important; font-size: 12px !important; }
    .swagger-ui .parameter__type { color: #a78bfa !important; font-size: 11px !important; }
    .swagger-ui .parameter__in   { color: #64748b !important; font-size: 11px !important; }
    .swagger-ui .parameter__deprecated { color: #ef4444 !important; }
    .swagger-ui .parameter__name.required span { color: #f87171 !important; }
    .swagger-ui .prop-format { color: #64748b !important; }
    .swagger-ui .prop-type   { color: #a78bfa !important; }

    /* ── Response codes ── */
    .swagger-ui .responses-inner h4, .swagger-ui .responses-inner h5 { color: #94a3b8 !important; }
    .swagger-ui .response-col_status { color: #4ade80 !important; font-family: 'JetBrains Mono', monospace !important; font-weight: 600 !important; }
    .swagger-ui .response-col_description { color: #94a3b8 !important; }

    /* ── Try it / execute button ── */
    .swagger-ui .btn.execute {
      background: #3b82f6 !important;
      border-color: #3b82f6 !important;
      color: #fff !important;
      border-radius: 6px !important;
      font-size: 13px !important;
      font-weight: 500 !important;
    }
    .swagger-ui .btn.execute:hover { background: #2563eb !important; border-color: #2563eb !important; }
    .swagger-ui .btn.try-out__btn {
      background: transparent !important;
      border: 1px solid #3b82f6 !important;
      color: #3b82f6 !important;
      border-radius: 6px !important;
    }
    .swagger-ui .btn.try-out__btn:hover { background: #1e293b !important; }
    .swagger-ui .btn.cancel { border-color: #ef4444 !important; color: #ef4444 !important; background: transparent !important; border-radius: 6px !important; }

    /* ── Inputs ── */
    .swagger-ui input, .swagger-ui textarea, .swagger-ui select {
      background: #0f172a !important;
      border: 1px solid #334155 !important;
      color: #e2e8f0 !important;
      border-radius: 6px !important;
    }
    .swagger-ui input:focus, .swagger-ui textarea:focus { border-color: #3b82f6 !important; outline: none !important; }

    /* ── Code / response blocks ── */
    .swagger-ui .highlight-code, .swagger-ui .microlight {
      background: #0a0f1e !important;
      border: 1px solid #1e293b !important;
      border-radius: 6px !important;
      color: #a5f3fc !important;
    }
    .swagger-ui .copy-to-clipboard { background: #1e293b !important; border-color: #334155 !important; }

    /* ── Authorize button ── */
    .swagger-ui .btn.authorize {
      background: transparent !important;
      border: 1px solid #10b981 !important;
      color: #10b981 !important;
      border-radius: 6px !important;
    }
    .swagger-ui .btn.authorize:hover { background: #052e16 !important; }
    .swagger-ui .btn.authorize svg { fill: #10b981 !important; }

    /* ── Auth modal ── */
    .swagger-ui .dialog-ux .modal-ux { background: #1e293b !important; border: 1px solid #334155 !important; border-radius: 10px !important; }
    .swagger-ui .dialog-ux .modal-ux-header { background: #0f172a !important; border-bottom: 1px solid #334155 !important; }
    .swagger-ui .dialog-ux .modal-ux-header h3 { color: #f1f5f9 !important; }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0f172a; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #475569; }

    /* ── Misc ── */
    .swagger-ui .wrapper { padding: 0 16px !important; }
    .swagger-ui section.models { background: #1e293b !important; border: 1px solid #334155 !important; border-radius: 8px !important; }
    .swagger-ui section.models h4 { color: #e2e8f0 !important; }
    .swagger-ui .model-box { background: #0f172a !important; }
    .swagger-ui .model { color: #cbd5e1 !important; }
    .swagger-ui svg { fill: #94a3b8; }
    .swagger-ui .arrow { fill: #64748b !important; }
    .swagger-ui select { appearance: auto; }
  </style>
</head>
<body>
  <div id="custom-header">
    <h1>Alday API</h1>
    <span class="header-badge">v1.0.0</span>
    <span class="header-badge live">● live</span>
  </div>
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
        defaultModelsExpandDepth: -1,
        docExpansion: "list",
        filter: true,
        tryItOutEnabled: false,
      });
    };
  </script>
</body>
</html>
  `);
});

app.get("/api-docs/json", (req, res) => {
  res.json(swaggerSpec);
});

app.use('/api/auth', authRoutes);
app.use('/api/product', productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/admin/order", adminOrderRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to Alday API');
});

// --- CRITICAL FIX: EXPORT AND LISTEN ---

// 1. Export the app for Vercel serverless functions
module.exports = app;

// 2. Actually start the HTTP server if running locally
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is LIVE and running on port ${PORT}`);
  });
}