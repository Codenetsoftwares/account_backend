import mongoose from "mongoose";

export const Website = mongoose.model(
  "Website",
  new mongoose.Schema({
    websiteName: { type: String, required: true },
    // subAdminId: { type: String },
    subAdminName: { type: String },
    subAdmins: [
      {
        subAdminId: { type: String },
        isDeposit: { type: Boolean, default: false },
        isWithdraw: { type: Boolean, default: false },
      }
    ],
    createdAt: { type: Date },
    isActive: {type: Boolean, default: false, required: true}
  }),
  "Website"
);
