import mongoose from "mongoose";

export const EditWebsiteRequest = mongoose.model(
  "EditWebsiteRequest",
  new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId, ref: "WebsiteTransaction", required: true },
    transactionType: { type: String },
    remark: { type: String },
    withdrawAmount: { type: Number },
    depositAmount: { type: Number },
    subAdminId: { type: String },
    subAdminName: { type: String },
    websiteName: { type: String },
    createdAt: { type: Date },
    message: { type: String },
    type: { type: String },
    changedFields: {},
    isApproved: { type: Boolean, default: false, required: true },
  }),
  "EditWebsiteRequest"
);
