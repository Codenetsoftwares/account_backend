import mongoose from "mongoose";

export const Bank = mongoose.model(
  "Bank",
  new mongoose.Schema({
    accountHolderName: { type: String },
    bankName: { type: String, required: true },
    accountNumber: { type: Number, required: true },
    ifscCode: { type: String },
    transactionType: { type: String },
    upiId: { type: String },
    upiAppName: { type: String },
    upiNumber: { type: String },
    walletBalance: { type: Number },
    withdrawAmount: { type: Number },
    depositAmount: { type: Number },
    subAdminId: { type: String },
    subAdminName: { type: String },
    createdAt: { type: Date },
  }),
  "Bank"
);
