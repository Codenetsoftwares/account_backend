import mongoose from "mongoose";

export const Transaction = mongoose.model(
  "Transaction",
  new mongoose.Schema({
    subAdminUserName: { type: String,  },
    subAdminName: { type: String},
    transactionID: { type: String },
    transactionType: { type: String },
    amount: { type: Number},
    paymentMethod: { type: String },
    userName: { type: String },
    introducerUserName : { type: String },
    bonus: { type: Number },
    bankCharges: { type: Number },
    remarks: { type: String },
    accountNumber: { type: Number },
    bankName: { type: String, required: true },
    websiteName: { type: String },
    createdAt: { type: Date },
    currentWebsiteBalance : { type: Number },
    currentBankBalance : { type: Number },
    // beforeBalanceBankDeposit: { type: Number },
    // currentBalanceWebsiteDeposit: { type: Number },
    // beforeBalanceWebsiteDeposit: { type: Number },
    // currentBalanceBankDeposit: { type: Number },
    // beforeBalanceBankWithdraw: { type: Number },
    // currentBalanceWebsiteWithdraw: { type: Number },
    // beforeBalanceWebsiteWithdraw: { type: Number },
    // currentBalanceBankWithdraw: { type: Number },
    // isSubmit: { type: Boolean, default: false }
  }),
  "Transaction"
);
