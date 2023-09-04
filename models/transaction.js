import mongoose from "mongoose";

export const Transaction = mongoose.model(
  "Transaction",
  new mongoose.Schema({
    subAdminId: { type: String, required: true },
    subAdminName: { type: String, required: true },
    transactionID: { type: String, required: true },
    transactionType: { type: String, required: true },
    amount: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    userId: { type: String, required: true },
    bonus: { type: Number },
    bankCharges: { type: Number },
    remarks: { type: Number },
    beforeBalanceBankDeposit: { type: Number },
    currentBalanceWebsiteDeposit: { type: Number },
    beforeBalanceWebsiteDeposit: { type: Number },
    currentBalanceBankDeposit: { type: Number },
    beforeBalanceBankWithdraw: { type: Number },
    currentBalanceWebsiteWithdraw: { type: Number },
    beforeBalanceWebsiteWithdraw: { type: Number },
    currentBalanceBankWithdraw: { type: Number },
    accountNumber: { type: Number },
    bankName: { type: String },
    websiteName: { type: String },
    createdAt: { type: Date },
  }),
  "Transaction"
);
