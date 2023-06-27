import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import mongoose from "mongoose";
import AccountsRoute from './Routes/Accounts.route.js';
import TransactionRoute from './Routes/Transaction.route.js';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.AllowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_NAME });

AccountsRoute(app);
TransactionRoute(app);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
