import mongoose from 'mongoose';

export const Admin = mongoose.model(
  'Admin',
  new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    userName: { type: String },
    password: { type: String, required: true },
    roles: [{ type: String, required: true }],
  }),
  'Admin',
);
