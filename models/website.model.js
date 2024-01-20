import mongoose from "mongoose";

export const Website = mongoose.model(
  "Website",
  new mongoose.Schema({
    websiteName: { type: String, required: true },
    subAdminName: { type: String },
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
    createdAt: { type: Date },
    isActive: { type: Boolean, default: false, required: true },
    isDeposit: { type: Boolean, default: true },
    isWithdraw: { type: Boolean, default: true },
    isEdit: { type: Boolean, default: true },
    isRenew: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: true },
  }),
  "Website"
);