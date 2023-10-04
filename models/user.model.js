import mongoose from "mongoose";

export const User = mongoose.model(
  "User",
  new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    userId: { type: String },
    email: { type: String },
    userName: { type: String, required: true },
    password: { type: String, required: true },
    contactNumber: { type: Number, required: true },
    emailVerified: { type: Boolean },
    introducersUserName : {  type: String },
    introducerPercentage : { type: Number },
    wallet: { type: Number },
    profilePicture: { type: String },
    role: { type: String, default: "user" },
    bankDetail: {
      accountHolderName: { type: String },
      bankName: { type: String },
      accountNumber: { type: Number },
      ifscCode: { type: String },
    },
    upiDetail: {
      upiId: { type: String },
      upiApp: { type: String },
      upiNumber: { type: String },
    },
    webSiteDetail: [{}],
    tokens: {
      emailVerification: { type: String },
      passwordReset: { type: String },
    },
    transactionDetail: [
      {
        bankId: { type: mongoose.Schema.Types.ObjectId, ref: "Bank" },
        websiteId: { type: mongoose.Schema.Types.ObjectId, ref: "Website" },
        subAdminUserName: { type: String },
        subAdminName: { type: String },
        transactionID: { type: String },
        transactionType: { type: String },
        amount: { type: Number },
        paymentMethod: { type: String },
        userName: { type: String },
        introducerUserName : { type: String },
        bonus: { type: Number },
        bankCharges: { type: Number },
        remarks: { type: String },
        accountNumber: { type: Number },
        bankName: { type: String },
        websiteName: { type: String },
        createdAt: { type: Date },
      },
    ],
  }),
  "users"
);
