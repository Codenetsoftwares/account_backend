import mongoose from "mongoose";

export const Bank = mongoose.model(
  "Bank",
  new mongoose.Schema({
    accountHolderName: { type: String, required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: Number, required: true },
    ifscCode: { type: String, required: true },
    upiId: { type: String },
    upiAppName : { type: String },
    upiNumber: { type: String }
  }),
  "Bank"
);