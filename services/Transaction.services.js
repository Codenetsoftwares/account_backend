import { EditRequest } from "../models/EditRequest.model.js";
import { Transaction } from "../models/transaction.js";
import { Website } from "../models/website.model.js";
import { User } from "../models/user.model.js";
import { BankTransaction } from "../models/BankTransaction.model.js";
import { WebsiteTransaction } from "../models/WebsiteTransaction.model.js";
import { Bank } from "../models/bank.model.js";
import { IntroducerTransaction } from "../models/IntroducerTransaction.model.js"
import { IntroducerEditRequest } from "../models/IntroducerEditRequest.model.js"
import { IntroducerUser } from "../models/introducer.model.js"
import { introducerUser } from "../services/introducer.services.js";
import AccountServices from "../services/Accounts.services.js";

const TransactionService = {
  createTransaction: async (req, res, subAdminName) => {
    try {
      const {
        transactionID,
        transactionType,
        amount,
        paymentMethod,
        userName,
        subAdminId,
        accountNumber,
        websiteName,
        bankName,
        bankCharges,
        bonus,
        remarks,
      } = req.body;
      if (!transactionID) {
        throw { code: 400, message: "Transaction ID is required" };
      }

      if (!amount || isNaN(amount)) {
        throw { code: 400, message: "Amount is required and must be a number" };
      }

      if (!paymentMethod) {
        throw { code: 400, message: "Payment Method is required" };
      }

      const existingTransaction = await Transaction.findOne({
        transactionID: transactionID,
        createdAt: {
          $gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      }).exec();
      if (existingTransaction) {
        return res.status(400).json({ status: false, message: "Transaction ID is already in use" });
      }

      // Website
      const dbWebsiteData = await Website.findOne({ websiteName: websiteName }).exec();
      const websiteId = dbWebsiteData._id;
      const websiteBalance = await AccountServices.getWebsiteBalance(websiteId);
      const totalBalance = bonus + amount;
      if (websiteBalance < totalBalance) {
        throw { code: 400, message: "Insufficient Website balance" };
      }
      console.log("totalBalance", totalBalance)


      // Bank
      const dbBankData = await Bank.findOne({ bankName: bankName }).exec();
      const bankId = dbBankData._id;
      const bankBalance = await AccountServices.getBankBalance(bankId);
      const totalBankBalance = bankCharges + amount;
      if (bankBalance < totalBankBalance) {
        throw { code: 400, message: "Insufficient Bank balance" };
      }


      // User
      const user = await User.findOne({ userName: userName }).exec();
      if (!user) {
        return res.status(404).send("User not found");
      }
      // Introducer
      const introducersUserName = user.introducersUserName;
      // Calculation of Deposit---- Amount will transfer from Website to Bank (Bonus)
      if (transactionType === "Deposit") {

        const newTransaction = new Transaction({
          bankId: dbBankData._id,
          websiteId: dbWebsiteData._id,
          transactionID: transactionID,
          transactionType: transactionType,
          amount: amount,
          paymentMethod: paymentMethod,
          subAdminId: subAdminName.userName,
          subAdminName: subAdminName.firstname,
          userName: userName,
          accountNumber: accountNumber,
          bankName: bankName,
          websiteName: websiteName,
          bonus: bonus,
          remarks: remarks,
          introducerUserName: introducersUserName,
          createdAt: new Date(),
          isSubmit: false,
        });

        await newTransaction.save();
        const user = await User.findOne({ userName: userName });
        if (!user) { return res.status(404).json({ status: false, message: "User not found" }); }
        user.transactionDetail.push(newTransaction);
        await user.save();
      }
      // Calculation of Withdraw---- Amount will transfer from Bank to Website (Bank Charge)
      if (transactionType === "Withdraw") {

        const newTransaction = new Transaction({
          bankId: dbBankData._id,
          websiteId: dbWebsiteData._id,
          transactionID: transactionID,
          transactionType: transactionType,
          amount: amount,
          paymentMethod: paymentMethod,
          subAdminId: subAdminName.userName,
          subAdminName: subAdminName.firstname,
          userName: userName,
          accountNumber: accountNumber,
          bankName: bankName,
          websiteName: websiteName,
          bankCharges: bankCharges,
          remarks: remarks,
          introducerUserName: introducersUserName,
          createdAt: new Date(),
          isSubmit: false,
        });
        await newTransaction.save();

        const user = await User.findOne({ userName: userName });

        if (!user) { return res.status(404).json({ status: false, message: "User not found" }); }
        user.transactionDetail.push(newTransaction);
        await user.save();
      }
      return res.status(200).json({ status: true, message: "Transaction created successfully" });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
  },

  createIntroducerDepositTransaction: async (req, res, subAdminName) => {
    try {
      const { amount, transactionType, remarks, subAdminId, subAdminName, introducerUserName } = req.body;

      const introId = await IntroducerUser.findOne({ userName: introducerUserName }).exec();
      if (transactionType === "Deposit") {
        const NewIntroducerTransaction = new IntroducerTransaction({
          introUserId: introId._id,
          amount: amount,
          transactionType: transactionType,
          remarks: remarks,
          subAdminId: subAdminId,
          subAdminName: subAdminName,
          introducerUserName: introducerUserName,
          createdAt: new Date(),
        });
        await NewIntroducerTransaction.save();
      }
      return res.status(200).json({ status: true, message: "Transaction created successfully" });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
  },
  

  createIntroducerWithdrawTransaction: async (req, res, subAdminName) => {
    try {
      const { amount, transactionType, remarks, subAdminId, subAdminName, introducerUserName } = req.body;

      const introId = await IntroducerUser.findOne({ userName: introducerUserName }).exec();
      if (transactionType === "Withdraw") {

        const NewIntroducerTransaction = new IntroducerTransaction({
          introUserId: introId._id,
          amount: amount,
          transactionType: transactionType,
          remarks: remarks,
          subAdminId: subAdminId,
          subAdminName: subAdminName,
          introducerUserName: introducerUserName,
          createdAt: new Date(),
        });
        await NewIntroducerTransaction.save();
      }
      return res.status(200).json({ status: true, message: "Transaction created successfully" });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
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

  updateTransaction: async (trans, data,user) => {
    const existingTransaction = await Transaction.findById(trans);

    const existingEditRequest = await EditRequest.findOne({ id: trans, type: "Edit", });
    if (existingEditRequest) { throw { code: 409, message: "Edit Request Already Sent For Approval" }; }

    let updatedTransactionData = {};
    let changedFields = {};

    if (existingTransaction.transactionType === "Deposit") {
      updatedTransactionData = {
        id: trans._id,
        transactionID: data.transactionID || existingTransaction.transactionID,
        transactionType: data.transactionType || existingTransaction.transactionType,
        amount: data.amount || existingTransaction.amount,
        paymentMethod: data.paymentMethod || existingTransaction.paymentMethod,
        userId: data.userId || existingTransaction.userId,
        subAdminId: data.subAdminId || existingTransaction.subAdminId,
        bankName: data.bankName || existingTransaction.bankName,
        websiteName: data.websiteName || existingTransaction.websiteName,
        remarks: data.remarks || existingTransaction.remarks,
        userName: data.userName || existingTransaction.userName
      };
      
      const originalTransactionData = { ...existingTransaction.toObject() };
      for (const key in data) {
        if (existingTransaction[key] !== data[key]) {
            changedFields[key] = {
                oldValue: originalTransactionData[key],
                newValue: data[key]
            };
        }
    }
    if (Object.keys(changedFields).length === 0) {
      throw { code: 400, message: "No changes were made to the transaction." };
  }
      const editRequest = new EditRequest({
        ...updatedTransactionData,
        originalData: changedFields,
        isApproved: false,
        isSubmit: false,
        type: "Edit",
        requesteduserName: user.firstname,
        message: "Deposit transaction is being edited.",
      });
      await editRequest.save();
    } else if (existingTransaction.transactionType === "Withdraw") {
      updatedTransactionData = {
        id: trans._id,
        transactionID: data.transactionID || existingTransaction.transactionID,
        transactionType: data.transactionType || existingTransaction.transactionType,
        amount: data.amount || existingTransaction.amount,
        paymentMethod: data.paymentMethod || existingTransaction.paymentMethod,
        userId: data.userId || existingTransaction.userId,
        subAdminId: data.subAdminId || existingTransaction.subAdminId,
        bankName: data.bankName || existingTransaction.bankName,
        websiteName: data.websiteName || existingTransaction.websiteName,
        remark: data.remark || existingTransaction.remarks,
      };

      const originalTransactionData = { ...existingTransaction.toObject() };
      for (const key in data) {
        if (existingTransaction[key] !== data[key]) {
            changedFields[key] = {
                oldValue: originalTransactionData[key],
                newValue: data[key]
            };
        }
    }
    if (Object.keys(changedFields).length === 0) {
      throw { code: 400, message: "No changes were made to the transaction." };
  }
      const editRequest = new EditRequest({
        ...updatedTransactionData,
        originalData: changedFields,
        isApproved: false,
        isSubmit: false,
        type: "Edit",
        requesteduserName: user.firstname,
        message: "Withdraw transaction is being edited.",
      });
      await editRequest.save();
    }
    return changedFields;
  },

  updateBankTransaction: async (bankTransaction, data,user) => {
    const existingBankTransaction = await BankTransaction.findById(bankTransaction);

    const existingEditRequest = await EditRequest.findOne({ id: bankTransaction, type: "Edit", });
    if (existingEditRequest) { throw { code: 409, message: "Edit Request Already Sent For Approval" }; }

    let updatedTransactionData = {};
    let changedFields = {};

    if (existingBankTransaction.transactionType === "Manual-Bank-Deposit") {
      updatedTransactionData = {
        id: bankTransaction._id,
        bankId: existingBankTransaction.bankId,
        bankName: data.bankName || existingBankTransaction.bankName,
        transactionType: data.transactionType || existingBankTransaction.transactionType,
        remarks: data.remarks || existingBankTransaction.remarks,
        depositAmount: data.depositAmount || existingBankTransaction.depositAmount,
        subAdminId: data.subAdminId || existingBankTransaction.subAdminId,
        subAdminName: data.subAdminName || existingBankTransaction.subAdminName,
        accountNumber: existingBankTransaction.accountNumber,
      };
      const originalTransactionData = { ...existingBankTransaction.toObject() };
      for (const key in data) {
        if (existingBankTransaction[key] !== data[key]) {
            changedFields[key] = {
                oldValue: originalTransactionData[key],
                newValue: data[key]
            };
        }
    }
    if (Object.keys(changedFields).length === 0) {
      throw { code: 400, message: "No changes were made to the transaction." };
  }
      const editRequest = new EditRequest({
        ...updatedTransactionData, originalData: changedFields, isApproved: false, type: "Edit",
        requesteduserName: user.firstname,
        message: "Manual-Bank-Deposit transaction is being edited.",
      });
      await editRequest.save();
    } else if (
      existingBankTransaction.transactionType === "Manual-Bank-Withdraw"
    ) {
      updatedTransactionData = {
        id: bankTransaction._id,
        bankId: existingBankTransaction.bankId,
        bankName: data.bankName || existingBankTransaction.bankName,
        transactionType: data.transactionType || existingBankTransaction.transactionType,
        remarks: data.remarks || existingBankTransaction.remarks,
        withdrawAmount: data.withdrawAmount || existingBankTransaction.withdrawAmount,
        subAdminId: data.subAdminId || existingBankTransaction.subAdminId,
        subAdminName: data.subAdminName || existingBankTransaction.subAdminName,
        accountNumber: existingBankTransaction.accountNumber,
      };
      const originalTransactionData = { ...existingBankTransaction.toObject() };
      for (const key in data) {
        if (existingBankTransaction[key] !== data[key]) {
            changedFields[key] = {
                oldValue: originalTransactionData[key],
                newValue: data[key]
            };
        }
    }
    if (Object.keys(changedFields).length === 0) {
      throw { code: 400, message: "No changes were made to the transaction." };
  }
      const editRequest = new EditRequest({
        ...updatedTransactionData, originalData: changedFields, isApproved: false, type: "Edit",
        requesteduserName: user.firstname,
        message: "Manual-Bank-Withdraw transaction is being edited.",
      });
      await editRequest.save();
    }
    return changedFields;
  },

  updateWebsiteTransaction: async (websiteTransaction, data,user) => {
    const existingWebsiteTransaction = await WebsiteTransaction.findById(websiteTransaction);

    const existingEditRequest = await EditRequest.findOne({ id: websiteTransaction, type: "Edit", });
    if (existingEditRequest) { throw { code: 409, message: "Edit Request Already Sent For Approval" }; }

    let updatedTransactionData = {};
    let changedFields = {};
    if (
      existingWebsiteTransaction.transactionType === "Manual-Website-Deposit"
    ) {
      updatedTransactionData = {
        id: websiteTransaction._id,
        transactionType: data.transactionType || existingWebsiteTransaction.transactionType,
        remarks: data.remarks || existingWebsiteTransaction.remarks,
        depositAmount: data.depositAmount || existingWebsiteTransaction.depositAmount,
        subAdminId: data.subAdminId || existingWebsiteTransaction.subAdminId,
        subAdminName: data.subAdminName || existingWebsiteTransaction.subAdminName,
        websiteName: data.websiteName || existingWebsiteTransaction.websiteName,
      };
      const originalTransactionData = { ...existingWebsiteTransaction.toObject() };
      for (const key in data) {
        if (existingWebsiteTransaction[key] !== data[key]) {
            changedFields[key] = {
                oldValue: originalTransactionData[key],
                newValue: data[key]
            };
        }
    }
    if (Object.keys(changedFields).length === 0) {
      throw { code: 400, message: "No changes were made to the transaction." };
  }
      const editRequest = new EditRequest({
        ...updatedTransactionData,
        originalData: changedFields,
        isApproved: false,
        isSubmit: false,
        requesteduserName: user.firstname,
        type: "Edit",
        message: "Manual-Website-Deposit transaction is being edited.",
      });
      await editRequest.save();
    } else if (
      existingWebsiteTransaction.transactionType === "Manual-Website-Withdraw"
    ) {
      updatedTransactionData = {
        id: websiteTransaction._id,
        transactionType: data.transactionType || existingWebsiteTransaction.transactionType,
        remarks: data.remarks || existingWebsiteTransaction.remarks,
        withdrawAmount: data.withdrawAmount || existingWebsiteTransaction.withdrawAmount,
        subAdminId: data.subAdminId || existingWebsiteTransaction.subAdminId,
        subAdminName: data.subAdminName || existingWebsiteTransaction.subAdminName,
        websiteName: data.websiteName || existingWebsiteTransaction.websiteName,
      };
      const originalTransactionData = { ...existingWebsiteTransaction.toObject() };
      for (const key in data) {
        if (existingWebsiteTransaction[key] !== data[key]) {
            changedFields[key] = {
                oldValue: originalTransactionData[key],
                newValue: data[key]
            };
        }
    }
    if (Object.keys(changedFields).length === 0) {
      throw { code: 400, message: "No changes were made to the transaction." };
  }
      const editRequest = new EditRequest({
        ...updatedTransactionData,
        originalData: changedFields,
        isApproved: false,
        isSubmit: false,
        type: "Edit",
        requesteduserName: user.firstname,
        message: "Manual-Website-Withdraw transaction is being edited.",
      });
      await editRequest.save();
    }
    return changedFields;
  },


  updateIntroTransaction: async (trans, data,user) => {
    const existingTransaction = await IntroducerTransaction.findById(trans);

    const existingEditRequest = await IntroducerEditRequest.findOne({ id: trans, type: "Edit", });
    if (existingEditRequest) { throw { code: 409, message: "Edit Request Already Sent For Approval" }; }

    let updatedTransactionData = {};
    let changedFields = {};

    if (existingTransaction.transactionType === "Deposit") {
      updatedTransactionData = {
        id: trans._id,
        transactionType: data.transactionType || existingTransaction.transactionType,
        amount: data.amount || existingTransaction.amount,
        subAdminId: data.subAdminId || existingTransaction.subAdminId,
        subAdminName: data.subAdminName || existingTransaction.subAdminName,
        remarks: data.remarks || existingTransaction.remarks,
        introducerUserName: data.introducerUserName || existingTransaction.introducerUserName
      };

      for (const key in data) {
        if (existingTransaction[key] !== data[key]) {
          changedFields[key] = data[key];
        }
      }

      const editRequest = new IntroducerEditRequest({...updatedTransactionData, changedFields, isApproved: false, type: "Edit",
      requesteduserName: user.firstname,
        message: "Introducer Deposit transaction is being edited.",
      });
      await editRequest.save();
    } else if (existingTransaction.transactionType === "Withdraw") {
      updatedTransactionData = {
        id: trans._id,
        transactionType: data.transactionType || existingTransaction.transactionType,
        amount: data.amount || existingTransaction.amount,
        subAdminId: data.subAdminId || existingTransaction.subAdminId,
        subAdminName: data.subAdminName || existingTransaction.subAdminName,
        remarks: data.remarks || existingTransaction.remarks,
        introducerUserName: data.introducerUserName || existingTransaction.introducerUserName
      };

      for (const key in data) {
        if (existingTransaction[key] !== data[key]) {
          changedFields[key] = data[key];
        }
      }

      const editRequest = new IntroducerEditRequest({...updatedTransactionData, changedFields, isApproved: false, type: "Edit",
      requesteduserName: user.firstname,
        message: "Introducer Withdraw transaction is being edited.",
      });
      await editRequest.save();
    }
    return changedFields;
  },
};

export default TransactionService;
