import mongoose from "mongoose";

export const userWebsite = mongoose.model(
  "userWebsite",
  new mongoose.Schema({
    name: { type: String, required: true },
  }),
  "userWebsite"
);