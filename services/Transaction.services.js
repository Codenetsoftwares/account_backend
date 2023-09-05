import { EditRequest } from "../models/EditRequest.model.js";
import { Transaction } from "../models/transaction.js";
import { Bank } from "../models/bank.model.js";
import { Website } from "../models/website.model.js";
import { User } from "../models/user.model.js";
import { BankTransaction } from "../models/banktransaction.model.js";
import { WebsiteTransaction } from "../models/WebsiteTransaction.model.js";

const TransactionService = {
    createTransaction: async (req, res, subAdminName) => {
    try {
      const { transactionID, transactionType, amount, paymentMethod, userId, subAdminId, accountNumber, websiteName, bankName, bankCharges, bonus, remarks } = req.body;

      const existingTransaction = await Transaction.findOne({transactionID: transactionID}).exec();
      if (existingTransaction) {
        return res.status(400).json({ status: false, message: "Transaction already exists" });
      }

      const websiteId = await Website.findOne({ name: websiteName }).exec();
      console.log("wesiteId", websiteId);
      const bankId = await Bank.findOne({accountNumber: accountNumber}).exec();
      console.log("bankId", bankId);

      if (transactionType === "Deposit") {
        const websiteBalance = websiteId.walletBalance;
        if (websiteBalance < amount) {
          throw new Error("Insufficient balance");
        }
        const newWebsiteBalance = (websiteBalance + bankCharges) - amount;
        console.log("newWebsiteBalance", newWebsiteBalance);
        websiteId.walletBalance = newWebsiteBalance;
        await websiteId.save();

        const bankBalance = bankId.walletBalance;
        const newBankBalance = parseInt(bankBalance) + parseInt(amount);
        console.log("newBankBalance", newBankBalance);
        bankId.walletBalance = newBankBalance;
        await bankId.save();
      }

      if (transactionType === "Withdraw") {
        const bankBalance = bankId.walletBalance;
        if (bankBalance < amount) {
          throw new Error("Insufficient balance");
        }
        const newbankBalance = Number(bankBalance + bonus) - Number(amount);
        console.log("newbankBalance", newbankBalance);
        bankId.walletBalance = newbankBalance;
        await bankId.save();

        const websiteBalance = websiteId.walletBalance;
        const newWebsiteBalance = Number(websiteBalance) + Number(amount);
        console.log("newWebsiteBalance", newWebsiteBalance);
        websiteId.walletBalance = newWebsiteBalance;
        await websiteId.save();
      }

      if (transactionType === "Deposit") {
        const newTransaction = new Transaction({
          transactionID: transactionID,
          transactionType: transactionType,
          amount: amount,
          paymentMethod: paymentMethod,
          subAdminId: subAdminId,
          subAdminName: subAdminName.firstname,
          userId: userId,
          accountNumber: accountNumber,
          bankName: bankName,
          websiteName: websiteName,
          bankCharges: bankCharges,
          remarks:remarks,
          beforeBalanceWebsiteDeposit: websiteId.walletBalance + amount,
          beforeBalanceBankDeposit: bankId.walletBalance - amount,
          currentBalanceWebsiteDeposit: websiteId.walletBalance,
          currentBalanceBankDeposit: bankId.walletBalance,
          createdAt: new Date(),
        });
        await newTransaction.save();
        const user = await User.findOne({ userId: userId });

        if (!user) {
          return res
            .status(404)
            .json({ status: false, message: "User not found" });
        }
        user.transactionDetail.push(newTransaction);
        await user.save();
      }

      if (transactionType === "Withdraw") {
        const newTransaction = new Transaction({
          transactionID: transactionID,
          transactionType: transactionType,
          amount: amount,
          paymentMethod: paymentMethod,
          subAdminId: subAdminId,
          subAdminName: subAdminName.firstname,
          userId: userId,
          accountNumber: accountNumber,
          bankName: bankName,
          websiteName: websiteName,
          bonus:bonus,
          remarks:remarks,
          beforeBalanceWebsiteWithdraw: websiteId.walletBalance - amount,
          beforeBalanceBankWithdraw: bankId.walletBalance + amount,
          currentBalanceWebsiteWithdraw: websiteId.walletBalance,
          currentBalanceBankWithdraw: bankId.walletBalance,
          createdAt: new Date(),
        });
        await newTransaction.save();
        const user = await User.findOne({ userId: userId });

        if (!user) {
          return res
            .status(404)
            .json({ status: false, message: "User not found" });
        }
        user.transactionDetail.push(newTransaction);
        await user.save();
      }

      return res
        .status(200)
        .json({ status: true, message: "Transaction created successfully" });
    } catch (e) {
      console.error(e);
      res
        .status(e.code || 500)
        .send({ message: e.message || "Internal server error" });
    }
  },

  withdrawView: async (req, res) => {
    try {
      const withdraws = await Transaction.find({ transactionType: "Withdraw" })
        .sort({ createdAt: -1 })
        .exec();
      let sum = 0;
      for (let i = 0; i < withdraws.length; i++) {
        sum = sum + withdraws[i].withdrawAmount;
      }
      res.send({ totalWithdraws: sum, withdraws: withdraws });
    } catch (error) {
      return res.status(500).json({ status: false, message: error });
    }
  },

  depositView: async (req, res) => {
    try {
      const deposits = await Transaction.find({ transactionType: "Deposit" })
        .sort({ createdAt: -1 })
        .exec();
      let sum = 0;
      for (let i = 0; i < deposits.length; i++) {
        sum = sum + deposits[i].depositAmount;
      }
      res.send({ totalDeposits: sum, deposits: deposits });
    } catch (error) {
      return res.status(500).json({ status: false, message: error });
    }
  },

  updateTransaction: async (trans, data) => {
    const existingTransaction = await Transaction.findById(trans);
    console.log("existingTransaction", existingTransaction)

    let updatedTransactionData = {};

    if (existingTransaction.transactionType === 'Deposit') {
      updatedTransactionData = {
        id: trans._id,
        transactionID: existingTransaction.transactionID || data.transactionID,
        transactionType: existingTransaction.transactionType || data.transactionType,
        amount: existingTransaction.amount || data.amount,
        paymentMethod: existingTransaction.paymentMethod || data.paymentMethod,
        userId: existingTransaction.userId || data.userId,
        subAdminId: existingTransaction.subAdminId || data.subAdminId,
        bankName: existingTransaction.bankName || data.bankName,
        websiteName: existingTransaction.websiteName || data.websiteName,
        remark: existingTransaction.remarks || data.remark,
      };
      const editMessage = 'Deposit transaction is being edited.';
      await createEditRequest(updatedTransactionData, editMessage);
    } else if (existingTransaction.transactionType === 'Withdraw') {
      updatedTransactionData = {
        id: trans._id,
        transactionID: existingTransaction.transactionID || data.transactionID,
        transactionType: existingTransaction.transactionType || data.transactionType,
        amount: existingTransaction.amount || data.amount,
        paymentMethod: existingTransaction.paymentMethod || data.paymentMethod,
        userId: existingTransaction.userId || data.userId,
        subAdminId: existingTransaction.subAdminId || data.subAdminId,
        bankName: existingTransaction.bankName || data.bankName,
        websiteName: existingTransaction.websiteName || data.websiteName,
        remark: existingTransaction.remarks || data.remark,
      };
      const editMessage = 'Withdraw transaction is being edited.';
      await createEditRequest(updatedTransactionData, editMessage);
    } 
    async function createEditRequest(updatedTransactionData, editMessage) {
      const backupTransaction = new EditRequest({...updatedTransactionData, isApproved: false, message: editMessage});
      await backupTransaction.save();
    }
    return true;
  },

  updateBankTransaction: async (bankTransaction, data) => {
    const existingBankTransaction = await BankTransaction.findById(bankTransaction);
    console.log("existingBankTransaction", existingBankTransaction)

    let updatedTransactionData = {};

    if (existingBankTransaction.transactionType === 'Manual-Bank-Deposit') {
      updatedTransactionData = {
        id: bankTransaction._id,
        transactionType: existingBankTransaction.transactionType || data.transactionType,
        remark: existingBankTransaction.remark || data.remark,
        withdrawAmount: existingBankTransaction.withdrawAmount || data.withdrawAmount,
        depositAmount: existingBankTransaction.depositAmount || data.depositAmount,
        subAdminId: existingBankTransaction.subAdminId || data.subAdminId,
        subAdminName: existingBankTransaction.subAdminName || data.subAdminName,
        beforeBalance : bankTransaction.currentBalance,
        currentBalance: existingBankTransaction.currentBalance || (Number(id.beforeBalance) + Number(data.depositAmount)),
        currentBalance : existingBankTransaction.currentBalance || Number(id.currentBalance) - Number(data.withdrawAmount)
      };
      const editMessage = 'Manual-Bank-Deposit transaction is being edited.';
      await createEditRequest(updatedTransactionData, editMessage);
     
    } else if (existingBankTransaction.transactionType === 'Manual-Bank-Withdraw') {
      updatedTransactionData = {
        id: bankTransaction._id,
        transactionType: existingBankTransaction.transactionType || data.transactionType,
        remark: existingBankTransaction.remark || data.remark,
        withdrawAmount: existingBankTransaction.withdrawAmount || data.withdrawAmount,
        depositAmount: existingBankTransaction.depositAmount || data.depositAmount,
        subAdminId: existingBankTransaction.subAdminId || data.subAdminId,
        subAdminName: existingBankTransaction.subAdminName || data.subAdminName,
        beforeBalance : bankTransaction.currentBalance,
        currentBalance: existingBankTransaction.currentBalance || (Number(id.beforeBalance) + Number(data.depositAmount)),
        currentBalance : existingBankTransaction.currentBalance || Number(id.currentBalance) - Number(data.withdrawAmount)
      };
      const editMessage = 'Manual-Bank-Withdraw transaction is being edited.';
      await createEditRequest(updatedTransactionData, editMessage);
    }
    async function createEditRequest(updatedTransactionData, editMessage) {
      const backupTransaction = new EditRequest({...updatedTransactionData, isApproved: false, message: editMessage});
      await backupTransaction.save();
    }
    return true;
  },

  updateWebsiteTransaction: async (websiteTransaction, data) => {
    const existingWebsiteTransaction = await WebsiteTransaction.findById(websiteTransaction);
    console.log("existingWebsiteTransaction", existingWebsiteTransaction)

    let updatedTransactionData = {};

    if (existingWebsiteTransaction.transactionType === 'Manual-Webiste-Deposit') {
      updatedTransactionData = {
        id: websiteTransaction._id,
        transactionType: existingWebsiteTransaction.transactionType || data.transactionType,
        remark: existingWebsiteTransaction.remark || data.remark,
        withdrawAmount: existingWebsiteTransaction.withdrawAmount || data.withdrawAmount,
        depositAmount: existingWebsiteTransaction.depositAmount || data.depositAmount,
        subAdminId: existingWebsiteTransaction.subAdminId || data.subAdminId,
        subAdminName: existingWebsiteTransaction.subAdminName || data.subAdminName,
        beforeBalance : websiteTransaction.currentBalance,
        currentBalance: existingWebsiteTransaction.currentBalance || (Number(id.beforeBalance) + Number(data.depositAmount)),
        currentBalance: existingWebsiteTransaction.currentBalance || (Number(id.currentBalance) - Number(data.withdrawAmount))
      };
      const editMessage = 'Manual-Website-Deposit transaction is being edited.';
      await createEditRequest(updatedTransactionData, editMessage);
    } else if (existingWebsiteTransaction.transactionType === 'Manual-Website-Withdraw') {
      updatedTransactionData = {
        id: websiteTransaction._id,
        transactionType: existingWebsiteTransaction.transactionType || data.transactionType,
        remark: existingWebsiteTransaction.remark || data.remark,
        withdrawAmount: existingWebsiteTransaction.withdrawAmount || data.withdrawAmount,
        depositAmount: existingWebsiteTransaction.depositAmount || data.depositAmount,
        subAdminId: existingWebsiteTransaction.subAdminId || data.subAdminId,
        subAdminName: existingWebsiteTransaction.subAdminName || data.subAdminName,
        beforeBalance : websiteTransaction.currentBalance,
        currentBalance: existingWebsiteTransaction.currentBalance || (Number(id.beforeBalance) + Number(data.depositAmount)),
        currentBalance: existingWebsiteTransaction.currentBalance || (Number(id.currentBalance) - Number(data.withdrawAmount))
      };
      const editMessage = 'Manual-Website-Withdraw transaction is being edited.';
      await createEditRequest(updatedTransactionData, editMessage);
    }
    async function createEditRequest(updatedTransactionData, editMessage) {
      const backupTransaction = new EditRequest({...updatedTransactionData, isApproved: false, message: editMessage});
      await backupTransaction.save();
    }
    return true;
  },
};

export default TransactionService;
