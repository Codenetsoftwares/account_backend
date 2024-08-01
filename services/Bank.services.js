import { parse } from 'dotenv';
import { Bank } from '../models/bank.model.js';
import { BankRequest } from '../models/BankRequest.model.js';
import CustomError from '../utils/extendError.js';
import { apiResponseErr, apiResponsePagination, apiResponseSuccess } from '../utils/response.js';
import { statusCode } from '../utils/statusCodes.js';

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
        statusCode.success,
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
};
