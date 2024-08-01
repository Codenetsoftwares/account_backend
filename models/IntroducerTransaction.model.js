import mongoose from 'mongoose';

export const IntroducerTransaction = mongoose.model(
  'IntroducerTransaction',
  new mongoose.Schema({
    introUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'IntroducerUser' },
    amount: { type: Number },
    transactionType: { type: String },
    remarks: { type: String },
    subAdminId: { type: String },
    subAdminName: { type: String },
    introducerUserName: { type: String },
    createdAt: { type: Date },
  }),
  'IntroducerTransaction',
);
