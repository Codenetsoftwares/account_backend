import { EditRequest } from "../models/EditRequest.model.js";
import { Transaction } from "../models/transaction.js";
import { Bank } from "../models/bank.model.js";
import { Website } from "../models/website.model.js";
import { User } from "../models/user.model.js";
import { BankTransaction } from "../models/BankTransaction.model.js";
import { WebsiteTransaction } from "../models/WebsiteTransaction.model.js";

const TransactionService = {
    createTransaction: async (req, res, subAdminName) => {
    try {
      const {
        transactionID,transactionType,amount,paymentMethod,userName,subAdminUserName,accountNumber,websiteName,bankName,bankCharges,bonus,remarks
      } = req.body;

      const existingTransaction = await Transaction.findOne({
        transactionID: transactionID,
      }).exec();
      if (existingTransaction) {
        return res
          .status(400)
          .json({ status: false, message: "Transaction already exists" });
      }

      const websiteId = await Website.findOne({ websiteName: websiteName }).exec();
      console.log("wesiteId", websiteId);
      const bankId = await Bank.findOne({
        accountNumber: accountNumber,
      }).exec();
      console.log("bankId", bankId);

      // Auto select user's introducersUserName
      const user = await User.findOne({userName:userName}).exec();
      console.log("user", user)
      if (!user) {
        return res.status(404).send("User not found");
      }
      const introducersUserName = user.introducersUserName;

// Calculation of Deposit---- Amount will transfer from Website to Bank (Bonus)
      if (transactionType === "Deposit") {
        const websiteBalance = websiteId.walletBalance;
        if (websiteBalance < amount) {
          throw new Error("Insufficient Website balance");
        }
        const newWebsiteBalance = (Number(websiteBalance) - Number(bonus)) - Number(amount);
        console.log("newWebsiteBalance", newWebsiteBalance);
        websiteId.walletBalance = newWebsiteBalance;
        await websiteId.save();

        const bankBalance = bankId.walletBalance;
        if (bankBalance < amount) {
          throw new Error("Insufficient Bank balance");
        }
        const newBankBalance = parseInt(bankBalance) + parseInt(amount);
        console.log("newBankBalance", newBankBalance);
        bankId.walletBalance = newBankBalance;
        await bankId.save();
      }
 // Calculation of Withdraw---- Amount will transfer from Bank to Website (Bank Charge)
      if (transactionType === "Withdraw") {
        const bankBalance = bankId.walletBalance;
        if (bankBalance < amount) {
          throw new Error("Insufficient Bank balance");
        }
        const newbankBalance = (Number(bankBalance) - Number(bankCharges)) - Number(amount);
        console.log("newbankBalance", newbankBalance);
        bankId.walletBalance = newbankBalance;
        await bankId.save();

        const websiteBalance = websiteId.walletBalance;
        console.log("first", websiteBalance)
        if (websiteBalance < amount) {
          throw new Error("Insufficient Website balance");
        }
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
          subAdminUserName: subAdminUserName,
          subAdminName: subAdminName.firstname,
          userName: userName,
          accountNumber: accountNumber,
          bankName: bankName,
          websiteName: websiteName,
          bonus: bonus,
          remarks: remarks,
          introducerUserName: introducersUserName,
          currentWebsiteBalance: websiteId.walletBalance,
          currentBankBalance: bankId.walletBalance,
          createdAt: new Date(),
          isSubmit: false
        });
        await newTransaction.save();
        const user = await User.findOne({ userName: userName });

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
          subAdminUserName: subAdminUserName,
          subAdminName: subAdminName.firstname,
          userName: userName,
          accountNumber: accountNumber,
          bankName: bankName,
          websiteName: websiteName,
          bankCharges: bankCharges,
          remarks: remarks,
          introducerUserName: introducersUserName,
          currentWebsiteBalance: websiteId.walletBalance,
          currentBankBalance :bankId.walletBalance,
          createdAt: new Date(),
          isSubmit: false
        });
        await newTransaction.save();
        const user = await User.findOne({ userName: userName });

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
    console.log("existingTransaction", existingTransaction);
    
    const cbb = await Bank.findOne({accountNumber:existingTransaction.accountNumber}).exec();
    const currBankBal = cbb.walletBalance
    const cwb = await Website.findOne({websiteName:existingTransaction.websiteName}).exec();
    const currWebsiteBal = cwb.walletBalance

    let updatedTransactionData = {};
    let changedFields = {};

    if (existingTransaction.transactionType === "Deposit") {
      updatedTransactionData = {
        id: trans._id,
        transactionID: data.transactionID || existingTransaction.transactionID,
        transactionType: data.transactionType  || existingTransaction.transactionType,
        amount: data.amount || existingTransaction.amount,
        paymentMethod: data.paymentMethod  || existingTransaction.paymentMethod,
        userId: data.userId  || existingTransaction.userId,
        subAdminId: data.subAdminId || existingTransaction.subAdminId,
        bankName: data.bankName || existingTransaction.bankName,
        websiteName: data.websiteName || existingTransaction.websiteName,
        remarks: data.remarks || existingTransaction.remarks, 
        currentBankBalance: Number(currBankBal) + Math.abs(Number(existingTransaction.amount-data.amount))  || existingTransaction.currentBankBalance,
        currentWebsiteBalance:  Number(currWebsiteBal) - Math.abs(Number(existingTransaction.amount-data.amount)) || existingTransaction.currentWebsiteBalance,
      };
      
    //   await Bank.updateOne(
    //     { _id: cbb._id },
    //     { $set: { walletBalance: updatedTransactionData.currentBankBalance } }
    // ).exec();

    // await Website.updateOne(
    //     { _id: cwb._id },
    //     { $set: { walletBalance: updatedTransactionData.currentWebsiteBalance } }
    // ).exec();

      for (const key in data) {
        if (existingTransaction[key] !== data[key]) {
          changedFields[key] = data[key];
        }
      }

      const editRequest = new EditRequest({...updatedTransactionData, changedFields, isApproved: false,isSubmit: false,
        type: "Edit",
        message: "Deposit transaction is being edited.",
      });
      await editRequest.save();

    } else if (existingTransaction.transactionType === "Withdraw") {
      updatedTransactionData = {
        id: trans._id,
        transactionID: data.transactionID || existingTransaction.transactionID,
        transactionType: data.transactionType  || existingTransaction.transactionType,
        amount: data.amount || existingTransaction.amount,
        paymentMethod: data.paymentMethod  || existingTransaction.paymentMethod,
        userId: data.userId  || existingTransaction.userId,
        subAdminId: data.subAdminId || existingTransaction.subAdminId,
        bankName: data.bankName || existingTransaction.bankName,
        websiteName: data.websiteName || existingTransaction.websiteName,
        remark: data.remark || existingTransaction.remarks, 
        currentBankBalance: Number(currBankBal) - Math.abs(Number(existingTransaction.amount-data.amount))  || existingTransaction.currentBankBalance,
        currentWebsiteBalance:  Number(currWebsiteBal) + Math.abs(Number(existingTransaction.amount-data.amount)) || existingTransaction.currentWebsiteBalance,
      };

    //   await Bank.updateOne(
    //     { _id: cbb._id },
    //     { $set: { walletBalance: updatedTransactionData.currentBankBalance } }
    // ).exec();

    // await Website.updateOne(
    //     { _id: cwb._id },
    //     { $set: { walletBalance: updatedTransactionData.currentWebsiteBalance } }
    // ).exec();

      for (const key in data) {
        if (existingTransaction[key] !== data[key]) {
          changedFields[key] = data[key];
        }
      }

      const editRequest = new EditRequest({
        ...updatedTransactionData,
        changedFields,
        isApproved: false,
        isSubmit: false,
        type: "Edit",
        message: "Withdraw transaction is being edited.",
      });
      await editRequest.save();
    }
    return changedFields;
  },

  updateBankTransaction: async (bankTransaction, data) => {
    const existingBankTransaction = await BankTransaction.findById(
      bankTransaction
    );

    const cbb = await Bank.findOne({accountNumber:existingBankTransaction.accountNumber}).exec();
    const currBankBal = cbb.walletBalance

    let updatedTransactionData = {};
    let changedFields = {};

    if (existingBankTransaction.transactionType === "Manual-Bank-Deposit") {
      for (const key in data) {
        if (existingBankTransaction[key] !== data[key]) {
          changedFields[key] = data[key];
          updatedTransactionData[key] = data[key];
        }
      }
      updatedTransactionData = {
        id: bankTransaction._id,
        transactionType: data.transactionType || existingBankTransaction.transactionType,
        remarks: data.remarks || existingBankTransaction.remarks,
        depositAmount: data.depositAmount || existingBankTransaction.depositAmount,
        subAdminId: data.subAdminId || existingBankTransaction.subAdminId,
        subAdminName: data.subAdminName || existingBankTransaction.subAdminName,
        currentBankBalance:  Number(currBankBal) + Math.abs(Number(existingBankTransaction.depositAmount-data.depositAmount)) || existingBankTransaction.currentBankBalance,
      };
      console.log("updated", bankTransaction.currentBalance);
      console.log("updated2", data.depositAmount);
      const editRequest = new EditRequest({
        ...updatedTransactionData,
        changedFields,
        isApproved: false,
        isSubmit: false,
        type: "Edit",
        message: "Manual-Bank-Deposit transaction is being edited.",
      });
      await editRequest.save();
    } else if (
      existingBankTransaction.transactionType === "Manual-Bank-Withdraw"
    ) {
      for (const key in data) {
        if (existingBankTransaction[key] !== data[key]) {
          changedFields[key] = data[key];
          updatedTransactionData[key] = data[key];
        }
      }
      // console.log('currentB',existingBankTransaction.currentBankBalance)
      updatedTransactionData = {
        id: bankTransaction._id,
        transactionType: data.transactionType || existingBankTransaction.transactionType,
        remarks: data.remarks || existingBankTransaction.remarks,
        withdrawAmount: data.withdrawAmount || existingBankTransaction.withdrawAmount,
        subAdminId: data.subAdminId || existingBankTransaction.subAdminId,
        subAdminName: data.subAdminName || existingBankTransaction.subAdminName,
        currentBankBalance:  Number(currBankBal) - Math.abs(Number(existingBankTransaction.withdrawAmount-data.withdrawAmount)) ||  existingBankTransaction.currentBankBalance,
      };
      
      // console.log('beforeBalance',updatedTransactionData.beforeBalance)
      console.log('update',updatedTransactionData)
      console.log('currentBalance',bankTransaction.currentBalance)
      console.log('withdrawAmount',data.withdrawAmount)
      // console.log('currentBalance',updatedTransactionData.currentBalance)
      const editRequest = new EditRequest({
        ...updatedTransactionData,
        changedFields,
        isApproved: false,
        isSubmit: false,
        type: "Edit",
        message: "Manual-Bank-Withdraw transaction is being edited.",
      });
      await editRequest.save();
    }
    return changedFields;
  },

  updateWebsiteTransaction: async (websiteTransaction, data) => {
    const existingWebsiteTransaction = await WebsiteTransaction.findById(
      websiteTransaction
    );
    const cwb = await Website.findOne({websiteName:existingWebsiteTransaction.websiteName}).exec();
    const currWebsiteBal = cwb.walletBalance;
    console.log("existingWebsiteTransaction", existingWebsiteTransaction);

    let updatedTransactionData = {};
    let changedFields = {};
    if (existingWebsiteTransaction.transactionType === "Manual-Webiste-Deposit") {
      for (const key in data) {
        if (existingWebsiteTransaction[key] !== data[key]) {
          changedFields[key] = data[key];
          updatedTransactionData[key] = data[key];
        }
      }
      updatedTransactionData = {
        id: websiteTransaction._id,
        transactionType: data.transactionType || existingWebsiteTransaction.transactionType,
        remarks: data.remarks || existingWebsiteTransaction.remarks,
        depositAmount: data.depositAmount || existingWebsiteTransaction.depositAmount,
        subAdminId: data.subAdminId || existingWebsiteTransaction.subAdminId,
        subAdminName: data.subAdminName || existingWebsiteTransaction.subAdminName,
        currentWebsiteBalance: Number(currWebsiteBal) + Math.abs(Number(existingWebsiteTransaction.depositAmount-data.depositAmount)) || existingWebsiteTransaction.currentWebsiteBalance,
      };
      const editRequest = new EditRequest({
        ...updatedTransactionData,
        changedFields,
        isApproved: false,
        isSubmit: false,
        type: "Edit",
        message: "Manual-Website-Deposit transaction is being edited.",
      });
      await editRequest.save();
    } else if (existingWebsiteTransaction.transactionType === "Manual-Website-Withdraw") {
      for (const key in data) {
        if (existingWebsiteTransaction[key] !== data[key]) {
          changedFields[key] = data[key];
          updatedTransactionData[key] = data[key];
        }
      }
      updatedTransactionData = { id: websiteTransaction._id,
        transactionType: data.transactionType || existingWebsiteTransaction.transactionType,
        remarks: data.remarks || existingWebsiteTransaction.remarks,
        withdrawAmount: data.withdrawAmount || existingWebsiteTransaction.withdrawAmount,
        subAdminId: data.subAdminId || existingWebsiteTransaction.subAdminId,
        subAdminName: data.subAdminName || existingWebsiteTransaction.subAdminName,
        beforeBalance: websiteTransaction.currentBalance,
        currentWebsiteBalance: Number(currBankBal) - Math.abs(Number(existingWebsiteTransaction.withdrawAmount-data.withdrawAmount)) || existingWebsiteTransaction.currentWebsiteBalance,
      };
      const editRequest = new EditRequest({ ...updatedTransactionData, changedFields, isApproved: false, isSubmit: false,type: "Edit",
        message: "Manual-Website-Withdraw transaction is being edited.",
      });
      await editRequest.save();
    }
    return changedFields;
  },
};

export default TransactionService;
