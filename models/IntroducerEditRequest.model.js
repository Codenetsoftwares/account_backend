import mongoose from 'mongoose';

export const IntroducerEditRequest = mongoose.model(
  'IntroducerEditRequest',
  new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId },
    amount: { type: Number },
    requesteduserName: { type: String },
    transactionType: { type: String },
    remarks: { type: String },
    subAdminId: { type: String },
    subAdminName: { type: String },
    introducerUserName: { type: String },
    createdAt: { type: Date },
    message: { type: String },
    type: { type: String },
    Nametype: { type: String },
    changedFields: {},
    isApproved: { type: Boolean, default: false, required: true },
  }),
  'IntroducerEditRequest',
);
