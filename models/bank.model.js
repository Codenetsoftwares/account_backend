import mongoose from "mongoose";

export const Bank = mongoose.model(
  "Bank",
  new mongoose.Schema({
    accountHolderName: { type: String, required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: Number, required: true },
    ifscCode: { type: String, required: true },
    transactionType: { type: String },
    upiId: { type: String },
    upiAppName: { type: String },
    upiNumber: { type: String },
    walletBalance: { type: Number },
    withdrawAmount: { type: Number },
    depositAmount: { type: Number },
    subAdminId: { type: String },
    subAdminName: { type: String },
    date: { type: Date },
  }),
  "Bank"
);
