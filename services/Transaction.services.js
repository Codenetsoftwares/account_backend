import { EditRequest } from "../models/EditRequest.model.js";
import { Transaction } from "../models/transaction.js";
import { Website } from "../models/website.model.js";
import { User } from "../models/user.model.js";
import { BankTransaction } from "../models/BankTransaction.model.js";
import { WebsiteTransaction } from "../models/WebsiteTransaction.model.js";
import { Bank } from "../models/bank.model.js";
import { IntroducerTransaction } from "../models/IntroducerTransaction.model.js";
import { IntroducerEditRequest } from "../models/IntroducerEditRequest.model.js";
import { IntroducerUser } from "../models/introducer.model.js";
import AccountServices from "../services/Accounts.services.js";
import { apiResponseErr, apiResponsePagination, apiResponseSuccess,} from "../utils/response.js";
import { statusCode } from "../utils/statusCodes.js";
import { BankServices } from "./Bank.services.js";

const TransactionService = {
  createTransaction: async (req, res,) => {
    try {
      const subAdminName = req.user;
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

      const existingTransaction = await Transaction.findOne({
        transactionID: transactionID,
        createdAt: {
          $gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      }).exec();

      if (existingTransaction) {
        return apiResponseSuccess(null, false, statusCode.exist, "Transaction ID is already in use. Please try again after 48 hours.", res)
      }

      // Website
      const dbWebsiteData = await Website.findOne({
        websiteName: websiteName,
      }).exec();
      if(!dbWebsiteData)
      {
  
        return apiResponseErr(null, false, statusCode.badRequest, "Website not found", res)
      }
      console.log(dbWebsiteData)
      const websiteId = dbWebsiteData._id;
      const websiteBalance = await AccountServices.getWebsiteBalance(websiteId);
      const totalBalance = bonus + amount;
      if (websiteBalance < totalBalance) {
        return apiResponseErr(null, false, statusCode.badRequest, "Insufficient Website balance", res)
      }
      console.log("totalBalance", totalBalance);

      // Bank
      const dbBankData = await Bank.findOne({ bankName: bankName }).exec();
      const bankId = dbBankData._id;
      const bankBalance = await BankServices.getBankBalance(bankId);
      const totalBankBalance = bankCharges + amount;
      if (bankBalance < totalBankBalance) {
        return apiResponseErr(null, false, statusCode.badRequest, "Insufficient Bank balance", res)
      }

      // User
      const user = await User.findOne({ userName: userName }).exec();
      if (!user) {

        return apiResponseErr(null, false, statusCode.badRequest, "User not found", res)
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
        if (!user) {
          
          return apiResponseErr(null, false, statusCode.badRequest, "User not found", res)
        }
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

        if (!user) {
          return apiResponseErr(null, false, statusCode.badRequest, "User not found", res)
        }
        user.transactionDetail.push(newTransaction);
      
      }
      const users =  await user.save();
      return apiResponseSuccess(users, true, statusCode.success, 'Transaction created successfully!', res)

    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res)
    }
  },

  createIntroducerDepositTransaction: async (req, res, subAdminName) => {
    try {
      const {
        amount,
        transactionType,
        remarks,
        subAdminId,
        subAdminName,
        introducerUserName,
      } = req.body;

      const introId = await IntroducerUser.findOne({
        userName: introducerUserName,
      }).exec();
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

  createIntroducerWithdrawTransaction: async (req, res, subAdminName) => {
    try {
      const {
        amount,
        transactionType,
        remarks,
        subAdminId,
        subAdminName,
        introducerUserName,
      } = req.body;

      const introId = await IntroducerUser.findOne({
        userName: introducerUserName,
      }).exec();
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
      return apiResponseSuccess(
        { totalWithdraws: sum, withdraws: withdraws },
        true,
        statusCode.success,
        "Withdraw retrieved successfully!",
        res
      );
    } catch (error) {
      return apiResponseErr(
        null,
        false,
        statusCode.internalServerError,
        error.message,
        res
      );
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
      return apiResponseSuccess(
        { totalDeposits: sum, deposits: deposits },
        true,
        statusCode.success,
        "Deposits retrieved successfully!",
        res
      );
    } catch (error) {
      return apiResponseErr(
        null,
        false,
        statusCode.internalServerError,
        error.message,
        res
      );
    }
  },

  updateTransaction: async (req, res) => {
    try {
      const user = req.user;
      const trans = req.params.id;
      const {
        transactionID,
        transactionType,
        amount,
        paymentMethod,
        userName,
        userId,
        subAdminId,
        bankName,
        websiteName,
        remarks,
        
      } = req.body

      const existingTransaction = await Transaction.findById(trans);

      if(!existingTransaction){
        return apiResponseErr(null, false, statusCode.notFound, 'Transaction ID Not Found', res)
      }

      const existingEditRequest = await EditRequest.findOne({ id: trans, type: "Edit",});
      if (existingEditRequest) {
        return apiResponseErr( null, false, statusCode.exist, "Edit Request Already Sent For Approval", res);
      }

      let updatedTransactionData = {};
      let changedFields = {};

      if (existingTransaction.transactionType === "Deposit") {
        updatedTransactionData = {
          id: trans._id,
          transactionID:transactionID || existingTransaction.transactionID,
          transactionType: transactionType || existingTransaction.transactionType, 
          amount: amount || existingTransaction.amount,
          paymentMethod:paymentMethod || existingTransaction.paymentMethod,   
          userId: userId || existingTransaction.userId,
          subAdminId: subAdminId || existingTransaction.subAdminId,
          bankName: bankName || existingTransaction.bankName,
          websiteName: websiteName || existingTransaction.websiteName,
          remarks: remarks || existingTransaction.remarks,
          userName: userName || existingTransaction.userName,
        };

        const originalTransactionData = { ...existingTransaction.toObject() };
        for (const key in updatedTransactionData) {
          if (existingTransaction[key] !== updatedTransactionData[key]) {
            changedFields[key] = {
              oldValue: originalTransactionData[key],
              newValue: updatedTransactionData[key],
            };
          }
        }

        if (Object.keys(changedFields).length === 0) {
          return apiResponseSuccess( [], true, statusCode.success, "No changes were made to the transaction.", res);
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
          transactionID: transactionID || existingTransaction.transactionID,  
          transactionType:transactionType || existingTransaction.transactionType,           
          amount: amount || existingTransaction.amount,
          paymentMethod:paymentMethod || existingTransaction.paymentMethod,            
          userId: userId || existingTransaction.userId,
          subAdminId: subAdminId || existingTransaction.subAdminId,
          bankName: bankName || existingTransaction.bankName,
          websiteName: websiteName || existingTransaction.websiteName,
          remark: remarks || existingTransaction.remarks,
        };

        const originalTransactionData = { ...existingTransaction.toObject() };
        for (const key in updatedTransactionData) {
          if (existingTransaction[key] !== updatedTransactionData[key]) {
            changedFields[key] = {
              oldValue: originalTransactionData[key],
              newValue: updatedTransactionData[key],
            };
          }
        }
        if (Object.keys(changedFields).length === 0) {
          return apiResponseSuccess( [], true, statusCode.success, "No changes were made to the transaction.", res );
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
      return apiResponseSuccess(changedFields, true, statusCode.success, "Transaction update request send to Super Admin", res);
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res)
    }
  },

  updateBankTransaction: async (req, res) => {
    try {
      const user = req.user;
      const trans = req.params.id;
      const {
        bankName,
        transactionType,
        remarks,
        depositAmount,
        withdrawAmount, // Add this line
        subAdminId,
        subAdminName,
        accountNumber,
        bankId
      } = req.body;
  
      const existingBankTransaction = await BankTransaction.findById(trans);
      if (!existingBankTransaction) {
        return apiResponseErr(null, false, statusCode.notFound, 'Bank Transaction ID Not Found', res);
      }
  
      const existingEditRequest = await EditRequest.findOne({ id: trans, type: "Edit" });
      if (existingEditRequest) {
        return apiResponseErr(null, false, statusCode.exist, "Edit Request Already Sent For Approval", res);
      }
  
      let updatedTransactionData = {};
      let changedFields = {};
  
      if (existingBankTransaction.transactionType === "Manual-Bank-Deposit") {
        updatedTransactionData = {
          id: trans,
          bankId: bankId || existingBankTransaction.bankId,
          bankName: bankName || existingBankTransaction.bankName,
          transactionType: transactionType || existingBankTransaction.transactionType,
          remarks: remarks || existingBankTransaction.remarks,
          depositAmount: depositAmount || existingBankTransaction.depositAmount,
          subAdminId: subAdminId || existingBankTransaction.subAdminId,
          subAdminName: subAdminName || existingBankTransaction.subAdminName,
          accountNumber: accountNumber || existingBankTransaction.accountNumber,
        };
  
        const originalTransactionData = { ...existingBankTransaction.toObject() };
        for (const key in updatedTransactionData) {
          if (existingBankTransaction[key] !== updatedTransactionData[key]) {
            changedFields[key] = {
              oldValue: originalTransactionData[key],
              newValue: updatedTransactionData[key],
            };
          }
        }
  
        if (Object.keys(changedFields).length === 0) {
          return apiResponseSuccess([], true, statusCode.success, "No changes were made to the transaction.", res);
        }
  
        const editRequest = new EditRequest({
          ...updatedTransactionData,
          originalData: changedFields,
          isApproved: false,
          type: "Edit",
          requesteduserName: user.firstname,
          message: "Manual-Bank-Deposit transaction is being edited.",
        });
        await editRequest.save();
  
      } else if (existingBankTransaction.transactionType === "Manual-Bank-Withdraw") {
        updatedTransactionData = {
          id: trans,
          bankId: bankId || existingBankTransaction.bankId,
          bankName: bankName || existingBankTransaction.bankName,
          transactionType: transactionType || existingBankTransaction.transactionType,
          remarks: remarks || existingBankTransaction.remarks,
          withdrawAmount: withdrawAmount || existingBankTransaction.withdrawAmount,
          subAdminId: subAdminId || existingBankTransaction.subAdminId,
          subAdminName: subAdminName || existingBankTransaction.subAdminName,
          accountNumber: accountNumber || existingBankTransaction.accountNumber,
        };
  
        const originalTransactionData = { ...existingBankTransaction.toObject() };
        for (const key in updatedTransactionData) {
          if (existingBankTransaction[key] !== updatedTransactionData[key]) {
            changedFields[key] = {
              oldValue: originalTransactionData[key],
              newValue: updatedTransactionData[key],
            };
          }
        }
  
        if (Object.keys(changedFields).length === 0) {
          return apiResponseSuccess([], true, statusCode.success, "No changes were made to the transaction.", res);
        }
  
        const editRequest = new EditRequest({
          ...updatedTransactionData,
          originalData: changedFields,
          isApproved: false,
          type: "Edit",
          requesteduserName: user.firstname,
          message: "Manual-Bank-Withdraw transaction is being edited.",
        });
        await editRequest.save();
  
      }
  
      return apiResponseSuccess(changedFields, true, statusCode.success, 'Bank Transaction update request sent to Super Admin', res);
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },
  

  updateWebsiteTransaction: async (req, res) => {

    try{
    const user = req.user;
    const  websiteTransaction = req.params.id

    const
    {
      transactionType,
      depositAmount,
      withdrawAmount,
      subAdminId,
      subAdminName,
      websiteName,
      remarks
    } = req.body;
    
    const existingWebsiteTransaction = await WebsiteTransaction.findById(websiteTransaction);

    if (!existingWebsiteTransaction) {
      return apiResponseErr(null, false, statusCode.notFound, 'website Transaction ID Not Found', res);
    }

    const existingEditRequest = await EditRequest.findOne({
      id: websiteTransaction,
      type: "Edit",
    });
    if (existingEditRequest) {
      return apiResponseErr(null, false, statusCode.exist, "Edit Request Already Sent For Approval", res);
    }

    let updatedTransactionData = {};
    let changedFields = {};
    if (
      existingWebsiteTransaction.transactionType === "Manual-Website-Deposit"
    ) {
      updatedTransactionData = {
        id: websiteTransaction,
        transactionType:transactionType || existingWebsiteTransaction.transactionType,  
        remarks:remarks || existingWebsiteTransaction.remarks,
        depositAmount:depositAmount || existingWebsiteTransaction.depositAmount,
        subAdminId:subAdminId || existingWebsiteTransaction.subAdminId,
        subAdminName:subAdminName || existingWebsiteTransaction.subAdminName,   
        websiteName:websiteName || existingWebsiteTransaction.websiteName,
      };
      const originalTransactionData = {
        ...existingWebsiteTransaction.toObject(),
      };
      for (const key in updatedTransactionData) {
        if (existingWebsiteTransaction[key] !== updatedTransactionData[key]) {
          changedFields[key] = {
            oldValue: originalTransactionData[key],
            newValue: updatedTransactionData[key],
          };
        }
      }
      if (Object.keys(changedFields).length === 0) {
        return apiResponseSuccess([], true, statusCode.success, "No changes were made to the transaction.", res);

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
        id: websiteTransaction,
        transactionType:transactionType || existingWebsiteTransaction.transactionType,   
        remarks:remarks || existingWebsiteTransaction.remarks,
        withdrawAmount:withdrawAmount || existingWebsiteTransaction.withdrawAmount,    
        subAdminId:subAdminId || existingWebsiteTransaction.subAdminId,
        subAdminName:subAdminName || existingWebsiteTransaction.subAdminName,   
        websiteName:websiteName || existingWebsiteTransaction.websiteName,
      };
      const originalTransactionData = {
        ...existingWebsiteTransaction.toObject(),
      };
      for (const key in updatedTransactionData) {
        if (existingWebsiteTransaction[key] !== updatedTransactionData[key]) {
          changedFields[key] = {
            oldValue: originalTransactionData[key],
            newValue: updatedTransactionData[key],
          };
        }
      }
      if (Object.keys(changedFields).length === 0) {
        return apiResponseSuccess([], true, statusCode.success, "No changes were made to the transaction.", res);

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
    return apiResponseSuccess(changedFields, true, statusCode.success, 'Website Transaction update request sent to Super Admin', res);
  }catch(error){
    return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
  }
  },

  updateIntroTransaction: async (req,res) => {
 try{   
    const user = req.user;
    const trans = req.params.id;

    const
    {
      transactionType,
      amount,
      subAdminId,
      subAdminName,
      introducerUserName,
      remarks
    } = req.body;

    const existingTransaction = await IntroducerTransaction.findById(trans);
    if (!existingTransaction) {
      return apiResponseErr(null, false, statusCode.notFound, 'Introducer Transaction ID Not Found', res);
    }

    const existingEditRequest = await IntroducerEditRequest.findOne({ id: trans, type: "Edit",});
    if (existingEditRequest) {
      return apiResponseErr(null, false, statusCode.exist, "Edit Request Already Sent For Approval", res);
    }

    let updatedTransactionData = {};
    let changedFields = {};

    if (existingTransaction.transactionType === "Deposit") {
      updatedTransactionData = {
        id: trans._id,
        transactionType: transactionType || existingTransaction.transactionType, 
        amount: amount || existingTransaction.amount,
        subAdminId: subAdminId || existingTransaction.subAdminId,
        subAdminName: subAdminName || existingTransaction.subAdminName,
        remarks: remarks || existingTransaction.remarks,
        introducerUserName:introducerUserName || existingTransaction.introducerUserName,
          
      };

      for (const key in updatedTransactionData) {
        if (existingTransaction[key] !== updatedTransactionData[key]) {
          changedFields[key] =updatedTransactionData[key];
        }
      }

      const editRequest = new IntroducerEditRequest({
        ...updatedTransactionData,
        changedFields,
        isApproved: false,
        type: "Edit",
        requesteduserName: user.firstname,
        message: "Introducer Deposit transaction is being edited.",
      });
      await editRequest.save();
    } else if (existingTransaction.transactionType === "Withdraw") {
      updatedTransactionData = {
        id: trans._id,
        transactionType:transactionType || existingTransaction.transactionType,    
        amount: amount || existingTransaction.amount,
        subAdminId: subAdminId || existingTransaction.subAdminId,
        subAdminName: subAdminName || existingTransaction.subAdminName,
        remarks: remarks || existingTransaction.remarks,
        introducerUserName:introducerUserName || existingTransaction.introducerUserName,        
      };

      for (const key in updatedTransactionData) {
        if (existingTransaction[key] !== updatedTransactionData[key]) {
          changedFields[key] = updatedTransactionData[key];
        }
      }

      const editRequest = new IntroducerEditRequest({
        ...updatedTransactionData,
        changedFields,
        isApproved: false,
        type: "Edit",
        requesteduserName: user.firstname,
        message: "Introducer Withdraw transaction is being edited.",
      });
      await editRequest.save();
    }
    return apiResponseSuccess(changedFields, true, statusCode.success, 'Introducer Transaction update request sent to Super Admin', res);
  }catch(error){
    return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
  }
  },

  getEditTransactionRequests: async (req, res) => {
    try {
      const { page = 1, pageSize = 10 } = req.query;
      const skip = (page - 1) * pageSize;
      const limit = parseInt(pageSize);

      const dbBankData = await EditRequest.find()
        .skip(skip)
        .limit(limit)
        .exec();

      // Optionally, add balance fetching logic here
      // const bankData = JSON.parse(JSON.stringify(dbBankData));
      // for (var index = 0; index < bankData.length; index++) {
      //   bankData[index].balance = await AccountServices.getEditedBankBalance(
      //     bankData[index]._id
      //   );
      // }

      const totalItems = await EditRequest.countDocuments();
      const totalPages = Math.ceil(totalItems / limit);

      return apiResponsePagination(
        dbBankData,
        true,
        statusCode.success,
        "success",
        {
          page: parseInt(page),
          limit,
          totalPages,
          totalItems,
        },
        res
      );
    } catch (error) {
      return apiResponseErr(
        null,
        false,
        statusCode.internalServerError,
        error.message,
        res
      );
    }
  },

  getIntroducerEditRequests: async (req, res) => {
    try {
      const { page = 1, pageSize = 10 } = req.query;
      const skip = (page - 1) * pageSize;
      const limit = parseInt(pageSize);

      const introEdit = await IntroducerEditRequest.find()
        .skip(skip)
        .limit(limit)
        .exec();

      const totalItems = await IntroducerEditRequest.countDocuments();
      const totalPages = Math.ceil(totalItems / limit);

      return apiResponsePagination(
        introEdit,
        true,
        statusCode.success,
        "success",
        {
          page: parseInt(page),
          limit,
          totalPages,
          totalItems,
        },
        res
      );
    } catch (error) {
      return apiResponseErr(
        null,
        false,
        error.responseCode ?? statusCode.internalServerError,
        error.message,
        res
      );
    }
  },

  approveTransactionEditRequest : async (req, res) => {
    try {
      const {requestId} = req.params
      const editRequest = await EditRequest.findById({_id:requestId});
      console.log("editRequest",editRequest )
      if (!editRequest) {
        return apiResponseErr(null, false, statusCode.notFound, "Edit request not found", res)
      }
      const { isApproved } = req.body;
      if (typeof isApproved !== 'boolean') {
        return apiResponseErr(null, false, statusCode.badRequest, "isApproved field must be a boolean value", res)
      }
      if (!editRequest.isApproved) {
        const updatedTransaction = await Transaction.updateOne(
          { _id: editRequest.id },
          {
            transactionID: editRequest.transactionID,
            transactionType: editRequest.transactionType,
            amount: editRequest.amount,
            paymentMethod: editRequest.paymentMethod,
            userId: editRequest.userId,
            subAdminId: editRequest.subAdminId,
            bankName: editRequest.bankName,
            websiteName: editRequest.websiteName,
            remarks: editRequest.remarks,
          },
        );
        const user = await User.findOne({
          transactionDetail: {
            $elemMatch: { _id: editRequest.id },
          },
        });
        if (!user) {
          return apiResponseErr(null, false, statusCode.badRequest, "User not found", res)

          
        }
        const transactionIndex = user.transactionDetail.findIndex(
          (transaction) => transaction._id.toString() === editRequest.id.toString(),
        );
        if (transactionIndex !== -1) {
          user.transactionDetail[transactionIndex].transactionID = editRequest.transactionID;
          user.transactionDetail[transactionIndex].transactionType = editRequest.transactionType;
          user.transactionDetail[transactionIndex].amount = editRequest.amount;
          user.transactionDetail[transactionIndex].paymentMethod = editRequest.paymentMethod;
          user.transactionDetail[transactionIndex].userId = editRequest.userId;
          user.transactionDetail[transactionIndex].subAdminId = editRequest.subAdminId;
          user.transactionDetail[transactionIndex].bankName = editRequest.bankName;
          user.transactionDetail[transactionIndex].websiteName = editRequest.websiteName;
          user.transactionDetail[transactionIndex].remarks = editRequest.remarks;
        
          await user.save();
        }
        console.log('updatedTransaction', updatedTransaction);
        if (updatedTransaction.matchedCount === 0) {
          return apiResponseErr(null, false, statusCode.badRequest, "Transaction not found", res)

        }
        editRequest.isApproved = true;
        if (editRequest.isApproved === true) {
          const deletedEditRequest = await EditRequest.deleteOne({ _id: requestId });
          console.log(deletedEditRequest);
          if (!deletedEditRequest) {
           return apiResponseErr(null, false, statusCode.notFound, "Error deleting edit request", res)

            
          }

          return apiResponseSuccess(null, true, statusCode.success, 'Edit request approved and data updated', res)

        } else {
          return apiResponseErr(null, false, statusCode.success, "Edit request rejected", res)

        }
      } else {
          return apiResponseErr(null, false, statusCode.success, "Edit request rejected", res)
      }
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  approveBankEditRequest :  async (req, res) => {
    try {
      const {requestId} = req.params
      const editRequest = await EditRequest.findById({_id : requestId});
      console.log("Testing",editRequest)
      if (!editRequest) {
        //return res.status(404).send({ message: 'Edit request not found' });
        return apiResponseErr(null, false, statusCode.notFound, "Edit request not found", res)

      }
      const { isApproved } = req.body;
      if (typeof isApproved !== 'boolean') {
        //return res.status(400).send({ message: 'isApproved field must be a boolean value' });
        return apiResponseErr(null, false, statusCode.badRequest, "isApproved field must be a boolean value", res)
      }
      if (!editRequest.isApproved) {
        const updatedTransaction = await BankTransaction.updateOne(
          { _id: editRequest.id },
          //console.log({ _id: editRequest.id }),
          {
            bankName: editRequest.bankName,
            transactionType: editRequest.transactionType,
            remarks: editRequest.remarks,
            withdrawAmount: editRequest.withdrawAmount,
            depositAmount: editRequest.depositAmount,
            subAdminId: editRequest.subAdminId,
            subAdminName: editRequest.subAdminName,
          },
        );
        console.log('updatedTransaction', updatedTransaction);
        if (updatedTransaction.matchedCount === 0) {
         // return res.status(404).send({ message: 'Transaction not found' });
         return apiResponseErr(null, false, statusCode.badRequest, "Transaction not found", res)
        }
        
        editRequest.isApproved = true;
        if (editRequest.isApproved === true) {
          const deletedEditRequest = await EditRequest.deleteOne({_id : requestId});
          console.log(deletedEditRequest);

          if (!deletedEditRequest) {
            return apiResponseErr(null, false, statusCode.notFound, "Error deleting edit request", res)
          }

          return apiResponseSuccess(null, true, statusCode.success, 'Edit request approved and data updated', res)

        } else {
          return apiResponseErr(null, false, statusCode.success, "Edit request rejected", res)
        }
      } else {
        return apiResponseErr(null, false, statusCode.success, "Edit request rejected", res)
      }
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  approveWebsiteEditRequest : async (req, res) => {
  try {
    const {requestId} = req.params
    const editRequest = await EditRequest.findById({_id:requestId});
    if (!editRequest) {
      return apiResponseErr(null, false, statusCode.notFound, "Edit request not found", res)
    }
    const { isApproved } = req.body;
    if (typeof isApproved !== 'boolean') {
      return apiResponseErr(null, false, statusCode.badRequest, "isApproved field must be a boolean value", res)
    }
    if (!editRequest.isApproved) {
      const updatedTransaction = await WebsiteTransaction.updateOne(
        { _id: editRequest.id },
        {
          websiteName: editRequest.websiteName,
          transactionType: editRequest.transactionType,
          remarks: editRequest.remarks,
          withdrawAmount: editRequest.withdrawAmount,
          depositAmount: editRequest.depositAmount,
          currentWebsiteBalance: editRequest.currentWebsiteBalance,
          subAdminId: editRequest.subAdminId,
          subAdminName: editRequest.subAdminName,
        },
      );
      console.log('updatedTransaction', updatedTransaction);
      if (updatedTransaction.matchedCount === 0) {
        return apiResponseErr(null, false, statusCode.badRequest, "Transaction not found", res)
      }
      editRequest.isApproved = true;
      if (editRequest.isApproved === true) {
        const deletedEditRequest = await EditRequest.deleteOne({_id:requestId});
        console.log(deletedEditRequest);
      if(!deletedEditRequest) {
        return apiResponseErr(null, false, statusCode.badRequest, "Transaction not found", res)
      }

        return apiResponseSuccess(null, true, statusCode.success, 'Edit request approved and data updated', res)

      } else {
        return apiResponseErr(null, false, statusCode.success, "Edit request rejected", res)
      }
    } else {
      return apiResponseErr(null, false, statusCode.success, "Edit request rejected", res)
    }
  } catch (error) {
    return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);

  }
},

approveIntroducerEditRequest : async (req, res) => {
  try {
    const {requestId} = req.params
    const editRequest = await IntroducerEditRequest.findById({_id:requestId});
    if (!editRequest) {
      return apiResponseErr(null, false, statusCode.notFound, "Edit request not found", res)
    }
    const { isApproved } = req.body;
    if (typeof isApproved !== 'boolean') {
      return apiResponseErr(null, false, statusCode.badRequest, "isApproved field must be a boolean value", res)

    }
    if (!editRequest.isApproved) {
      const updatedTransaction = await IntroducerTransaction.updateOne(
        { _id: editRequest.id },
       // console.log({ _id: editRequest.id }),
        { 
          transactionType: editRequest.transactionType,
          remarks: editRequest.remarks,
          amount: editRequest.amount,
          subAdminId: editRequest.subAdminId,
          subAdminName: editRequest.subAdminName,
          introducerUserName: editRequest.introducerUserName,
        },
      );
      console.log('updatedTransaction', updatedTransaction);
      if (updatedTransaction.matchedCount === 0) {
        return apiResponseErr(null, false, statusCode.badRequest, "Transaction not found", res)
      }
      editRequest.isApproved = true;
      if (editRequest.isApproved === true) {
        const deletedEditRequest = await IntroducerEditRequest.deleteOne({_id:requestId});
        console.log(deletedEditRequest);
        if (!deletedEditRequest) {
          return res.status(500).send({ message: 'Error deleting edit request' });
        }

        if (!deletedEditRequest) {
          return apiResponseErr(null, false, statusCode.badRequest, "Transaction not found", res)
        }

        return apiResponseSuccess(null, true, statusCode.success, 'Edit request approved and data updated', res)

      }else {
        return apiResponseErr(null, false, statusCode.success, "Edit request rejected", res)
      }
    } else {
      return apiResponseErr(null, false, statusCode.success, "Edit request rejected", res)
    }
  } catch (error) {
    return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);

  }
},

allTransactionPages :   async (req, res) => {
  try {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const skip = (page - 1) * limit;
    const bankTransaction = await BankTransaction.find().limit(limit).skip(skip);

    if(!bankTransaction){
      return apiResponseErr(null, false, statusCode.notFound, "Bank Transaction Not found", res)

    }
   return apiResponseSuccess(bankTransaction, true, statusCode.success, 'All Transaction retrieved successfully!', res)

  } catch (error) {
    return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);

  }
}

};
export default TransactionService;
