import mongoose from "mongoose";

export const WebsiteTransaction = mongoose.model(
  "WebsiteTransaction",
  new mongoose.Schema({
    name: { type: String, required: true },
    transactionType: { type: String },
    beforeBalance: { type: Number },
    currentBalance: { type: Number },
    withdrawAmount: { type: Number },
    depositAmount: { type: Number },
    subAdminId: { type: String },
    subAdminName: { type: String },
    date: { type: Date },
  }),
  "WebsiteTransaction"
);
