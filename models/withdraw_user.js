import mongoose from "mongoose";

export const WithdrawUser = mongoose.model(
  "WithdrawUser",
  new mongoose.Schema({
    // userID: { type: Number, required: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    userPassword: { type: String, required: true },
    timestamps: { type: Boolean, default: false },
  }),
  "WithdrawUser"
);