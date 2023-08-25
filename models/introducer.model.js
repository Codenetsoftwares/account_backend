import mongoose from "mongoose";

export const IntroducerUser = mongoose.model(
  "IntroducerUser",
  new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: "introducer" },
    wallet: { type: Number },
    introducerId : {  type: String },
    introducerPercentage : { type: Number },
    bankDetail: {
        accountHolderName: { type: String },
        bankName: { type: String },
        accountNumber: { type: Number },
        ifscCode: { type: String },
      },
      upiDetail: {
        upiId: { type: String },
        upiApp: { type: String },
        upiNumber: { type: Number },
      },
      webSiteDetail: [],
      creditTransaction : []
  }),
  "IntroducerUser"
);