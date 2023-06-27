import mongoose from "mongoose";

export const DepositUser = mongoose.model(
  "DepositUser",
  new mongoose.Schema({
    // userID: { type: Number, required: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    userPassword: { type: String, required: true },
    timestamps: { type: Boolean, default: false },
  }),
  "DepositUser"
);