import mongoose from "mongoose";

export const userBank = mongoose.model(
  "userBank",
  new mongoose.Schema({
    name: { type: String, required: true },
  }),
  "userBank"
);