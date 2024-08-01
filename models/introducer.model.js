import mongoose from 'mongoose';

export const IntroducerUser = mongoose.model(
  'IntroducerUser',
  new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: 'introducer' },
    introducerId: { type: String },
    userName: { type: String, required: true },
    creditTransaction: [],
  }),
  'IntroducerUser',
);
