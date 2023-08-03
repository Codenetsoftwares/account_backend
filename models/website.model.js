import mongoose from "mongoose";

export const Website = mongoose.model(
  "Website",
  new mongoose.Schema({
    name: { type: String, required: true },
  }),
  "Website"
);