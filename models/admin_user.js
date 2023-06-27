import mongoose from "mongoose";

export const Admin = mongoose.model(
  "Admin",
  new mongoose.Schema({
    // adminID: { type: Number, required: true },
    adminEmail: { type: String, required: true },
    adminName: { type: String, required: true },
    adminPassword: { type: String, required: true },
    timestamps: { type: Boolean, default: false },
  }),
  "Admin"
);