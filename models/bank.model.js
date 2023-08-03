import mongoose from "mongoose";

export const Bank = mongoose.model(
  "Bank",
  new mongoose.Schema({
    name: { type: String, required: true },
  }),
  "Bank"
);