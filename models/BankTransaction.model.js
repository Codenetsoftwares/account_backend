import mongoose from "mongoose";

export const BankTransaction = mongoose.model(
  "BankTransaction",
  new mongoose.Schema({
    bankId: { type: mongoose.Schema.Types.ObjectId },
    accountHolderName: { type: String },
    bankName: { type: String },
    accountNumber: { type: Number },
    ifscCode: { type: String },
    transactionType: { type: String },
    remarks: { type: String },
    upiId: { type: String },
    upiAppName: { type: String },
    upiNumber: { type: String },
    afterBalance: { type: Number },
    beforeBalance: { type: Number },
    currentBankBalance: { type: Number },
    withdrawAmount: { type: Number },
    depositAmount: { type: Number },
    subAdminId: { type: String },
    subAdminName: { type: String },
    createdAt: { type: Date },
    isSubmit: { type: Boolean, default: false }
  }),
  "BankTransaction"
);
