import mongoose from "mongoose";

export const BankTransaction = mongoose.model(
  "BankTransaction",
  new mongoose.Schema({
    accountHolderName: { type: String, required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: Number, required: true },
    ifscCode: { type: String, required: true },
    transactionType: { type: String, required: true },
    remark: { type: String, required: true },
    upiId: { type: String },
    upiAppName: { type: String },
    upiNumber: { type: String },
    afterBalance: { type: Number },
    beforeBalance: { type: Number },
    currentBalance: { type: Number },
    withdrawAmount: { type: Number },
    depositAmount: { type: Number },
    subAdminId: { type: String },
    subAdminName: { type: String },
    createdAt: { type: Date },
    isSubmit: { type: Boolean, default: false }
  }),
  "BankTransaction"
);
