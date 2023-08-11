import mongoose from "mongoose";

export const EditRequest = mongoose.model(
  "EditRequest",
  new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: true },
    transactionID: { type: String, required: true },
    transactionType: { type: String, required: true },
    withdrawAmount: { type: Number },
    depositAmount: { type: Number },
    paymentMethod: { type: String },
    isApproved: { type: Boolean, default: false, required: true },
  }),
  "EditRequest"
);
