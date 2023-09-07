import mongoose from "mongoose";

export const WebsiteTransaction = mongoose.model(
  "WebsiteTransaction",
  new mongoose.Schema({
    websiteName: { type: String, required: true },
    remark: { type: String, required: true },
    transactionType: { type: String },
    beforeBalance: { type: Number },
    currentBalance: { type: Number },
    withdrawAmount: { type: Number },
    depositAmount: { type: Number },
    subAdminId: { type: String },
    subAdminName: { type: String },
    isSubmit: { type: Boolean, default: false },
    createdAt: { type: Date },
  }),
  "WebsiteTransaction"
);
