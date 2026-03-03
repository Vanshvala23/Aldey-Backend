const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Alday API",
      version: "1.0.0",
      description: "Professional API documentation for Alday",
    },

    servers: [
      {
        url: "https://aldey-backend.vercel.app/",
        description: "Local server",
      },
    ],

    tags: [
      { name: "Auth", description: "Authentication APIs" },
      { name: "Products", description: "Product management" },
      { name: "Cart", description: "Cart operations" },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      schemas: {
        Product: {
          type: "object",
          properties: {
            productId: { type: "string" },
            name: { type: "string" },
            category: { type: "string" },
            price: { type: "number" },
            description: { type: "string" },
            image: { type: "string" },
          },
        },
      },
    },

    security: [{ bearerAuth: [] }],
  },

  apis: ["./router/*.js"],
};

module.exports = swaggerJsdoc(options);