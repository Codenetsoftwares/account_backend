import mongoose from "mongoose";

export const EditRequest = mongoose.model(
    "EditRequest",
    new mongoose.Schema({
      transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: true },
      changes: [{field: { type: String, required: true },oldValue: { type: String },newValue: { type: String, required: true }}],
      isApproved: { type: Boolean, default: false, required: true },
    }),
    "EditRequest"
  );