const swaggerJsdoc = require("swagger-jsdoc");
const mongooseToSwagger = require("mongoose-to-swagger");

// import models
const Product = require("../modules/Products");
const User = require("../modules/Users");
const Cart = require("../modules/Cart");

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
        url: "https://aldey-backend.vercel.app",
        description: "Production server",
      },
      {
        url: "http://localhost:5000",
        description: "Local server",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      // 🔥 AUTO GENERATED SCHEMAS
      schemas: {
        Product: mongooseToSwagger(Product),
        User: mongooseToSwagger(User),
        Cart: mongooseToSwagger(Cart),
      },
    },

    security: [{ bearerAuth: [] }],
  },

  apis: ["./router/**/*.js"],
};

module.exports = swaggerJsdoc(options);