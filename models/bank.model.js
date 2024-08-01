import mongoose from 'mongoose';

export const Bank = mongoose.model(
  'Bank',
  new mongoose.Schema({
    bankName: { type: String, required: true },
    accountHolderName: { type: String },
    accountNumber: { type: Number },
    ifscCode: { type: String },
    upiId: { type: String },
    upiAppName: { type: String },
    upiNumber: { type: String },
    subAdmins: [
      {
        subAdminId: { type: String },
        isDeposit: { type: Boolean, default: false },
        isWithdraw: { type: Boolean, default: false },
        isEdit: { type: Boolean, default: false },
        isRenew: { type: Boolean, default: false },
        isDelete: { type: Boolean, default: false },
      },
    ],
    subAdminName: { type: String },
    createdAt: { type: Date },
    isActive: { type: Boolean, default: false, required: true },
    isDeposit: { type: Boolean, default: true },
    isWithdraw: { type: Boolean, default: true },
    isEdit: { type: Boolean, default: true },
    isRenew: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: true },
  }),
  'Bank',
);
