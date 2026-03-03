const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Alday API",
      version: "1.0.0",
      description: "Alday E-commerce API Documentation",
    },
    servers: [
      {
        url: "https://aldey-backend.vercel.app/",
      },
    ],
  },

  // 🔥 IMPORTANT — where your route docs live
  apis: ["./router/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;