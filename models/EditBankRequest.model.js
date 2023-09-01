import mongoose from "mongoose";

export const EditBankRequest = mongoose.model(
  "EditBankRequest",
  new mongoose.Schema({
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankTransaction",
      required: true,
    },
    transactionType: { type: String },
    remark: { type: String },
    beforeBalance: { type: Number },
    currentBalance: { type: Number },
    withdrawAmount: { type: Number },
    depositAmount: { type: Number },
    subAdminId: { type: String },
    subAdminName: { type: String },
    depositAmount: { type: Number },
    isApproved: { type: Boolean, default: false, required: true },
  }),
  "EditBankRequest"
);
