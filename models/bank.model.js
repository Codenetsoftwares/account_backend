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
    // subAdminId: { type: String },
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
    isActive: {type: Boolean, default: false, required: true},
  }),
  "Bank"
);
