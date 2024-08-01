import mongoose from 'mongoose';

export const Transaction = mongoose.model(
  'Transaction',
  new mongoose.Schema({
    bankId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank' },
    websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website' },
    subAdminId: { type: String },
    subAdminName: { type: String },
    transactionID: { type: String },
    transactionType: { type: String },
    amount: { type: Number },
    paymentMethod: { type: String },
    userName: { type: String },
    introducerUserName: { type: String },
    bonus: { type: Number },
    bankCharges: { type: Number },
    remarks: { type: String },
    accountNumber: { type: Number },
    bankName: { type: String },
    websiteName: { type: String },
    createdAt: { type: Date, default: Date.now },
  }),
  'Transaction',
);
