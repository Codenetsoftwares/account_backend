import mongoose from "mongoose";

export const Transaction = mongoose.model(
  "Transaction",
  new mongoose.Schema({
    subAdminId : { type: String, required: true },
    transactionID: { type: String, required: true },
    transactionType: { type: String, required: true },
    amount: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    userId: { type: String, required: true },
    createdAt: { type: Date },
  }),
  "Transaction"
);
