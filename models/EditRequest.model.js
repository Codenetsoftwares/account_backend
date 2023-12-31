import mongoose from "mongoose";

export const EditRequest = mongoose.model(
  "EditRequest",
  new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    bankId: { type: mongoose.Schema.Types.ObjectId, ref: "Bank" },
    websiteId: { type: mongoose.Schema.Types.ObjectId, ref: "Website" },
    transactionID: { type: String },
    transactionType: { type: String, required: true },
    amount: { type: Number },
    paymentMethod: { type: String },
    userId: { type: String },
    userName: { type: String },
    requesteduserName: { type: String },
    subAdminId: { type: String },
    subAdminName: { type: String },
    depositAmount: { type: Number },
    withdrawAmount: { type: Number },
    bonus: { type: Number },
    bankCharges: { type: Number },
    remarks: { type: String },
    bankName: { type: String },
    websiteName: { type: String },
    accountHolderName: { type: String },
    bankName: { type: String },
    accountNumber: { type: Number },
    ifscCode: { type: String },
    upiId: { type: String },
    upiAppName: { type: String },
    upiNumber: { type: String },
    createdAt: { type: Date },
    message: { type: String },
    type: { type: String },
    Nametype : { type: String },
    changedFields: {},
    originalData : { type: Object },
    isSubmit: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false, required: true },
  }),
  "EditRequest"
);
