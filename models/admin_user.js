import mongoose from "mongoose";

export const Admin = mongoose.model(
  "Admin",
  new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    roles: [{ type: String, required: true }]
  }),
  "Admin"
);