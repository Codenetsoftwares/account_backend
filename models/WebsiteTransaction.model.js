import mongoose from "mongoose";

export const WebsiteTransaction = mongoose.model(
  "WebsiteTransaction",
  new mongoose.Schema({
    websiteName: { type: String, required: true },
    remarks: { type: String, required: true },
    transactionType: { type: String },
    withdrawAmount: { type: Number },
    depositAmount: { type: Number },
    subAdminId: { type: String },
    subAdminName: { type: String },
    currentWebsiteBalance : { type: Number },
    isSubmit: { type: Boolean, default: false },
    createdAt: { type: Date },
  }),
  "WebsiteTransaction"
);
