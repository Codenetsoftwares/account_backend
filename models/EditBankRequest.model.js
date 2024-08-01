import mongoose from 'mongoose';

export const EditBankRequest = mongoose.model(
  'EditBankRequest',
  new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'BankTransaction', required: true },
    accountHolderName: { type: String },
    bankName: { type: String },
    accountNumber: { type: Number },
    ifscCode: { type: String },
    upiId: { type: String },
    upiAppName: { type: String },
    upiNumber: { type: String },
    createdAt: { type: Date },
    message: { type: String },
    type: { type: String },
    changedFields: {},
    isApproved: { type: Boolean, default: false, required: true },
  }),
  'EditBankRequest',
);
