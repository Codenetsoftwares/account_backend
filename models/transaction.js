import mongoose from "mongoose";

export const Transaction = mongoose.model(
  "Transaction",
  new mongoose.Schema({
    transactionID: { type: String, required: true },
    transactionType: { type: String, required: true },
    withdrawAmount: { type: Number },
    depositAmount: { type: Number },
    status: { type: Boolean, default: false, required: true },
    createdAt: { type: Date, default: new Date(), required: true }
  }),
  "Transaction"
);
