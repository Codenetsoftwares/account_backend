import mongoose from "mongoose";

export const WebsiteRequest = mongoose.model(
  "WebsiteRequest",
  new mongoose.Schema({
    websiteName: { type: String, required: true },
    subAdminId: { type: String },
    subAdminName: { type: String },
    createdAt: { type: Date },
    isApproved: { type: Boolean, default: false },
    isActive: {type: Boolean, default: false, required: true}
  }),
  "WebsiteRequest"
);
