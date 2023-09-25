import mongoose from "mongoose";

export const Website = mongoose.model(
  "Website",
  new mongoose.Schema({
    websiteName: { type: String, required: true },
    subAdminId: { type: String },
    subAdminName: { type: String },
    createdAt: { type: Date },
  }),
  "Website"
);
