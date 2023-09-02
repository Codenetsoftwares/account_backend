import mongoose from "mongoose";

export const EditBankRequest = mongoose.model(
  "EditBankRequest",
  new mongoose.Schema({
    id: {type: mongoose.Schema.Types.ObjectId,ref: "BankTransaction", required: true},
    transactionType: { type: String },
    remark: { type: String },
    beforeBalance: { type: Number },
    currentBalance: { type: Number },
    withdrawAmount: { type: Number },
    depositAmount: { type: Number },
    subAdminId: { type: String },
    subAdminName: { type: String },
    depositAmount: { type: Number },
    accountHolderName: { type: String, required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: Number, required: true },
    ifscCode: { type: String, required: true },
    upiId: { type: String },
    upiAppName: { type: String },
    upiNumber: { type: String },
    createdAt: { type: Date },
    isApproved: { type: Boolean, default: false, required: true },
  }),
  "EditBankRequest"
);
