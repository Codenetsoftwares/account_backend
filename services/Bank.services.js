import { parse } from 'dotenv';
import { Bank } from '../models/bank.model.js';
import { BankRequest } from '../models/BankRequest.model.js';
import CustomError from '../utils/extendError.js';
import { apiResponseErr, apiResponsePagination, apiResponseSuccess } from '../utils/response.js';
import { statusCode } from '../utils/statusCodes.js';
import AccountServices from './Accounts.services.js';
import { BankTransaction } from '../models/BankTransaction.model.js';
import { Transaction } from '../models/transaction.js';
import { EditRequest } from '../models/EditRequest.model.js';
import { string } from '../constructor/string.js';
import { EditBankRequest } from '../models/EditBankRequest.model.js';

export const BankServices = {
  addBank: async (req, res) => {
    try {
      const userName = req.user;
      const { accountHolderName, bankName, accountNumber, ifscCode, upiId, upiAppName, upiNumber, isActive } = req.body;

      const newBankName = new BankRequest({
        accountHolderName: accountHolderName,
        bankName: bankName,
        accountNumber: accountNumber,
        ifscCode: ifscCode,
        upiId: upiId,
        upiAppName: upiAppName,
        upiNumber: upiNumber,
        subAdminId: userName.userName,
        subAdminName: userName.firstname,
        isActive: isActive,
        isApproved: false,
      });

      const id = await Bank.find({ bankName });
      id.map((data) => {
        console.log(data.bankName);
        if (newBankName.bankName.toLocaleLowerCase() === data.bankName.toLocaleLowerCase()) {
          throw new CustomError('Bank name already exists!', null, statusCode.exist);
        }
      });
      await newBankName.save();
      return apiResponseSuccess(newBankName, true, statusCode.create, 'Bank name sent for approval!', res);
    } catch (error) {
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  approveBank: async (req, res) => {
    try {
      const { isApproved, subAdmins } = req.body;
      const bankId = req.params.id;

      const approvedBankRequest = await BankRequest.findById(bankId);
      if (!approvedBankRequest) {
        return apiResponseErr(null, true, statusCode.badRequest, 'Bank not found in the approval requests!', res);
      }

      let approvedBank;

      if (isApproved) {
        approvedBank = new Bank({
          accountHolderName: approvedBankRequest.accountHolderName,
          bankName: approvedBankRequest.bankName,
          accountNumber: approvedBankRequest.accountNumber,
          ifscCode: approvedBankRequest.ifscCode,
          upiId: approvedBankRequest.upiId,
          upiAppName: approvedBankRequest.upiAppName,
          upiNumber: approvedBankRequest.upiNumber,
          subAdmins: subAdmins,
          isActive: true,
        });

        await approvedBank.save();
        await BankRequest.deleteOne({ _id: approvedBankRequest._id });
      } else {
        return apiResponseErr(null, true, statusCode.badRequest, 'Bank approval was not granted.', res);
      }
      return apiResponseSuccess(
        approvedBank,
        true,
        statusCode.create,
        'Bank approved successfully & Subadmin Assigned',
        res,
      );
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  improveBank: async (req, res) => {
    try {
      const { subAdmins } = req.body;
      console.log('first', subAdmins);
      const bankId = req.params.id;

      const approvedBankRequest = await Bank.findById(bankId);
      console.log('first', approvedBankRequest);
      if (!approvedBankRequest) {
        return apiResponseErr(null, true, statusCode.badRequest, 'Bank not found in the approval requests!', res);
      }

      const approvedBank = new Bank({
        accountHolderName: approvedBankRequest.accountHolderName,
        bankName: approvedBankRequest.bankName,
        accountNumber: approvedBankRequest.accountNumber,
        ifscCode: approvedBankRequest.ifscCode,
        upiId: approvedBankRequest.upiId,
        upiAppName: approvedBankRequest.upiAppName,
        upiNumber: approvedBankRequest.upiNumber,
        subAdmins: subAdmins,
        isActive: true,
      });
      await approvedBank.save();

      return apiResponseSuccess(
        approvedBank,
        true,
        statusCode.create,
        'Bank approved successfully & Subadmin Assigned',
        res,
      );
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  viewBankRequest: async (req, res) => {
    try {
      const { page = 1, pageSize = 10 } = req.query;
      const limit = parseInt(pageSize);
      const skip = (page - 1) * limit;

      const totalItems = await BankRequest.countDocuments().exec();

      const resultArray = await BankRequest.find().skip(skip).limit(limit).exec();

      const totalPages = Math.ceil(totalItems / limit);

      return apiResponsePagination(
        resultArray,
        true,
        statusCode.success,
        'Bank requests retrieved successfully',
        {
          page: parseInt(page),
          limit,
          totalPages,
          totalItems,
        },
        res,
      );
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  rejectBank: async (req, res) => {
    try {
      const id = req.params.id;
      const result = await BankRequest.deleteOne({ _id: id });
      if (result.deletedCount === 1) {
        return apiResponseSuccess(null, true, statusCode.success, 'Data deleted successfully', res);
      } else {
        return apiResponseErr(null, false, statusCode.badRequest, 'Bank not found', res);
      }
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  editBank: async (req, res) => {
    try {
      const id = await Bank.findById(req.params.id);
      const updateResult = await AccountServices.updateBank(id, req.body);
      console.log(updateResult);
      if (updateResult) {
        return apiResponseSuccess(
          updateResult,
          true,
          statusCode.success,
          "Bank Detail's edit request sent to Super Admin for Approval",
          res,
        );
      }
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  getBankNames: async (req, res) => {
    try {
      const { page = 1, pageSize = 10, search = '' } = req.query;
      const skip = (page - 1) * pageSize;
      const limit = parseInt(pageSize);

      const searchQuery = search ? { bankName: { $regex: search, $options: 'i' } } : {};

      let dbBankData = await Bank.find(searchQuery).skip(skip).limit(limit).exec();

      let bankData = JSON.parse(JSON.stringify(dbBankData));

      const totalItems = await Bank.countDocuments(searchQuery);
      const totalPages = Math.ceil(totalItems / limit);

      const userRole = req.user.roles;
      if (userRole.includes(string.superAdmin)) {
        for (let index = 0; index < bankData.length; index++) {
          bankData[index].balance = await BankServices.getBankBalance(bankData[index]._id);
        }
      } else {
        const userSubAdminId = req.user.userName;

        bankData = await Promise.all(
          bankData.map(async (bank) => {
            const userSubAdmin = bank.subAdmins.find((subAdmin) => subAdmin.subAdminId === userSubAdminId);

            if (userSubAdmin) {
              bank.balance = await BankServices.getBankBalance(bank._id);
              bank.isDeposit = userSubAdmin.isDeposit;
              bank.isWithdraw = userSubAdmin.isWithdraw;
              bank.isRenew = userSubAdmin.isRenew;
              bank.isEdit = userSubAdmin.isEdit;
              bank.isDelete = userSubAdmin.isDelete;
              return bank;
            } else {
              return null;
            }
          }),
        );

        bankData = bankData.filter((bank) => bank !== null);
      }

      bankData.sort((a, b) => b.createdAt - a.createdAt);

      return apiResponsePagination(
        bankData,
        true,
        statusCode.success,
        'success',
        {
          page: parseInt(page),
          limit,
          totalPages,
          totalItems,
        },
        res,
      );
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  getBankBalance: async (bankId) => {
    try {
      const bankTransactions = await BankTransaction.find({
        bankId: bankId,
      }).exec();
      const transactions = await Transaction.find({ bankId: bankId }).exec();
      const editTransaction = await EditRequest.find({ bankId: bankId }).exec();
      let balance = 0;
      bankTransactions.forEach((transaction) => {
        if (transaction.depositAmount) {
          balance += transaction.depositAmount;
        }
        if (transaction.withdrawAmount) {
          balance -= transaction.withdrawAmount;
        }
      });
      transactions.forEach((transaction) => {
        if (transaction.transactionType === 'Deposit') {
          balance += transaction.amount;
        } else {
          const totalBalance = balance - transaction.bankCharges - transaction.amount;
          balance = totalBalance;
        }
      });
      editTransaction.forEach((data) => {
        if (data.transactionType === 'Manual-Bank-Deposit') {
          balance += data.depositAmount;
        }
        if (data.transactionType === 'Manual-Bank-Withdraw') {
          balance -= data.withdrawAmount;
        }
        if (data.transactionType === 'Deposit') {
          balance += data.amount;
        }
        if (data.transactionType === 'Withdraw') {
          const netAmount = balance - data.bankCharges - data.amount;
          balance = netAmount;
        }
      });

      return balance;
    } catch (error) {
      console.error('Error in getBankBalance:', error);
      throw error;
    }
  },

  activeBankName: async (req, res) => {
    try {
      console.log('req', req.user);
      const { page = 1, pageSize = 10 } = req.query;
      const limit = parseInt(pageSize);
      const skip = (page - 1) * limit;

      const totalItems = await Bank.countDocuments({ isActive: true });

      let dbBankData = await Bank.find({ isActive: true }).select('bankName isActive').skip(skip).limit(limit).exec();

      const totalPages = Math.ceil(totalItems / limit);

      return apiResponsePagination(
        dbBankData,
        true,
        statusCode.success,
        'success',
        {
          page: parseInt(page),
          limit,
          totalPages,
          totalItems,
        },
        res,
      );
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  getSingleBankDetails: async (req, res) => {
    try {
      const id = req.params.id;
      const dbBankData = await Bank.findOne({ _id: id }).exec();
      if (!dbBankData) {
        return apiResponseErr(null, false, statusCode.badRequest, 'Bank not found', res);
      }
      const bankId = dbBankData._id;
      const bankBalance = await BankServices.getBankBalance(bankId);
      const subAdminIds = dbBankData.subAdmins.map((subAdmin) => subAdmin.subAdminId);
      const response = {
        _id: dbBankData._id,
        bankName: dbBankData.bankName,
        subAdminId: subAdminIds,
        subAdminName: dbBankData.subAdminName,
        balance: bankBalance,
      };
      return apiResponseSuccess(response, true, statusCode.success, "Bank Detail's retrive successfully", res);
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  addBankBalance: async (req, res) => {
    try {
      const id = req.params.id;
      const userName = req.user;
      const { amount, transactionType, remarks } = req.body;

      if (!amount || typeof amount !== 'number') {
        return res.status(400).send({ message: 'Invalid amount' });
      }

      const bank = await Bank.findOne({ _id: id }).exec();
      if (!bank) {
        return apiResponseErr(null, false, statusCode.badRequest, 'Bank account not found', res);
      }
      const bankTransaction = new BankTransaction({
        bankId: bank._id,
        accountHolderName: bank.accountHolderName,
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        ifscCode: bank.ifscCode,
        transactionType: transactionType,
        upiId: bank.upiId,
        upiAppName: bank.upiAppName,
        upiNumber: bank.upiNumber,
        depositAmount: amount,
        subAdminId: userName.userName,
        subAdminName: userName.firstname,
        remarks: remarks,
        createdAt: new Date(),
      });
      await bankTransaction.save();
      return apiResponseSuccess(
        bankTransaction,
        true,
        statusCode.success,
        'Wallet Balance Added to Your Bank Account',
        res,
      );
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  withdrawalBankBalance: async (req, res) => {
    try {
      const id = req.params.id;
      const userName = req.user;
      const { amount, transactionType, remarks } = req.body;
      if (!amount || typeof amount !== 'number') {
        return apiResponseErr(null, false, statusCode.badRequest, 'Invalid amount', res);
      }

      const bank = await Bank.findOne({ _id: id }).exec();
      if (!bank) {
        return apiResponseErr(null, false, statusCode.badRequest, 'Bank account not found', res);
      }
      if ((await BankServices.getBankBalance(id)) < Number(amount)) {
        return apiResponseErr(null, false, statusCode.badRequest, 'Insufficient Balance', res);
      }

      const bankTransaction = new BankTransaction({
        bankId: bank._id,
        accountHolderName: bank.accountHolderName,
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        ifscCode: bank.ifscCode,
        transactionType: transactionType,
        upiId: bank.upiId,
        upiAppName: bank.upiAppName,
        upiNumber: bank.upiNumber,
        withdrawAmount: amount,
        subAdminId: userName.userName,
        subAdminName: userName.firstname,
        remarks: remarks,
        createdAt: new Date(),
      });
      await bankTransaction.save();
      return apiResponseSuccess(
        bankTransaction,
        true,
        statusCode.success,
        'Wallet Balance Deducted from your Bank Account',
        res,
      );
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  bankName: async (req, res) => {
    try {
      const bankName = await Bank.find({}, 'bankName').exec();
      if (bankName.length === 0) {
        return apiResponseSuccess([], true, statusCode.success, 'No data found', res);
      }
      return apiResponseSuccess(bankName, true, statusCode.success, 'Success', res);
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  bankAccountSummary: async (req, res) => {
    try {
      const accountNumber = req.params.bankName;
      const bankSummary = await BankTransaction.find({ accountNumber }).sort({ createdAt: 1 }).exec();
      console.log(bankSummary);
      return apiResponseSuccess(bankSummary, true, statusCode.success, 'Success', res);
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  mannualBankAccountSummary: async (req, res) => {
    try {
      let balances = 0;
      const bankId = req.params.bankId;
      const bankSummary = await BankTransaction.find({ bankId }).sort({ createdAt: -1 }).exec();
      console.log('id', bankSummary);
      const accountSummary = await Transaction.find({ bankId }).sort({ createdAt: -1 }).exec();

      const allTransactions = [...accountSummary, ...bankSummary];
      allTransactions.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
      let allData = JSON.parse(JSON.stringify(allTransactions));
      allData
        .slice(0)
        .reverse()
        .map((data) => {
          if (data.transactionType === 'Manual-Bank-Deposit') {
            balances += data.depositAmount;
            data.balance = balances;
            console.log('balances', balances);
          }
          if (data.transactionType === 'Manual-Bank-Withdraw') {
            balances -= data.withdrawAmount;
            data.balance = balances;
            console.log('balances2', balances);
          }
          if (data.transactionType === 'Deposit') {
            let totalamount = 0;
            totalamount += data.amount;
            balances += totalamount;
            data.balance = balances;
            console.log('balances3', balances);
          }
          if (data.transactionType === 'Withdraw') {
            const netAmount = balances - data.bankCharges - data.amount;
            console.log('netAmount', netAmount);
            balances = netAmount;
            data.balance = balances;
            console.log('balances4', balances);
          }
        });
      return apiResponseSuccess(allData, true, statusCode.success, 'Success', res);
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  viewBankEditRequest: async (req, res) => {
    try {
      const { page = 1, pageSize = 10 } = req.query;

      const skip = (page - 1) * pageSize;

      const resultArray = await EditBankRequest.find().skip(skip).limit(parseInt(pageSize)).exec();

      const totalItems = await EditBankRequest.countDocuments().exec();

      const pagination = {
        page: parseInt(page),
        limit: parseInt(pageSize),
        totalPages: Math.ceil(totalItems / pageSize),
        totalItems,
      };

      return apiResponsePagination(resultArray, true, statusCode.success, 'Success', pagination, res);
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },
};
