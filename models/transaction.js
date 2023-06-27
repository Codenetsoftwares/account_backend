import mongoose from "mongoose";

export const Transaction = mongoose.model(
  "Transaction",
  new mongoose.Schema({
    transactionID: { type: Number, required: true },
    transactionType: { type: String, required: true },
    withdrawAmount: { type: Number },
    depositAmount: { type: String },
    status: { type: Boolean, default: false, required: true },
  }),
  "Transaction"
);
