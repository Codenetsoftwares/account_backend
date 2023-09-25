import mongoose from "mongoose";

export const WebsiteTransaction = mongoose.model(
  "WebsiteTransaction",
  new mongoose.Schema({
    websiteId: { type: mongoose.Schema.Types.ObjectId, ref: "Website" },
    websiteName: { type: String },
    remarks: { type: String },
    transactionType: { type: String },
    withdrawAmount: { type: Number },
    depositAmount: { type: Number },
    subAdminId: { type: String },
    subAdminName: { type: String },
    createdAt: { type: Date },
  }),
  "WebsiteTransaction"
);
