import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import mongoose from "mongoose";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import AccountsRoute from './Routes/Accounts.route.js';
import UserRoutes from './Routes/User.route.js';
import TransactionRoute from './Routes/Transaction.route.js';
import IntroducerRoutes from './Routes/IntroducerUser.route.js';
import EditApiRoute from './Routes/EditApi.route.js'
import BankRoutes from './Routes/Bank.route.js'
import WebisteRoutes from './Routes/Website.route.js';
import DeleteAPIRoute from './Routes/DeleteAPI.routes.js'
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.urlencoded({ extended: true }));
const  allowedOrigins = process.env.FRONTEND_URI.split(",");
app.use(cors({ origin: allowedOrigins }));


mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_NAME });

AccountsRoute(app);
TransactionRoute(app);
UserRoutes(app);
IntroducerRoutes(app);
EditApiRoute(app);
BankRoutes(app);
WebisteRoutes(app);
DeleteAPIRoute(app);

app.listen(process.env.PORT, () => {
  console.log(`Read the docs - http://localhost:${process.env.PORT || 7000}/api/docs`);
});
