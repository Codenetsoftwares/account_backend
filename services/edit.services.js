import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { apiResponseErr, apiResponsePagination, apiResponseSuccess } from '../utils/response.js';
import { statusCode } from '../utils/statusCodes.js';
import { BankTransaction } from '../models/BankTransaction.model.js';
import AccountServices from './Accounts.services.js';
import { EditRequest } from '../models/EditRequest.model.js';
import { Trash } from '../models/Trash.model.js';
import { WebsiteTransaction } from '../models/WebsiteTransaction.model.js';
import { User } from '../models/user.model.js';
import { Transaction } from '../models/transaction.js';
import { IntroducerEditRequest } from '../models/IntroducerEditRequest.model.js';
import { IntroducerTransaction } from '../models/IntroducerTransaction.model.js';
import { EditBankRequest } from '../models/EditBankRequest.model.js';
import { Bank } from '../models/bank.model.js';
import { EditWebsiteRequest } from '../models/EditWebsiteRequest.model.js';
import { Website } from '../models/website.model.js';
dotenv.config();

    export const editService = {

        deleteBankTransaction : async (req, res) => {
            try {
              const id = req.params.id;
              const editRequest = await EditRequest.findById(id).exec();
          
              if (!editRequest) {
                return apiResponseErr(null, true, statusCode.notFound, 'Bank Request not found', res);
              }
          
              const isApproved = true; 
          
              if (isApproved) {
                await BankTransaction.deleteOne({ _id: editRequest.id }).exec();
          
                const dataToRestore = {
                  bankId: editRequest.bankId,
                  transactionType: editRequest.transactionType,
                  remarks: editRequest.remarks,
                  withdrawAmount: editRequest.withdrawAmount,
                  depositAmount: editRequest.depositAmount,
                  subAdminId: editRequest.subAdminId,
                  subAdminName: editRequest.subAdminName,
                  accountHolderName: editRequest.accountHolderName,
                  bankName: editRequest.bankName,
                  accountNumber: editRequest.accountNumber,
                  ifscCode: editRequest.ifscCode,
                  createdAt: editRequest.createdAt,
                  upiId: editRequest.upiId,
                  upiAppName: editRequest.upiAppName,
                  upiNumber: editRequest.upiNumber,
                  isSubmit: editRequest.isSubmit,
                };
          
                const restoredData = await Trash.create(dataToRestore);
                await EditRequest.deleteOne({ _id: req.params.id }).exec();
                return apiResponseSuccess(restoredData, true, statusCode.success, 'Bank Transaction Moved To Trash', res);
              } else {
                return apiResponseErr(null, true, statusCode.badRequest, 'Approval request rejected by super admin', res);
              }
            } catch (error) {
                return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
            }
          },

        deleteWebsiteTransaction:async (req, res) => {
            try {
              const id = req.params.id;
              const editRequest = await EditRequest.findById(id).exec();
              if (!editRequest) {
                return apiResponseErr(null, true, statusCode.notFound, 'Edit Website Request not found', res);
              }
              const isApproved = true;
              if (isApproved) {
                await WebsiteTransaction.deleteOne({ _id: editRequest.id }).exec();
                const dataToRestore = {
                  websiteId: editRequest.websiteId,
                  transactionType: editRequest.transactionType,
                  remarks: editRequest.remarks,
                  withdrawAmount: editRequest.withdrawAmount,
                  depositAmount: editRequest.depositAmount,
                  subAdminId: editRequest.subAdminId,
                  subAdminName: editRequest.subAdminName,
                  websiteName: editRequest.websiteName,
                  createdAt: editRequest.createdAt,
                };
                const restoredData = await Trash.create(dataToRestore);
                await EditRequest.deleteOne({ _id: req.params.id }).exec();
                return apiResponseSuccess(restoredData, true, statusCode.success, 'Website Transaction Moved To Trash', res);
              } else {
                return apiResponseErr(null, true, statusCode.badRequest, 'Approval request rejected by super admin', res);
              }
            } catch (error) {
                return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
            }
          },

        deleteTransaction : async (req, res) => {
          try {
            const id = req.params.id;
            const editRequest = await EditRequest.findById(id).exec();
            if (!editRequest) {
              return apiResponseErr(null, true, statusCode.notFound, 'Edit Website Request not found', res);
            }
            const isApproved = true;
            if (isApproved) {
              await Transaction.deleteOne({ _id: editRequest.id }).exec();
              const dataToRestore = {
                bankId: editRequest.bankId,
                websiteId: editRequest.websiteId,
                transactionID: editRequest.transactionID,
                transactionType: editRequest.transactionType,
                remarks: editRequest.remarks,
                amount: editRequest.amount,
                subAdminId: editRequest.subAdminId,
                subAdminName: editRequest.subAdminName,
                introducerUserName: editRequest.introducerUserName,
                userId: editRequest.userId,
                userName: editRequest.userName,
                paymentMethod: editRequest.paymentMethod,
                websiteName: editRequest.websiteName,
                bankName: editRequest.bankName,
                amount: editRequest.amount,
                bonus: editRequest.bonus,
                bankCharges: editRequest.bankCharges,
                createdAt: editRequest.createdAt,
              };
              const restoredData = await Trash.create(dataToRestore);
              await EditRequest.deleteOne({ _id: req.params.id }).exec();
              await User.updateOne(
                { 'transactionDetail._id': editRequest.id },
                { $pull: { transactionDetail: { _id: editRequest.id } } },
              ).exec();
              return apiResponseSuccess(restoredData, true, statusCode.success, 'Transaction moved to Trash', res);
            } else {
              return apiResponseErr(null, true, statusCode.badRequest, 'Approval request rejected by super admin', res);
            }
          } catch (error) {
            return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
          }
        },

        processTransactionDeletion :async (req, res) => {
          try {
            const id = req.params.id;
            const editRequest = await IntroducerEditRequest.findById(id).exec();
            if (!editRequest) {
              return apiResponseErr(null, true, statusCode.notFound, 'Edit Request not found', res);
            }
            const isApproved = true;
            if (isApproved) {
              await IntroducerTransaction.deleteOne({ _id: editRequest.id }).exec();
              const dataToRestore = {
                introUserId: editRequest.introUserId,
                amount: editRequest.amount,
                transactionType: editRequest.transactionType,
                remarks: editRequest.remarks,
                subAdminId: editRequest.subAdminId,
                subAdminName: editRequest.subAdminName,
                introducerUserName: editRequest.introducerUserName,
                createdAt: editRequest.createdAt,
              };
              const restoredData = await Trash.create(dataToRestore);
              await IntroducerEditRequest.deleteOne({ _id: req.params.id }).exec();
              return apiResponseSuccess(restoredData, true, statusCode.success, 'Transaction moved to Trash', res);
            } else {
              return apiResponseErr(null, true, statusCode.badRequest, 'Approval request rejected by super admin', res);
            }
          } catch (error) {
            return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
          }
        },
        
        rejectEditRequest:async (req, res) => {   
          try {
            const id = req.params.id;
            const result = await EditRequest.deleteOne({ _id: id });
            if (result.deletedCount === 1) {
              return apiResponseSuccess(result, true, statusCode.success, 'Data deleted successfully', res);
              
            } else {
              return apiResponseErr(null, true, statusCode.notFound, 'Data not found', res);
            }
          } catch (error) {
            return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
          }
        }, 
      
      processBankDetailEditRequest : async (req, res) => {
        try {
          const editRequest = await EditBankRequest.findById(req.params.requestId);
          if (!editRequest) {
            return apiResponseErr(null, true, statusCode.notFound, 'Edit request not found', res);
          }
          const { isApproved } = req.body;
          if (typeof isApproved !== 'boolean') {
            return apiResponseErr(null, true, statusCode.badRequest, 'isApproved field must be a boolean value', res);
          }
          if (!editRequest.isApproved) {
            const updatedTransaction = await Bank.updateOne(
              { _id: editRequest.id },
              {
                accountHolderName: editRequest.accountHolderName,
                bankName: editRequest.bankName,
                accountNumber: editRequest.accountNumber,
                ifscCode: editRequest.ifscCode,
                upiId: editRequest.upiId,
                upiAppName: editRequest.upiAppName,
                upiNumber: editRequest.upiNumber,
              },
            );
            if (updatedTransaction.matchedCount === 0) {
              return apiResponseErr(null, true, statusCode.badRequest, 'Bank Details not found', res);
            }
            editRequest.isApproved = true;
            if (editRequest.isApproved === true) {
              const deletedEditRequest = await EditBankRequest.deleteOne({ _id: req.params.requestId });
              if (!deletedEditRequest) {
                return apiResponseErr(null, true, statusCode.badRequest, 'Error deleting edit request', res);
              }
            }
            return apiResponseSuccess(updatedTransaction, true, statusCode.success, 'Edit request approved and data updated', res);
            
          } else {
            return apiResponseSuccess(updatedTransaction, true, statusCode.success, 'Edit request rejected', res);
          }
        } catch (error) {
          return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
        }
      }, 


    processWebsiteDetailEditRequest :async (req, res) => {
      try {
        const editRequest = await EditWebsiteRequest.findById(req.params.requestId);
        if (!editRequest) {
          return apiResponseErr(null, true, statusCode.notFound, 'Edit request not found', res);
        }
        const { isApproved } = req.body;
        if (typeof isApproved !== 'boolean') {
          return apiResponseErr(null, true, statusCode.badRequest, 'isApproved field must be a boolean value', res);
        }
        if (!editRequest.isApproved) {
          const updatedTransaction = await Website.updateOne(
            { _id: editRequest.id },
            {
              websiteName: editRequest.websiteName,
            },
          );
          console.log('updatedTransaction', updatedTransaction);
          if (updatedTransaction.matchedCount === 0) {
            return apiResponseErr(null, true, statusCode.badRequest, 'Website Name not found', res);
          }
          editRequest.isApproved = true;
          if (editRequest.isApproved === true) {
            const deletedEditRequest = await EditWebsiteRequest.deleteOne({ _id: req.params.requestId });
            console.log(deletedEditRequest);
            if (!deletedEditRequest) {
              return apiResponseErr(null, true, statusCode.badRequest, 'Error deleting edit request', res);
            }
          }
          return apiResponseSuccess(updatedTransaction, true, statusCode.success, 'Edit request approved and data updated', res);
         
        } else {
          return apiResponseSuccess(updatedTransaction, true, statusCode.success, 'Edit request rejected', res);
        }
      } catch (error) {
        return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
      }
    },
}