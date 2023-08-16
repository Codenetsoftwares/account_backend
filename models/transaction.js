import mongoose from "mongoose";

export const Transaction = mongoose.model(
  "Transaction",
  new mongoose.Schema({
    transactionID: { type: String, required: true },
    transactionType: { type: String, required: true },
    amount: { type: String, required: true },
    paymentMethod: { type: String },
    createdAt: { type: Date },
  }),
  "Transaction"
);
