import mongoose from "mongoose";

export const BankRequest = mongoose.model(
  "BankRequest",
  new mongoose.Schema({
    bankName: { type: String, required: true },
    accountHolderName: { type: String },
    accountNumber: { type: Number },
    ifscCode: { type: String },
    upiId: { type: String },
    upiAppName: { type: String },
    upiNumber: { type: String },
    // subAdminId: [],
    subAdmins: [
      {
        subAdminId: { type: String },
        isDeposit: { type: Boolean, default: false },
        isWithdraw: { type: Boolean, default: false },
      }
    ],
    subAdminName: { type: String },
    createdAt: { type: Date },
    isApproved: { type: Boolean, default: false },
    isActive: {type: Boolean, default: false, required: true}
  }),
  "BankRequest"
);
