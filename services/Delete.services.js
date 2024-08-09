import { BankTransaction } from '../models/BankTransaction.model.js';
import { Transaction } from '../models/transaction.js';
import { Trash } from '../models/Trash.model.js';
import { User } from '../models/user.model.js';
import { WebsiteTransaction } from '../models/WebsiteTransaction.model.js';
import { apiResponseErr, apiResponsePagination, apiResponseSuccess } from '../utils/response.js';
import { statusCode } from '../utils/statusCodes.js';

export const DeleteService = {
  trashView: async (req, res) => {
    try {
      const { page = 1, pageSize = 10 } = req.query;
      const skip = (page - 1) * pageSize;
      const limit = parseInt(pageSize);

      const trashData = await Trash.find().skip(skip).limit(limit).exec();

      const totalItems = await Trash.countDocuments().exec();
      const totalPages = Math.ceil(totalItems / limit);

      return apiResponsePagination(
        trashData,
        true,
        statusCode.success,
        'Trash data fetched successfully',
        {
          page: parseInt(page),
          limit,
          totalPages,
          totalItems,
        },
        res,
      );
    } catch (error) {
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

 deleteTransaction:async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Trash.deleteOne({ _id: id });
    if (result.deletedCount === 1) {
      return apiResponseSuccess(result, true, statusCode.success, 'Data deleted successfully', res);
    } else {
      return apiResponseErr(null, true, statusCode.badRequest, 'Data not found', res);
    }
  } catch (error) {
    return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
  }
},

restoreBankData:async (req, res) => {
  try {
    const bankId = req.params.bankId;
    const deletedData = await Trash.findOne({ bankId }).exec();
    if (!deletedData) {
      return apiResponseErr(null, true, statusCode.notFound, 'Data not found in Trash', res);
    }
    const dataToRestore = {
      bankId: deletedData.bankId,
      transactionType: deletedData.transactionType,
      remarks: deletedData.remarks,
      withdrawAmount: deletedData.withdrawAmount,
      depositAmount: deletedData.depositAmount,
      subAdminId: deletedData.subAdminId,
      subAdminName: deletedData.subAdminName,
      accountHolderName: deletedData.accountHolderName,
      bankName: deletedData.bankName,
      accountNumber: deletedData.accountNumber,
      ifscCode: deletedData.ifscCode,
      createdAt: deletedData.createdAt,
      upiId: deletedData.upiId,
      upiAppName: deletedData.upiAppName,
      upiNumber: deletedData.upiNumber,
      isSubmit: deletedData.isSubmit,
    };
    const restoredData = await BankTransaction.create(dataToRestore);
    await Trash.findByIdAndDelete(deletedData._id);
    return apiResponseSuccess(restoredData, true, statusCode.success, 'Data restored successfully', res);
  } catch (error) {
    return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
  }
},

restoreWebsiteData : async (req, res) => {
  try {
    const websiteId = req.params.websiteId;
    const deletedData = await Trash.findOne({ websiteId }).exec();
    if (!deletedData) {
      return apiResponseErr(null, true, statusCode.notFound, 'Data not found in Trash', res);
    }
    const dataToRestore = {
      websiteId: deletedData.websiteId,
      transactionType: deletedData.transactionType,
      remarks: deletedData.remarks,
      withdrawAmount: deletedData.withdrawAmount,
      depositAmount: deletedData.depositAmount,
      subAdminId: deletedData.subAdminId,
      subAdminName: deletedData.subAdminName,
      websiteName: deletedData.websiteName,
      createdAt: deletedData.createdAt,
    };
    const restoredData = await WebsiteTransaction.create(dataToRestore);
    await Trash.findByIdAndDelete(deletedData._id);
    return apiResponseSuccess(restoredData, true, statusCode.success, 'Data restored successfully', res);
  } catch (error) {
    return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
  }
},

restoreTransactionData : async (req, res) => {
  try {
    const transactionID = req.params.transactionID;
    const deletedData = await Trash.findOne({ transactionID }).exec();
    if (!deletedData) {
      return apiResponseErr(null, true, statusCode.notFound, 'Data not found in Trash', res);
    }
    const dataToRestore = {
      bankId: deletedData.bankId,
      websiteId: deletedData.websiteId,
      transactionID: deletedData.transactionID,
      transactionType: deletedData.transactionType,
      remarks: deletedData.remarks,
      amount: deletedData.amount,
      subAdminId: deletedData.subAdminId,
      subAdminName: deletedData.subAdminName,
      introducerUserName: deletedData.introducerUserName,
      userId: deletedData.userId,
      userName: deletedData.userName,
      paymentMethod: deletedData.paymentMethod,
      websiteName: deletedData.websiteName,
      bankName: deletedData.bankName,
      amount: deletedData.amount,
      bonus: deletedData.bonus,
      bankCharges: deletedData.bankCharges,
      createdAt: deletedData.createdAt,
    };
    const restoredData = await Transaction.create(dataToRestore);
    const user = await User.findOneAndUpdate(
      { userName: deletedData.userName },
      { $push: { transactionDetail: dataToRestore } },
      { new: true },
    );
    await Trash.findByIdAndDelete(deletedData._id);
    return apiResponseSuccess(restoredData, true, statusCode.success, 'Data restored successfully', res);
  } catch (error) {
    return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
  }
},

restoreIntroducerData : async (req, res) => {
  try {
    const introUserId = req.params.introUserId;
    const deletedData = await Trash.findOne({ introUserId }).exec();
    if (!deletedData) {
      return apiResponseErr(null, true, statusCode.notFound, 'Data not found in Trash', res);
    }
    const dataToRestore = {
      introUserId: deletedData.introUserId,
      amount: deletedData.amount,
      transactionType: deletedData.transactionType,
      remarks: deletedData.remarks,
      subAdminId: deletedData.subAdminId,
      subAdminName: deletedData.subAdminName,
      introducerUserName: deletedData.introducerUserName,
      createdAt: deletedData.createdAt,
    };
    const restoredData = await IntroducerTransaction.create(dataToRestore);
    await Trash.findByIdAndDelete(deletedData._id);
    return apiResponseSuccess(restoredData, true, statusCode.success, 'Data restored successfully', res);
  } catch (error) {
    return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
  }
}


};
