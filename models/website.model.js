import mongoose from "mongoose";

export const Website = mongoose.model(
  "Website",
  new mongoose.Schema({
    name: { type: String, required: true },
    transactionType: { type: String, required: true },
    walletBalance : { type: Number },
    withdrawAmount : { type: Number },
    depositAmount : { type: Number },
    subAdminId : { type: String },
    subAdminName : { type: String }
  }),
  "Website"
);