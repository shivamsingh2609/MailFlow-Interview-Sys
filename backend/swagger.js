
export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MailFlow API Documentation",
      version: "1.0.0",
      description: "API documentation for MailFlow project",
    },
    servers: [
      {
        url: "http://localhost:5000", 
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
    },
  },
  apis: ["./routes/*.js"], 
};
