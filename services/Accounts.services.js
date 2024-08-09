import { generateTokens } from '../helpers/generateToken.js';
import { Admin } from '../models/admin_user.js';
import { User } from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Bank } from '../models/bank.model.js';
import { Website } from '../models/website.model.js';
import { BankTransaction } from '../models/BankTransaction.model.js';
import { WebsiteTransaction } from '../models/WebsiteTransaction.model.js';
import { EditBankRequest } from '../models/EditBankRequest.model.js';
import { EditWebsiteRequest } from '../models/EditWebsiteRequest.model.js';
import { EditRequest } from '../models/EditRequest.model.js';
import { Transaction } from '../models/transaction.js';
import { IntroducerUser } from '../models/introducer.model.js';
import { IntroducerTransaction } from '../models/IntroducerTransaction.model.js';
import { introducerUser } from '../services/introducer.services.js';
import { IntroducerEditRequest } from '../models/IntroducerEditRequest.model.js';
import { Trash } from '../models/Trash.model.js';
import { apiResponseErr, apiResponsePagination, apiResponseSuccess } from '../utils/response.js';
import { statusCode } from '../utils/statusCodes.js';
import { string } from '../constructor/string.js';
import CustomError from '../utils/extendError.js';
import customErrorHandler from '../utils/customErrorHandler.js';

const AccountServices = {
  adminLogin: async (req, res) => {
    try {
      const { userName, password, persist } = req.body;

      const user = await Admin.findOne({ userName: userName });
      console.log('user', user);
      if (!user) {
        throw new CustomError('User not found', null, 404);
      }

      const accessToken = await AccountServices.generateAdminAccessToken(userName, password, persist);

      if (!accessToken) {
        throw new CustomError('Failed to generate access token', null, responseCode);
      }

      return apiResponseSuccess({ token: accessToken }, true, statusCode.success, 'Login Successfully!', res);
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  createAdmin: async (req, res) => {
    try {
      const { firstname, lastname, userName, password, roles } = req.body;

      const [existingUser, existingOtherUser, existingIntroUser] = await Promise.all([
        Admin.findOne({ userName }).exec(),
        User.findOne({ userName }),
        IntroducerUser.findOne({ userName }),
      ]);

      if (existingUser || existingOtherUser || existingIntroUser) {
        throw new CustomError(`User already exists: ${userName}`, null, 409);
      }

      const passwordSalt = await bcrypt.genSalt();
      const encryptedPassword = await bcrypt.hash(password, passwordSalt);

      const newAdmin = new Admin({
        firstname: firstname,
        lastname: lastname,
        userName: userName,
        password: encryptedPassword,
        roles: roles,
      });

      const user = await newAdmin.save();
      return apiResponseSuccess(user, true, statusCode.success, 'Admin created successfully', res);
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  SubAdminPasswordResetCode: async (userName, password) => {
    const existingUser = await AccountServices.findAdmin({
      userName: userName,
    });

    const passwordIsDuplicate = await bcrypt.compare(password, existingUser.password);

    if (passwordIsDuplicate) {
      throw {
        code: 409,
        message: 'New Password cannot be the same as existing password',
      };
    }

    const passwordSalt = await bcrypt.genSalt();
    const encryptedPassword = await bcrypt.hash(password, passwordSalt);

    existingUser.password = encryptedPassword;
    existingUser.save().catch((err) => {
      console.error(err);
      throw { code: 500, message: 'Failed to save new password' };
    });

    return true;
  },

  SuperAdminPasswordResetCode: async (req, res) => {
    try {
      const { userName, oldPassword, password } = req.body;
      const existingUser = await AccountServices.findAdmin({ userName });

      if (!existingUser) {
        return apiResponseErr(null, false, statusCode.badRequest, 'User not found', res);
      }

      const oldPasswordIsCorrect = await bcrypt.compare(oldPassword, existingUser.password);

      if (!oldPasswordIsCorrect) {
        return apiResponseErr(null, false, statusCode.unauthorize, 'Invalid old password', res);
      }

      const passwordIsDuplicate = await bcrypt.compare(password, existingUser.password);

      if (passwordIsDuplicate) {
        return apiResponseErr(
          null,
          false,
          statusCode.exist,
          'New password cannot be the same as existing password',
          res,
        );
      }

      const passwordSalt = await bcrypt.genSalt();
      const encryptedPassword = await bcrypt.hash(password, passwordSalt);

      existingUser.password = encryptedPassword;

      const user = await existingUser.save();

      return apiResponseSuccess(user, true, statusCode.success, 'Password reset successfully', res);
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  generateAdminAccessToken: async (userName, password, persist) => {
    const existingUser = await AccountServices.findAdmin({
      userName: userName,
    });
    console.log(existingUser);
    if (!existingUser) {
      throw new CustomError('Invalid User Name ', null, 401);
    }

    const passwordValid = await bcrypt.compare(password, existingUser.password);
    if (!passwordValid) {
      throw new CustomError('Invalid User Password', null, 401);
    }

    const accessTokenResponse = {
      id: existingUser._id,
      firstname: existingUser.firstname,
      lastname: existingUser.lastname,
      userName: existingUser.userName,
      role: existingUser.roles,
    };

    const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
      expiresIn: persist ? '1y' : '8h',
    });

    return {
      userName: existingUser.userName,
      accessToken: accessToken,
      role: existingUser.roles,
    };
  },

  findAdminById: async (id) => {
    if (!id) {
      throw { code: 409, message: 'Required parameter: id' };
    }

    return Admin.findById(id).exec();
  },

  findUserById: async (id) => {
    if (!id) {
      throw { code: 409, message: 'Required parameter: id' };
    }

    return User.findById(id).exec();
  },

  findAdmin: async (filter) => {
    if (!filter) {
      throw { code: 409, message: 'Required parameter: filter' };
    }
    return Admin.findOne(filter).exec();
  },

  findUser: async (filter) => {
    if (!filter) {
      throw { code: 409, message: 'Required parameter: filter' };
    }
    return User.findOne(filter).exec();
  },

  updateBank: async (id, data) => {
    const existingTransaction = await Bank.findById(id);
    if (!existingTransaction) {
      return apiResponseErr(null, false, statusCode.badRequest, `Bank not found with id: ${id}`, res);
    }

    let changedFields = {};

    // Compare each field in the data object with the existingTransaction
    if (data.accountHolderName !== existingTransaction.accountHolderName) {
      changedFields.accountHolderName = data.accountHolderName;
    }
    if (data.bankName !== existingTransaction.bankName) {
      changedFields.bankName = data.bankName;
    }
    if (data.accountNumber !== existingTransaction.accountNumber) {
      changedFields.accountNumber = data.accountNumber;
    }
    if (data.ifscCode !== existingTransaction.ifscCode) {
      changedFields.ifscCode = data.ifscCode;
    }
    if (data.upiId !== existingTransaction.upiId) {
      changedFields.upiId = data.upiId;
    }
    if (data.upiAppName !== existingTransaction.upiAppName) {
      changedFields.upiAppName = data.upiAppName;
    }
    if (data.upiNumber !== existingTransaction.upiNumber) {
      changedFields.upiNumber = data.upiNumber;
    }

    const duplicateBank = await Bank.findOne({ bankName: data.bankName });
    if (duplicateBank && duplicateBank._id.toString() !== id) {
      return apiResponseErr(null, false, statusCode.exist, 'Bank name already exists!', res);
    }
    // Create updatedTransactionData using a ternary operator
    const updatedTransactionData = {
      id: id._id,
      accountHolderName: data.accountHolderName || existingTransaction.accountHolderName,
      bankName: data.bankName || existingTransaction.bankName,
      accountNumber: data.accountNumber || existingTransaction.accountNumber,
      ifscCode: data.ifscCode || existingTransaction.ifscCode,
      upiId: data.upiId || existingTransaction.upiId,
      upiAppName: data.upiAppName || existingTransaction.upiAppName,
      upiNumber: data.upiNumber || existingTransaction.upiNumber,
    };
    const editRequest = new EditBankRequest({
      ...updatedTransactionData,
      changedFields,
      isApproved: false,
      type: 'Edit',
      message: "Bank Detail's has been edited",
    });

    const updatedBank = await editRequest.save();
    return updatedBank;
  },

  getIntroBalance: async (introUserId) => {
    const intorTranasction = await IntroducerTransaction.find({
      introUserId: introUserId,
    }).exec();
    let balance = 0;
    intorTranasction.forEach((transaction) => {
      if (transaction.transactionType === 'Deposit') {
        balance += transaction.amount;
      } else {
        balance -= transaction.amount;
      }
    });
    const liveBalance = await introducerUser.introducerLiveBalance(introUserId);
    const currentDue = liveBalance - balance;
    // console.log("currentDue", currentDue)
    return {
      balance: balance,
      currentDue: currentDue,
    };
  },

  IntroducerBalance: async (introUserId) => {
    const intorTranasction = await IntroducerTransaction.find({
      introUserId: introUserId,
    }).exec();
    let balance = 0;
    intorTranasction.forEach((transaction) => {
      if (transaction.transactionType === 'Deposit') {
        balance += transaction.amount;
      } else {
        balance -= transaction.amount;
      }
    });
    return balance;
  },

  getWebsiteNames: async (req, res) => {
    try {
      const { page = 1, pageSize = 10, search = '' } = req.query;
      const skip = (page - 1) * pageSize;
      const limit = parseInt(pageSize);

      // Build search query
      const searchQuery = search ? { websiteName: { $regex: search, $options: 'i' } } : {};

      // Fetch websites based on the search query and apply pagination
      let dbBankData = await Website.find(searchQuery).skip(skip).limit(limit).exec();
      let websiteData = JSON.parse(JSON.stringify(dbBankData));

      const userRole = req.user.roles;

      if (userRole.includes(string.superAdmin)) {
        for (let index = 0; index < websiteData.length; index++) {
          websiteData[index].balance = await AccountServices.getWebsiteBalance(websiteData[index]._id);
        }
      } else {
        const userSubAdminId = req.user.userName;

        websiteData = await Promise.all(
          websiteData.map(async (website) => {
            const userSubAdmin = website.subAdmins.find((subAdmin) => subAdmin.subAdminId === userSubAdminId);

            if (userSubAdmin) {
              website.balance = await AccountServices.getWebsiteBalance(website._id);
              website.isDeposit = userSubAdmin.isDeposit;
              website.isWithdraw = userSubAdmin.isWithdraw;
              website.isRenew = userSubAdmin.isRenew;
              website.isEdit = userSubAdmin.isEdit;
              website.isDelete = userSubAdmin.isDelete;
              return website;
            }
            return null;
          }),
        );

        // Filter out null values (websites not authorized for the subAdmin)
        websiteData = websiteData.filter((website) => website !== null);
      }

      // Sort the websiteData array by createdAt in descending order
      websiteData.sort((a, b) => b.createdAt - a.createdAt);

      // Count total documents with the same search query for pagination
      const totalItems = await Website.countDocuments(searchQuery);
      const totalPages = Math.ceil(totalItems / limit);

      return apiResponsePagination(
        websiteData,
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
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  getWebsiteBalance: async (websiteId) => {
    const websiteTransactions = await WebsiteTransaction.find({
      websiteId,
    }).exec();
    const transactions = await Transaction.find({ websiteId }).exec();

    let balance = 0;

    websiteTransactions.forEach((transaction) => {
      balance += transaction.depositAmount || 0;
      balance -= transaction.withdrawAmount || 0;
    });

    transactions.forEach((transaction) => {
      if (transaction.transactionType === 'Deposit') {
        balance -= Number(transaction.bonus) + Number(transaction.amount);
      } else {
        balance += Number(transaction.amount);
      }
    });

    return balance;
  },

  // getEditedBankBalance: async (bankId) => {
  //   const bankTransactions = await BankTransaction.find({
  //     bankId: bankId,
  //   }).exec();
  //   const transactions = await Transaction.find({ bankId: bankId }).exec();
  //   let balance = 0;

  //   bankTransactions.forEach((transaction) => {
  //     if (transaction.depositAmount) {
  //       balance += transaction.depositAmount;
  //     }
  //     if (transaction.withdrawAmount) {
  //       balance -= transaction.withdrawAmount;
  //     }
  //   });

  //   transactions.forEach((transaction) => {
  //     if (transaction.transactionType === "Deposit") {
  //       balance += transaction.amount;
  //     } else {
  //       const totalBalance =
  //         balance - transaction.bankCharges - transaction.amount;
  //       if (totalBalance < 0) {
  //         throw { code: 400, message: "Insufficient Bank balance" };
  //       }
  //       balance = totalBalance;
  //     }
  //   });

  //   return balance;
  // },

  updateWebsite: async (id, data) => {
    const existingTransaction = await Website.findById(id);
    if (!existingTransaction) {
      throw { code: 404, message: `Website not found with id: ${id}` };
    }
    let changedFields = {};
    if (data.websiteName !== existingTransaction.websiteName) {
      changedFields.websiteName = data.websiteName;
    }
    const duplicateWebsite = await Website.findOne({
      websiteName: data.websiteName,
    });
    if (duplicateWebsite && duplicateWebsite._id.toString() !== id) {
      throw { code: 400, message: 'Website name already exists!' };
    }
    const updatedTransactionData = {
      id: id._id,
      websiteName: data.websiteName || existingTransaction.websiteName,
    };
    const backupTransaction = new EditWebsiteRequest({
      ...updatedTransactionData,
      changedFields,
      message: "Website Detail's has been edited",
      isApproved: false,
    });
    await backupTransaction.save();
    return true;
  },

  updateUserProfile: async (req, res) => {
    try {
      const id = req.params.id;
      const {
        firstname,
        lastname,
        contactNumber,
        bankDetail,
        upiDetail,
        introducerPercentage,
        introducersUserName,
        webSiteDetail,
        introducersUserName1,
        introducerPercentage1,
        introducersUserName2,
        introducerPercentage2,
      } = req.body;

      const existingUser = await User.findById(id);
      if (!existingUser) {
        return apiResponseErr(null, false, statusCode.notFound, `Existing User not found with id: ${id}`, res);
      }

      // Validate introducerPercentage, introducerPercentage1, and introducerPercentage2
      const newIntroducerPercentage =
        introducerPercentage !== undefined ? parseFloat(introducerPercentage) : existingUser.introducerPercentage;
      const newIntroducerPercentage1 =
        introducerPercentage1 !== undefined ? parseFloat(introducerPercentage1) : existingUser.introducerPercentage1;
      const newIntroducerPercentage2 =
        introducerPercentage2 !== undefined ? parseFloat(introducerPercentage2) : existingUser.introducerPercentage2;

      if (isNaN(newIntroducerPercentage) || isNaN(newIntroducerPercentage1) || isNaN(newIntroducerPercentage2)) {
        return apiResponseErr(null, false, statusCode.badRequest, 'Introducer percentages must be valid numbers.', res);
      }

      const totalIntroducerPercentage = newIntroducerPercentage + newIntroducerPercentage1 + newIntroducerPercentage2;

      if (totalIntroducerPercentage < 0 || totalIntroducerPercentage > 100) {
        return apiResponseErr(
          null,
          false,
          statusCode.badRequest,
          'The sum of introducer percentages must be between 0 and 100.',
          res,
        );
      }

      // Create a new object to store the updated user data
      const updatedUserData = {
        firstname: firstname || existingUser.firstname,
        lastname: lastname || existingUser.lastname,
        contactNumber: contactNumber || existingUser.contactNumber,
        bankDetail: bankDetail || existingUser.bankDetail,
        upiDetail: upiDetail || existingUser.upiDetail,
        introducerPercentage: newIntroducerPercentage,
        introducersUserName: introducersUserName || existingUser.introducersUserName,
        webSiteDetail: webSiteDetail || existingUser.webSiteDetail,
        introducersUserName1: introducersUserName1 || existingUser.introducersUserName1,
        introducerPercentage1: newIntroducerPercentage1,
        introducersUserName2: introducersUserName2 || existingUser.introducersUserName2,
        introducerPercentage2: newIntroducerPercentage2,
      };

      // Save the updated user data
      existingUser.set(updatedUserData);
      const updatedUser = await existingUser.save();

      return apiResponseSuccess(updatedUser, true, statusCode.success, 'User profile updated successfully', res);
    } catch (error) {
      console.error(error);
      return apiResponseErr(
        null,
        false,
        statusCode.internalServerError,
        error.message ?? `Failed to update User Profile with id: ${id}`,
        res,
      );
    }
  },

  // updateBankTransaction: async (id, data) => {
  //   const existingTransaction = await BankTransaction.findById(id);
  //   if (!existingTransaction) {
  //     throw {code: 404, message: `Transaction not found with id: ${id}`};
  //   }

  //   const updatedTransactionData = {
  //     id: id._id,
  //     transactionType: data.transactionType,
  //     remark: data.remark,
  //     withdrawAmount: data.withdrawAmount,
  //     depositAmount: data.depositAmount,
  //     subAdminId: data.subAdminId,
  //     subAdminName: data.subAdminName,
  //     beforeBalance : id.currentBalance,
  //     currentBalance: Number(id.beforeBalance) + Number(data.depositAmount),
  //     currentBalance : Number(id.currentBalance) - Number(data.withdrawAmount)
  //   };
  //   const backupTransaction = new EditBankRequest({...updatedTransactionData, isApproved: false});
  //   await backupTransaction.save();

  //   return true;
  // },

  // updateWebsiteTransaction: async (id, data) => {
  //   const existingTransaction = await WebsiteTransaction.findById(id);
  //   if (!existingTransaction) {
  //     throw {
  //       code: 404,
  //       message: `Transaction not found with id: ${id}`,
  //     };
  //   }
  //   const updatedTransactionData = {
  //     id: id._id,
  //     transactionType: data.transactionType,
  //     remark: data.remark,
  //     withdrawAmount: data.withdrawAmount,
  //     depositAmount: data.depositAmount,
  //     subAdminId: data.subAdminId,
  //     subAdminName: data.subAdminName,
  //     beforeBalance : id.currentBalance,
  //     currentBalance: Number(id.beforeBalance) + Number(data.depositAmount),
  //     currentBalance : Number(id.currentBalance) - Number(data.withdrawAmount)
  //   };
  //   const backupTransaction = new EditWebsiteRequest({
  //     ...updatedTransactionData,
  //     isApproved: false,
  //   });
  //   await backupTransaction.save();

  //   return true;
  // },

  deleteBankTransaction: async (req, res) => {
    try {
      const user = req.user;
      const { requestId } = req.body;

      const transaction = await BankTransaction.findById(requestId);
      if (!transaction) {
        return apiResponseErr(
          null,
          true,
          statusCode.notFound,
          'Bank Transaction not found',
          res
        );
      }
  
      const existingEditRequest = await EditRequest.findOne({
        id: transaction._id,
        type: 'Delete',
      });
      if (existingEditRequest) {
        return apiResponseErr(
          null,
          true,
          statusCode.exist,
          'Request Already Sent For Approval',
          res
        );
      }
  
      
      const updatedTransactionData = {
        id: transaction._id,
        bankId: transaction.bankId,
        transactionType: transaction.transactionType,
        remarks: transaction.remarks,
        withdrawAmount: transaction.withdrawAmount,
        depositAmount: transaction.depositAmount,
        subAdminId: transaction.subAdminId,
        subAdminName: transaction.subAdminName,
        accountHolderName: transaction.accountHolderName,
        bankName: transaction.bankName,
        accountNumber: transaction.accountNumber,
        ifscCode: transaction.ifscCode,
        createdAt: transaction.createdAt,
        upiId: transaction.upiId,
        upiAppName: transaction.upiAppName,
        upiNumber: transaction.upiNumber,
        isSubmit: transaction.isSubmit,
      };
  
      const name = user.firstname;
      const editMessage = `${updatedTransactionData.transactionType} is sent to Super Admin for moving to trash approval`;
      const backupTransaction = new EditRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        requesteduserName: name,
        type: 'Delete',
        Nametype: 'Bank',
      });
      await backupTransaction.save();
  
      return apiResponseSuccess(
        updatedTransactionData,
        true,
        statusCode.success,
        'Bank Transaction to trash request sent to Super Admin',
        res
      );
    } catch (error) {
      return apiResponseErr(null,false, statusCode.internalServerError,error.message,res);
    }
  },

  deleteWebsiteTransaction: async (req, res) => {
    try {
      const user = req.user;
      const { requestId } = req.body;

      const transaction = await WebsiteTransaction.findById(requestId);
      if (!transaction) {
        return apiResponseErr(
          null,
          true,
          statusCode.notFound,
          'Website Transaction not found',
          res
        );
      }
  
      const existingEditRequest = await EditRequest.findOne({
        id: transaction._id,
        type: 'Delete',
      });
      if (existingEditRequest) {
        return apiResponseErr(
          null,
          true,
          statusCode.exist,
          'Request Already Sent For Approval',
          res
        );
      }
  
      const updatedTransactionData = {
        id: transaction._id,
        websiteId: transaction.websiteId,
        transactionType: transaction.transactionType,
        remarks: transaction.remarks,
        withdrawAmount: transaction.withdrawAmount,
        depositAmount: transaction.depositAmount,
        subAdminId: transaction.subAdminId,
        subAdminName: transaction.subAdminName,
        websiteName: transaction.websiteName,
        createdAt: transaction.createdAt,
      };
  
      const name = user.firstname;
      const editMessage = `${updatedTransactionData.transactionType} is sent to Super Admin for moving into trash approval`;
      const backupTransaction = new EditRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        requesteduserName: name,
        type: 'Delete',
        Nametype: 'Website',
      });
      await backupTransaction.save();
  
      return apiResponseSuccess(
        updatedTransactionData,
        true,
        statusCode.success,
        'Website Transaction to trash request sent to Super Admin',
        res
      );
  
    } catch (error) {
      return apiResponseErr( null,false, statusCode.internalServerError, error.message, res);
    }
  },

  deleteTransaction: async (req, res) => {
    try {
      const user = req.user;
      const { requestId } = req.body;
  
      const transaction = await Transaction.findById(requestId);
      if (!transaction) {
        return apiResponseErr(
          null,
          true,
          statusCode.notFound,
          'Transaction not found',
          res
        );
      }
      const existingEditRequest = await EditRequest.findOne({
        id: transaction._id,
        type: 'Delete',
      });
      if (existingEditRequest) {
        return apiResponseErr(
          null,
          true,
          statusCode.exist,
          'Request Already Sent For Approval',
          res
        );
      }
  
      const updatedTransactionData = {
        id: transaction._id,
        bankId: transaction.bankId,
        websiteId: transaction.websiteId,
        transactionID: transaction.transactionID,
        transactionType: transaction.transactionType,
        remarks: transaction.remarks,
        amount: transaction.amount,
        subAdminId: transaction.subAdminId,
        subAdminName: transaction.subAdminName,
        introducerUserName: transaction.introducerUserName,
        userId: transaction.userId,
        userName: transaction.userName,
        paymentMethod: transaction.paymentMethod,
        websiteName: transaction.websiteName,
        bankName: transaction.bankName,
        bonus: transaction.bonus,
        bankCharges: transaction.bankCharges,
        createdAt: transaction.createdAt,
      };
  
      const name = user.firstname;
      const editMessage = `${updatedTransactionData.transactionType} is sent to Super Admin for moving into trash approval`;
      const backupTransaction = new EditRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        requesteduserName: name,
        type: 'Delete',
        Nametype: 'Transaction',
      });
      await backupTransaction.save();
      return apiResponseSuccess(
        updatedTransactionData,
        true,
        statusCode.success,
        'Transaction to trash request sent to Super Admin',
        res
      );
    } catch (error) {
      return apiResponseErr( null,false, statusCode.internalServerError, error.message, res);
    }
  },

  deleteIntroducerTransaction: async (req, res) => {
    try {
      const user = req.user;
      const { requestId } = req.body;
      
      const transaction = await IntroducerTransaction.findById(requestId);
      if (!transaction) {
        return apiResponseErr(
          null,
          true,
          statusCode.notFound,
          'Transaction not found',
          res
        );
       
      }

      const existingEditRequest = await IntroducerEditRequest.findOne({
        id: transaction._id,
        type: 'Delete',
      });
      if (existingEditRequest) {
        return apiResponseErr(
          null,
          true,
          statusCode.exist,
          'Request Already Sent For Approval',
          res
        );
      }
      
      const updatedTransactionData = {
        id: transaction._id,
        introUserId: transaction.introUserId,
        amount: transaction.amount,
        transactionType: transaction.transactionType,
        remarks: transaction.remarks,
        subAdminId: transaction.subAdminId,
        subAdminName: transaction.subAdminName,
        introducerUserName: transaction.introducerUserName,
        createdAt: transaction.createdAt,
      };
      
      const name = user.firstname;
      const editMessage = `Introducer ${updatedTransactionData.transactionType} is sent to Super Admin for moving into trash approval`;
      
      const backupTransaction = new IntroducerEditRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        requesteduserName: name,
        type: 'Delete',
        Nametype: 'Introducer',
      });
      
    const result=  await backupTransaction.save();

      return apiResponseSuccess(
        result,
        true,
        statusCode.success,
        'Transaction delete request sent to Super Admin',
        res
      );
    } catch (error) {
      return apiResponseErr( null,false, statusCode.internalServerError, error.message, res);
    }
  },

  updateSubAdminProfile: async (id, data) => {
    const existingUser = await Admin.findById(id);
    if (!existingUser) {
      throw {
        code: 404,
        message: `Existing Introducer User not found with id : ${id}`,
      };
    }
    existingUser.firstname = data.firstname || existingUser.firstname;
    existingUser.lastname = data.lastname || existingUser.lastname;
    await existingUser.save().catch((err) => {
      console.error(err);
      throw {
        code: 500,
        message: `Failed to update Introducer User Profile with id : ${id}`,
      };
    });

    return true;
  },

  deleteBank:  async (req, res) => {
    try {
      const { requestId } = req.body;
      const transaction = await Bank.findById(requestId);
      if (!transaction) {
        return apiResponseErr(null, true, statusCode.badRequest, 'Bank not found', res);
      }
      
      const existingEditRequest = await EditBankRequest.findOne({
        id: transaction._id,
        type: "Delete Bank Detail's",
      });
      if (existingEditRequest) {
        return apiResponseErr(null, true, statusCode.exist, 'Delete Request Already Sent For Approval', res);
      }

      const updatedTransactionData = {
        id: transaction._id,
        accountHolderName: transaction.accountHolderName,
        bankName: transaction.bankName,
        accountNumber: transaction.accountNumber,
        ifscCode: transaction.ifscCode,
        upiId: transaction.upiId,
        upiAppName: transaction.upiAppName,
        upiNumber: transaction.upiNumber,
      };

      const editMessage = `${updatedTransactionData.bankName} is sent to Super Admin for deleting approval`;

      const backupTransaction = new EditBankRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        type: "Delete Bank Detail's",
      });

      await backupTransaction.save();
      return apiResponseSuccess(backupTransaction, true, statusCode.success, 'Bank delete request sent to Super Admin', res);

    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  deleteWebsite: async (req, res) => {
    try {
      const { requestId } = req.body;
      const transaction = await Website.findById(requestId);
      if (!transaction) {
        return apiResponseErr(null, true, statusCode.badRequest, 'Website not found', res);
      }
      const existingEditRequest = await EditWebsiteRequest.findOne({
        id: transaction._id,
        type: "Delete Website Detail's",
      });

      if (existingEditRequest) {
        return apiResponseErr(null, true, statusCode.exist, 'Delete Request Already Sent For Approval', res);
      }
      const updatedTransactionData = {
        id: transaction._id,
        websiteName: transaction.websiteName,
      };
      const editMessage = `${updatedTransactionData.websiteName} is sent to Super Admin for deleting approval`;

      const backupTransaction = new EditWebsiteRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        type: "Delete Website Detail's",
      });
      await backupTransaction.save();
      return apiResponseSuccess(backupTransaction, true, statusCode.success, 'Website Delete request sent to Super Admin', res);
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  trashBankTransaction: async (req, res) => {
    try {
      const { requestId } = req.body;
      const transaction = await EditRequest.findById(requestId);
      if (!transaction) {
        return apiResponseErr(null, true, statusCode.badRequest, 'Bank Transaction not found', res);
      }

      const updatedTransactionData = {
        bankId: transaction.bankId,
        transactionType: transaction.transactionType,
        remarks: transaction.remarks,
        withdrawAmount: transaction.withdrawAmount,
        depositAmount: transaction.depositAmount,
        subAdminId: transaction.subAdminId,
        subAdminName: transaction.subAdminName,
        accountHolderName: transaction.accountHolderName,
        bankName: transaction.bankName,
        accountNumber: transaction.accountNumber,
        ifscCode: transaction.ifscCode,
        createdAt: transaction.createdAt,
        upiId: transaction.upiId,
        upiAppName: transaction.upiAppName,
        upiNumber: transaction.upiNumber,
        isSubmit: transaction.isSubmit,
      };

      const backupTransaction = new Trash({
        ...updatedTransactionData,
        Nametype: 'Bank',
      });
      await backupTransaction.save();

      const deletedAdminUser = await BankTransaction.findByIdAndDelete(transaction.id);
      const deletedUser = await EditRequest.findByIdAndDelete(requestId);

      if (!deletedAdminUser || !deletedUser) {
        throw new CustomError( `Failed to delete transaction with id: ${requestId}`, null, statusCode.badRequest);
      }
      return apiResponseSuccess(backupTransaction, true, statusCode.success, 'Bank Transaction Moved To Trash', res);
    } catch (error) {
      return apiResponseErr(null, false,error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  trashWebsiteTransaction: async (req, res) => {
    try {
      const { requestId } = req.body;
      const transaction = await EditRequest.findById(requestId);
      if (!transaction) {
        return apiResponseErr(null, true, statusCode.badRequest, 'Website Transaction not found', res);
      }

      const updatedTransactionData = {
        websiteId: transaction.websiteId,
        transactionType: transaction.transactionType,
        remarks: transaction.remarks,
        withdrawAmount: transaction.withdrawAmount,
        depositAmount: transaction.depositAmount,
        subAdminId: transaction.subAdminId,
        subAdminName: transaction.subAdminName,
        websiteName: transaction.websiteName,
        createdAt: transaction.createdAt,
      };

      const backupTransaction = new Trash({
        ...updatedTransactionData,
        Nametype: 'Website',
      });
      await backupTransaction.save();

      const deletedAdminUser = await WebsiteTransaction.findByIdAndDelete(transaction.id);
      const deletedUser = await EditRequest.findByIdAndDelete(requestId);

      if (!deletedAdminUser || !deletedUser) {
        throw new CustomError(  `Failed to delete transaction with id: ${requestId}`, null, statusCode.badRequest);
      }
      return apiResponseSuccess(backupTransaction, true, statusCode.success, 'Website Transaction Moved To Trash', res);
    } catch (error) {
      return apiResponseErr(null, false,error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  trashTransaction: async (req, res) => {
    try {
      const { requestId } = req.body;

      const transaction = await EditRequest.findById(requestId);
      if (!transaction) {
        return apiResponseErr(null, true, statusCode.notFound, 'Transaction not found', res);
      }
      const updatedTransactionData = {
        bankId: transaction.bankId,
        websiteId: transaction.websiteId,
        transactionID: transaction.transactionID,
        transactionType: transaction.transactionType,
        remarks: transaction.remarks,
        amount: transaction.amount,
        subAdminId: transaction.subAdminId,
        subAdminName: transaction.subAdminName,
        introducerUserName: transaction.introducerUserName,
        userId: transaction.userId,
        userName: transaction.userName,
        paymentMethod: transaction.paymentMethod,
        websiteName: transaction.websiteName,
        bankName: transaction.bankName,
        bonus: transaction.bonus,
        bankCharges: transaction.bankCharges,
        createdAt: transaction.createdAt,
      };

      const backupTransaction = new Trash({
        ...updatedTransactionData,
        Nametype: 'Transaction',
      });
      await backupTransaction.save();

      const deletedAdminUser = await EditRequest.findByIdAndDelete(requestId);
      const deletedAdminTransaction = await Transaction.findByIdAndDelete(transaction.id);

      const user = await User.findOne({
        transactionDetail: {
          $elemMatch: { transactionID: transaction.transactionID },
        },
      });

      if (!user) {
        return apiResponseErr(null, true, statusCode.badRequest, `User with transaction not found`, res);
      }

      const transactionIndex = user.transactionDetail.findIndex(
        (transactionItem) => transactionItem.transactionID === transaction.transactionID
      );

      if (transactionIndex === -1) {
        return apiResponseErr(null, true, statusCode.badRequest, `Transaction not found in user's transactionDetail`, res);
      }

      user.transactionDetail.splice(transactionIndex, 1);
      await user.save();

      if (!deletedAdminTransaction || !deletedAdminUser) {
        throw new CustomError(  `Failed to delete transaction with id: ${requestId}`, null, statusCode.badRequest);
      }
      return apiResponseSuccess(backupTransaction, true, statusCode.success, 'Transaction Moved To Trash', res);
    } catch (error) {
      return apiResponseErr(null, false,error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  trashIntroducerTransaction:  async (req, res) => {
    try {
      const { requestId } = req.body;

      const transaction = await EditRequest.findById(requestId);
      if (!transaction) {
        return apiResponseErr(null, true, statusCode.notFound, 'Transaction not found', res);
      }

      const updatedTransactionData = {
        introUserId: transaction.introUserId,
        amount: transaction.amount,
        transactionType: transaction.transactionType,
        remarks: transaction.remarks,
        subAdminId: transaction.subAdminId,
        subAdminName: transaction.subAdminName,
        introducerUserName: transaction.introducerUserName,
        createdAt: transaction.createdAt,
      };

      const backupTransaction = new Trash({
        ...updatedTransactionData,
        Nametype: 'Introducer',
      });
      await backupTransaction.save();
      const deletedAdminUser = await IntroducerTransaction.findByIdAndDelete(transaction.id);
      const deletedUser = await EditRequest.findByIdAndDelete(requestId);

      if (!deletedAdminUser || !deletedUser) {
        throw new CustomError(  `Failed to delete transaction with id: ${requestId}`, null, statusCode.badRequest);
      }
      return apiResponseSuccess(backupTransaction, true, statusCode.success, 'Transaction Moved To Trash', res);
    } catch (error) {
      return apiResponseErr(null, false,error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  viewSubAdminTransaction: async (req, res) => {
    try {
      const userId = req.params.subadminId;
      const { page = 1, pageSize = 10 } = req.query;

      const skip = (page - 1) * pageSize;
      const limit = parseInt(pageSize);

      // Fetch all transactions without pagination
      const [transaction, bankTransaction, websiteTransaction] = await Promise.all([
        Transaction.find({ subAdminId: userId }).sort({ createdAt: -1 }).exec(),
        BankTransaction.find({ subAdminId: userId }).sort({ createdAt: -1 }).exec(),
        WebsiteTransaction.find({ subAdminId: userId }).sort({ createdAt: -1 }).exec(),
      ]);

      // Combine and sort all transactions
      const allTransactions = [...transaction, ...bankTransaction, ...websiteTransaction];
      allTransactions.sort((a, b) => b.createdAt - a.createdAt);

      if (allTransactions.length === 0) {
        return apiResponseErr([], true, statusCode.success, 'No transactions found for this sub-admin.', res);
      }

      // Apply pagination to the combined result set
      const paginatedTransactions = allTransactions.slice(skip, skip + limit);

      // Calculate total pages and items
      const totalItems = allTransactions.length;
      const totalPages = Math.ceil(totalItems / limit);

      // Send response with pagination info
      return apiResponsePagination(
        paginatedTransactions,
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
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  getAccountSummary: async (req, res) => {
    try {
      let { page = 1, pageSize = 10 } = req.query;

      page = parseInt(page);
      pageSize = parseInt(pageSize);

      const skip = (page - 1) * pageSize;
      const limit = pageSize;

      // Fetch all transactions without pagination
      const transactions = await Transaction.find({}).sort({ createdAt: -1 }).exec();
      const websiteTransactions = await WebsiteTransaction.find({}).sort({ createdAt: -1 }).exec();
      const bankTransactions = await BankTransaction.find({}).sort({ createdAt: -1 }).exec();

      const allTransactions = [...transactions, ...websiteTransactions, ...bankTransactions];

      // Sort all transactions by createdAt in descending order
      allTransactions.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA; // Descending order
      });

      // Apply pagination to the combined result
      const paginatedTransactions = allTransactions.slice(skip, skip + limit);

      const totalItems = allTransactions.length;
      const totalPages = Math.ceil(totalItems / pageSize);

      return apiResponsePagination(
        paginatedTransactions,
        true,
        statusCode.success,
        'success',
        {
          page,
          limit: pageSize,
          totalPages,
          totalItems,
        },
        res,
      );
    } catch (error) {
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  getUserDetails: async (req, res) => {
    try {
      const resultArray = await User.find({}, 'userName').exec();

      // Validate the resultArray
      if (!resultArray || resultArray.length === 0) {
        return apiResponseErr(null, false, statusCode.notFound, 'No users found in the database.', res);
      }

      return apiResponseSuccess(resultArray, true, statusCode.success, 'Usernames fetched successfully', res);
    } catch (error) {
      console.log(error);

      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  getIntroUserDetails: async (req, res) => {
    try {
      const resultArray = await IntroducerUser.find({}, 'userName').exec();

      // Validate the resultArray
      if (!resultArray || resultArray.length === 0) {
        return apiResponseErr(null, false, statusCode.notFound, 'No introducer users found in the database.', res);
      }

      return apiResponseSuccess(
        resultArray,
        true,
        statusCode.success,
        'Introducer usernames fetched successfully',
        res,
      );
    } catch (error) {
      console.log(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  viewSubAdminPage: async (req, res) => {
    const page = req.params.page;
    const searchQuery = req.query.search;
    try {
      let allIntroDataLength;
      if (searchQuery) {
        console.log('first');
        let SecondArray = [];
        const users = await Admin.find({ userName: { $regex: new RegExp(searchQuery, 'i') } }).exec();
        SecondArray = SecondArray.concat(users);
        allIntroDataLength = SecondArray.length;
        const pageNumber = Math.ceil(allIntroDataLength / 10);

        //res.status(200).json({ SecondArray, pageNumber, allIntroDataLength });
        return apiResponseSuccess(
          { SecondArray, pageNumber, allIntroDataLength },
          true,
          statusCode.success,
          'Admin fetched successfully based on the search query',
          res,
        );
      } else {
        console.log('second');
        let introducerUser = await Admin.find({ roles: { $nin: ['superAdmin'] } }).exec();
        let introData = JSON.parse(JSON.stringify(introducerUser));
        console.log('introData', introData.length);

        const SecondArray = [];
        const Limit = page * 10;
        console.log('Limit', Limit);

        for (let j = Limit - 10; j < Limit && j < introData.length; j++) {
          if (introData[j]) {
            SecondArray.push(introData[j]);
          }
        }
        allIntroDataLength = introData.length;

        if (SecondArray.length === 0) {
          // return res.status(404).json({ message: "No data found for the selected criteria." });
          throw new CustomError('No data found for the selected criteria.', null, 404);
        }

        const pageNumber = Math.ceil(allIntroDataLength / 10);
        //res.status(200).json({ SecondArray, pageNumber, allIntroDataLength });
        return apiResponseSuccess(
          { SecondArray, pageNumber, allIntroDataLength },
          true,
          statusCode.success,
          'Admin fetched successfully',
          res,
        );
      }
    } catch (error) {
      console.log(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  getSingleSubAdmin: async (req, res) => {
    try {
      if (!req.params.id) {
        throw { code: 400, message: "Sub Admin's Id not present" };
      }
      const subAdminId = req.params.id;
      const subAdmin = await Admin.findById(subAdminId);
      if (!subAdmin) {
        //throw { code: 500, message: "Sub Admin not found with the given Id" };
        throw new CustomError('Sub Admin not found with the given Id', null, 404);
      }
      //res.status(200).send(subAdmin);
      return apiResponseSuccess(subAdmin, true, statusCode.success, 'Sub Admin details fetched successfully', res);
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  editSubAdmin: async (req, res) => {
    try {
      const subAdminId = req.params.id;
      const { roles } = req.body;
      // if (!subAdminId) {
      //   throw { code: 400, message: "Id not found" };
      // }
      const subAdmin = await Admin.findById(subAdminId);
      if (!subAdmin) {
        throw new CustomError('Sub Admin not found', null, 404);
      }
      subAdmin.roles = roles;
      const user = await subAdmin.save();
      return apiResponseSuccess(user, true, statusCode.success, 'Sub Admin roles updated successfully', res);
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  userSingleData: async (req, res) => {
    try {
      const id = req.params.id;
      const introducerUser = await IntroducerUser.findOne({ _id: id }, 'userName').exec();
      if (!introducerUser) {
        //return res.status(404).send({ message: "IntroducerUser not found" });
        throw new CustomError('IntroducerUser not found', null, 404);
      }

      const users = await User.find({
        $or: [
          { introducersUserName: introducerUser.userName },
          { introducersUserName1: introducerUser.userName },
          { introducersUserName2: introducerUser.userName },
        ],
      }).exec();

      if (users.length === 0) {
        return res.status(404).send({ message: 'No matching users found' });
      }

      let filteredIntroducerUsers = [];

      users.forEach((matchedUser) => {
        let filteredIntroducerUser = {
          _id: matchedUser._id,
          firstname: matchedUser.firstname,
          lastname: matchedUser.lastname,
          userName: matchedUser.userName,
          wallet: matchedUser.wallet,
          role: matchedUser.role,
          webSiteDetail: matchedUser.webSiteDetail,
          transactionDetail: matchedUser.transactionDetail,
        };

        let matchedIntroducersUserName = null;
        let matchedIntroducerPercentage = null;

        if (matchedUser.introducersUserName === introducerUser.userName) {
          matchedIntroducersUserName = matchedUser.introducersUserName;
          matchedIntroducerPercentage = matchedUser.introducerPercentage;
        } else if (matchedUser.introducersUserName1 === introducerUser.userName) {
          matchedIntroducersUserName = matchedUser.introducersUserName1;
          matchedIntroducerPercentage = matchedUser.introducerPercentage1;
        } else if (matchedUser.introducersUserName2 === introducerUser.userName) {
          matchedIntroducersUserName = matchedUser.introducersUserName2;
          matchedIntroducerPercentage = matchedUser.introducerPercentage2;
        }

        if (matchedIntroducersUserName) {
          filteredIntroducerUser.matchedIntroducersUserName = matchedIntroducersUserName;
          filteredIntroducerUser.introducerPercentage = matchedIntroducerPercentage;
          filteredIntroducerUsers.push(filteredIntroducerUser);
        }
      });

      // return res.send(filteredIntroducerUsers);
      return apiResponseSuccess(
        filteredIntroducerUsers,
        true,
        statusCode.success,
        'User Data Reterive Successfully!',
        res,
      );
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  getSingleUserProfile: async (req, res) => {
    try {
      const id = req.params.id;
      const userProfile = await User.find({ _id: id }).sort({ createdAt: 1 }).exec();

      if (!userProfile || userProfile.length === 0) {
        throw new CustomError(`User profile not Found with ${id}`, null, 404);
      }
      //res.status(200).send(userProfile);
      return apiResponseSuccess(userProfile, true, statusCode.success, 'User Profile Fetched Successfully!', res);
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  adminFilterData: async (req, res) => {
    try {
      const { page, itemsPerPage } = req.query;
      const {
        transactionID,
        transactionType,
        introducerList,
        subAdminList,
        BankList,
        WebsiteList,
        sdate,
        edate,
        minAmount,
        maxAmount,
      } = req.body;

      const filter = {};
      console.log('Filter before applying:', filter);
      if (transactionID) {
        filter.transactionID = transactionID;
      }
      if (transactionType) {
        filter.transactionType = transactionType;
      }
      if (introducerList) {
        filter.introducerUserName = introducerList;
      }
      if (subAdminList) {
        filter.subAdminName = subAdminList;
      }
      if (BankList) {
        filter.bankName = BankList;
      }
      if (WebsiteList) {
        filter.websiteName = WebsiteList;
      }
      if (sdate && edate) {
        filter.createdAt = { $gte: new Date(sdate), $lte: new Date(edate) };
      } else if (sdate) {
        filter.createdAt = { $gte: new Date(sdate) };
      } else if (edate) {
        filter.createdAt = { $lte: new Date(edate) };
      }
      console.log('Transaction ID:', transactionID);
      console.log('Filter after applying:', filter);
      const transactions = await Transaction.find(filter).sort({ createdAt: -1 }).exec();
      // console.log('transactions', transactions)
      const websiteTransactions = await WebsiteTransaction.find(filter).sort({ createdAt: -1 }).exec();
      // console.log('websiteTransactions', websiteTransactions)
      const bankTransactions = await BankTransaction.find(filter).sort({ createdAt: -1 }).exec();
      // console.log('bankTransactions', bankTransactions)

      const filteredTransactions = transactions.filter((transaction) => {
        if (minAmount && maxAmount) {
          return transaction.amount >= minAmount && transaction.amount <= maxAmount;
        } else {
          return true;
        }
      });

      const filteredWebsiteTransactions = websiteTransactions.filter((transaction) => {
        if (minAmount && maxAmount) {
          return (
            (transaction.withdrawAmount >= minAmount && transaction.withdrawAmount <= maxAmount) ||
            (transaction.depositAmount >= minAmount && transaction.depositAmount <= maxAmount)
          );
        } else {
          return true;
        }
      });

      // console.log('filteredWebsiteTransactions', filteredWebsiteTransactions)

      const filteredBankTransactions = bankTransactions.filter((transaction) => {
        if (minAmount && maxAmount) {
          return (
            (transaction.withdrawAmount >= minAmount && transaction.withdrawAmount <= maxAmount) ||
            (transaction.depositAmount >= minAmount && transaction.depositAmount <= maxAmount)
          );
        } else {
          return true;
        }
      });

      // console.log('filteredBankTransactions', filteredBankTransactions)

      const alltrans = [...filteredTransactions, ...filteredWebsiteTransactions, ...filteredBankTransactions];
      alltrans.sort((a, b) => b.createdAt - a.createdAt);
      // console.log('all',alltrans.length)
      const allIntroDataLength = alltrans.length;
      // console.log("allIntroDataLength", allIntroDataLength);
      let pageNumber = Math.floor(allIntroDataLength / 10 + 1);
      const skip = (page - 1) * itemsPerPage;
      const limit = parseInt(itemsPerPage);
      const paginatedResults = alltrans.slice(skip, skip + limit);
      // console.log('pagitren',paginatedResults.length)

      if (paginatedResults.length !== 0) {
        // console.log('s')
        // console.log('pagin', paginatedResults.length)
        //return res.status(200).json({ paginatedResults, pageNumber, allIntroDataLength });
        return apiResponseSuccess(
          { paginatedResults, pageNumber, allIntroDataLength },
          true,
          statusCode.success,
          'Filtered data retrieved successfully',
          res,
        );
      } else {
        const itemsPerPage = 10; // Specify the number of items per page

        const totalItems = alltrans.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        let page = parseInt(req.query.page) || 1; // Get the page number from the request, default to 1 if not provided
        page = Math.min(Math.max(1, page), totalPages); // Ensure page is within valid range

        const skip = (page - 1) * itemsPerPage;
        const limit = Math.min(itemsPerPage, totalItems - skip); // Ensure limit doesn't exceed the number of remaining items
        const paginatedResults = alltrans.slice(skip, skip + limit);

        const pageNumber = page;
        const allIntroDataLength = totalItems;

        // return res.status(200).json({ paginatedResults, pageNumber, totalPages, allIntroDataLength });
        return apiResponseSuccess(
          { paginatedResults, pageNumber, totalPages, allIntroDataLength },
          true,
          statusCode.success,
          'Filtered data retrieved successfully',
          res,
        );
      }
    } catch (error) {
      console.log(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  getUserProfile: async (req, res) => {
    const page = req.params.page;
    const searchQuery = req.query.search;
    try {
      let allIntroDataLength;
      if (searchQuery) {
        console.log('first');
        let SecondArray = [];
        const users = await User.find({
          userName: { $regex: new RegExp(searchQuery, 'i') },
        }).exec();
        SecondArray = SecondArray.concat(users);
        allIntroDataLength = SecondArray.length;
        const pageNumber = Math.ceil(allIntroDataLength / 10);
        return apiResponseSuccess(
          { SecondArray, pageNumber, allIntroDataLength },
          true,
          statusCode.success,
          'User Profile retrive successfully',
          res,
        );
      } else {
        console.log('second');
        let introducerUser = await User.find({}).exec();
        let introData = JSON.parse(JSON.stringify(introducerUser));
        console.log('introData', introData.length);

        const SecondArray = [];
        const Limit = page * 10;
        console.log('Limit', Limit);

        for (let j = Limit - 10; j < Limit; j++) {
          SecondArray.push(introData[j]);
          console.log('lenth', SecondArray.length);
        }
        allIntroDataLength = introData.length;

        if (SecondArray.length === 0) {
          return apiResponseErr(null, false, statusCode.notFound, ' No data found for the selected criteria.', res);
        }

        const pageNumber = Math.ceil(allIntroDataLength / 10);

        return apiResponseSuccess(
          { SecondArray, pageNumber, allIntroDataLength },
          true,
          statusCode.success,
          'User Profile retrive successfully',
          res,
        );
      }
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  getBankViewAdmins: async (req, res) => {
    try {
      const superAdmin = await Admin.find(
        {
          roles: {
            $all: ['Bank-View'],
          },
        },
        'userName',
      ).exec();
      console.log('superAdmin', superAdmin);

      //res.status(200).send(superAdmin);
      return apiResponseSuccess(superAdmin, true, statusCode.success, " Admins with 'Bank-View' role found.", res);
    } catch (error) {
      console.error(e);
      return apiResponseErr(null, flase, statusCode.internalServerError, error.message, res);
    }
  },

  getSubAdminName: async (req, res) => {
    try {
      const superAdmin = await Admin.find({}, 'userName').exec();
      console.log('superAdmin', superAdmin);
      return apiResponseSuccess(superAdmin, true, statusCode.success, ' Suceessfully Retrived Admin User Name', res);
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  getWebsiteViewAdmins: async (req, res) => {
    try {
      const superAdmin = await Admin.find(
        {
          roles: {
            $all: ['Website-View'],
          },
        },
        'userName',
      ).exec();
      console.log('superAdmin', superAdmin);

      //res.status(200).send(superAdmin);
      return apiResponseSuccess(
        superAdmin,
        true,
        statusCode.success,
        'Successfully retrieved  admin with Website-View role',
        res,
      );
    } catch (error) {
      console.error(e);
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },
};

export default AccountServices;
