import mongoose from "mongoose";

export const Admin = mongoose.model(
  "Admin",
  new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    userName: { type: String, required: true },
    password: { type: String, required: true },
    roles: [{ type: String, required: true }]
  }),
  "Admin"
);