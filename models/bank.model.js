import mongoose from "mongoose";

export const Bank = mongoose.model(
  "Bank",
  new mongoose.Schema({
    bankName: { type: String, required: true },
    accountHolderName: { type: String },
    accountNumber: { type: Number },
    ifscCode: { type: String },
    upiId: { type: String },
    upiAppName: { type: String },
    upiNumber: { type: String },
    subAdminId: { type: String },
    subAdminName: { type: String },
    createdAt: { type: Date },
  }),
  "Bank"
);
