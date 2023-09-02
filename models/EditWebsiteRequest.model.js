import mongoose from "mongoose";

export const EditWebsiteRequest = mongoose.model(
  "EditWebsiteRequest",
  new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId, ref: "WebsiteTransaction", required: true },
    transactionType: { type: String },
    remark: { type: String },
    beforeBalance: { type: Number },
    currentBalance: { type: Number },
    withdrawAmount: { type: Number },
    depositAmount: { type: Number },
    subAdminId: { type: String },
    subAdminName: { type: String },
    depositAmount: { type: Number },
    websiteName: { type: String },
    createdAt: { type: Date },
    isApproved: { type: Boolean, default: false, required: true },
  }),
  "EditWebsiteRequest"
);
