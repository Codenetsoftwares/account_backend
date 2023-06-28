import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import mongoose from "mongoose";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import AccountsRoute from './Routes/Accounts.route.js';
import TransactionRoute from './Routes/Transaction.route.js';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.AllowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(
    swaggerJsdoc({
      definition: {
        openapi: "3.0.0",
        info: {
          title: "Backend API for CRM",
          version: "1.0.0",
          description: "This is the Backend API for the CRM Platform",
        },
        servers: [
          {
            url: `http://localhost:${process.env.PORT || 8080}`,
            description: "Local Dev Server",
          },
          {
            url: "",
            description: "Production Server",
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              in: "header",
              name: "Authorization",
              description: "Bearer token to access protected endpoints",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
        tags: [
          {
            name: "Accounts",
            description: "User Register, Login & Profile APIs",
          },
          {
            name: "Transaction",
            description: "Transaction APIs",
          },
        ],
      },
      apis: ["./routes/*.js"],
    }),
    { explorer: true }
  )
);

mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_NAME });

AccountsRoute(app);
TransactionRoute(app);

app.listen(process.env.PORT, () => {
  console.log(`Read the docs - http://localhost:${process.env.PORT || 8080}/api/docs`);
});
