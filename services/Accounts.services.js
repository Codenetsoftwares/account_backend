import { generateTokens } from "../helpers/generateToken.js";
import { Admin } from "../models/admin_user.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Bank } from "../models/bank.model.js";
import { Website } from "../models/website.model.js";
import { BankTransaction } from "../models/BankTransaction.model.js";
import { WebsiteTransaction } from "../models/WebsiteTransaction.model.js";
import { EditBankRequest } from "../models/EditBankRequest.model.js";
import { EditWebsiteRequest } from "../models/EditWebsiteRequest.model.js";
import { EditRequest } from "../models/EditRequest.model.js";
import { Transaction } from "../models/transaction.js";
import { IntroducerUser } from "../models/introducer.model.js";
import { IntroducerTransaction } from "../models/IntroducerTransaction.model.js"
import { introducerUser } from "../services/introducer.services.js";
import { IntroducerEditRequest } from "../models/IntroducerEditRequest.model.js"
import { Trash } from "../models/Trash.model.js";
import { apiResponseErr, apiResponsePagination, apiResponseSuccess } from "../utils/response.js";
import { statusCode } from "../utils/statusCodes.js";
import { string } from "../constructor/string.js";

const AccountServices = {
  adminLogin: async (req, res) => {
    try {
      const email = req.body.email;
      const password = req.body.password;
      const data = await Admin.findOne({ adminEmail: email }).exec();
      if (data === null) {
        throw { code: 400, message: "Unknown Admin" };
      }
      const checkPassword = await bcrypt.compare(password, data.adminPassword);
      if (checkPassword) {
        const token = await generateTokens({
          email: data.adminEmail,
          username: data.adminName,
          role: "admin",
        });
        return res.send({ status: 200, message: "success", result: token });
      } else {
        throw { code: 400, message: "Wrong Password" };
      }
    } catch (error) {
      return res.send(error);
    }
  },

  createAdmin: async (data) => {
    if (!data.firstname) {
      throw { code: 400, message: "Firstname is required" };
    }
    if (!data.lastname) {
      throw { code: 400, message: "Last Name is required" };
    }
    if (!data.userName) {
      throw { code: 400, message: "Username is required" };
    }
    if (!data.password) {
      throw { code: 400, message: "Password is required" };
    }
    if (!data.roles || !Array.isArray(data.roles) || data.roles.length === 0) {
      throw { code: 400, message: "Roles is required" };
    }

    const existingUser = await Admin.findOne({
      userName: data.userName,
    }).exec();
    const existingOtherUser = await User.findOne({ userName: data.userName });
    const existingIntroUser = await IntroducerUser.findOne({
      userName: data.userName,
    });

    if (existingUser || existingOtherUser || existingIntroUser) {
      throw { code: 409, message: `User already exists: ${data.userName}` };
    }

    const passwordSalt = await bcrypt.genSalt();
    const encryptedPassword = await bcrypt.hash(data.password, passwordSalt);

    const newAdmin = new Admin({
      firstname: data.firstname,
      lastname: data.lastname,
      userName: data.userName,
      password: encryptedPassword,
      roles: data.roles,
    });

    try {
      await newAdmin.save();
    } catch (err) {
      console.error(err);
      throw { code: 500, message: "Failed to Save New Admin" };
    }
  },

  SubAdminPasswordResetCode: async (userName, password) => {
    const existingUser = await AccountServices.findAdmin({
      userName: userName,
    });

    const passwordIsDuplicate = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (passwordIsDuplicate) {
      throw {
        code: 409,
        message: "New Password cannot be the same as existing password",
      };
    }

    const passwordSalt = await bcrypt.genSalt();
    const encryptedPassword = await bcrypt.hash(password, passwordSalt);

    existingUser.password = encryptedPassword;
    existingUser.save().catch((err) => {
      console.error(err);
      throw { code: 500, message: "Failed to save new password" };
    });

    return true;
  },

  SuperAdminPasswordResetCode: async (userName, oldPassword, password) => {
    const existingUser = await AccountServices.findAdmin({
      userName: userName,
    });

    const oldPasswordIsCorrect = await bcrypt.compare(
      oldPassword,
      existingUser.password
    );

    if (!oldPasswordIsCorrect) {
      throw {
        code: 401,
        message: "Invalid old password",
      };
    }

    const passwordIsDuplicate = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (passwordIsDuplicate) {
      throw {
        code: 409,
        message: "New Password cannot be the same as existing password",
      };
    }

    const passwordSalt = await bcrypt.genSalt();
    const encryptedPassword = await bcrypt.hash(password, passwordSalt);

    existingUser.password = encryptedPassword;
    existingUser.save().catch((err) => {
      console.error(err);
      throw { code: 500, message: "Failed to save new password" };
    });

    return true;
  },



  generateAdminAccessToken: async (userName, password, persist) => {
    if (!userName) {
      throw { code: 400, message: "Invalid value for: User Name" };
    }
    if (!password) {
      throw { code: 400, message: "Invalid value for: password" };
    }

    const existingUser = await AccountServices.findAdmin({
      userName: userName,
    });
    console.log(existingUser)
    if (!existingUser) {
      throw { code: 401, message: "Invalid User Name or password" };
    }

    const passwordValid = await bcrypt.compare(password, existingUser.password);
    if (!passwordValid) {
      throw { code: 401, message: "Invalid User Name or password" };
    }

    const accessTokenResponse = {
      id: existingUser._id,
      firstname: existingUser.firstname,
      lastname: existingUser.lastname,
      userName: existingUser.userName,
      role: existingUser.roles,
    };

    const accessToken = jwt.sign(
      accessTokenResponse,
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: persist ? "1y" : "8h",
      }
    );

    return {
      userName: existingUser.userName,
      accessToken: accessToken,
      role: existingUser.roles,
    };
  },

  findAdminById: async (id) => {
    if (!id) {
      throw { code: 409, message: "Required parameter: id" };
    }

    return Admin.findById(id).exec();
  },

  findUserById: async (id) => {
    if (!id) {
      throw { code: 409, message: "Required parameter: id" };
    }

    return User.findById(id).exec();
  },

  findAdmin: async (filter) => {
    if (!filter) {
      throw { code: 409, message: "Required parameter: filter" };
    }
    return Admin.findOne(filter).exec();
  },

  findUser: async (filter) => {
    if (!filter) {
      throw { code: 409, message: "Required parameter: filter" };
    }
    return User.findOne(filter).exec();
  },

  updateBank: async (id, data) => {
    const existingTransaction = await Bank.findById(id);
    if (!existingTransaction) {
      throw { code: 404, message: `Bank not found with id: ${id}` };
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
      throw { code: 400, message: "Bank name already exists!" };
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
      type: "Edit",
      message: "Bank Detail's has been edited",
    });

    await editRequest.save();
    return true;
  },

  getIntroBalance: async (introUserId) => {
    const intorTranasction = await IntroducerTransaction.find({ introUserId: introUserId }).exec();
    let balance = 0;
    intorTranasction.forEach((transaction) => {
      if (transaction.transactionType === "Deposit") {
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
      currentDue: currentDue
    };
  },

  IntroducerBalance: async (introUserId) => {
    const intorTranasction = await IntroducerTransaction.find({ introUserId: introUserId }).exec();
    let balance = 0;
    intorTranasction.forEach((transaction) => {
      if (transaction.transactionType === "Deposit") {
        balance += transaction.amount;
      } else {
        balance -= transaction.amount;
      }
    });
    return balance

  },

  getBankNames: async (req, res) => {
    try {
      const { page = 1, pageSize = 10, search = '' } = req.query;
      const skip = (page - 1) * pageSize;
      const limit = parseInt(pageSize);

      // Build search query
      const searchQuery = search ? { bankName: { $regex: search, $options: 'i' } } : {};


      // Fetch paginated bank data
      let dbBankData = await Bank.find(searchQuery)
        .skip(skip)
        .limit(limit)
        .exec();

      let bankData = JSON.parse(JSON.stringify(dbBankData));


      // Fetch total count of documents matching the search query
      const totalItems = await Bank.countDocuments(searchQuery);
      const totalPages = Math.ceil(totalItems / limit);

      // Process the bank data based on user role
      const userRole = req.user.roles;
      if (userRole.includes(string.superAdmin)) {
        // For superAdmins, update the balance for all banks
        for (let index = 0; index < bankData.length; index++) {
          bankData[index].balance = await AccountServices.getBankBalance(bankData[index]._id);
        }
      } else {
        // For subAdmins, filter and update bank data based on permissions
        const userSubAdminId = req.user.userName;

        bankData = await Promise.all(bankData.map(async bank => {
          const userSubAdmin = bank.subAdmins.find(subAdmin => subAdmin.subAdminId === userSubAdminId);

          if (userSubAdmin) {
            bank.balance = await AccountServices.getBankBalance(bank._id);
            bank.isDeposit = userSubAdmin.isDeposit;
            bank.isWithdraw = userSubAdmin.isWithdraw;
            bank.isRenew = userSubAdmin.isRenew;
            bank.isEdit = userSubAdmin.isEdit;
            bank.isDelete = userSubAdmin.isDelete;
            return bank;
          } else {
            return null;
          }
        }));

        bankData = bankData.filter(bank => bank !== null);
      }

      // Sort the bankData by createdAt
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
          totalItems
        },
        res
      );
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  getBankBalance: async (bankId) => {
    try {
      const bankTransactions = await BankTransaction.find({ bankId: bankId }).exec();
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
        if (transaction.transactionType === "Deposit") {
          balance += transaction.amount;
        } else {
          const totalBalance = balance - transaction.bankCharges - transaction.amount;
          balance = totalBalance;
        }
      });
      editTransaction.forEach((data) => {
        if (data.transactionType === "Manual-Bank-Deposit") {
          balance += data.depositAmount;
        }
        if (data.transactionType === "Manual-Bank-Withdraw") {
          balance -= data.withdrawAmount;
        }
        if (data.transactionType === "Deposit") {
          balance += data.amount;
        }
        if (data.transactionType === "Withdraw") {
          const netAmount = balance - data.bankCharges - data.amount;
          balance = netAmount;
        }
      });
  
      return balance;
    } catch (error) {
      console.error("Error in getBankBalance:", error);
      throw error;
    }
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

        websiteData = await Promise.all(websiteData.map(async (website) => {
          const userSubAdmin = website.subAdmins.find(subAdmin => subAdmin.subAdminId === userSubAdminId);

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
        }));

        // Filter out null values (websites not authorized for the subAdmin)
        websiteData = websiteData.filter(website => website !== null);
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
          totalItems
        },
        res
      );
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  getWebsiteBalance: async (websiteId) => {
    const websiteTransactions = await WebsiteTransaction.find({ websiteId }).exec();
    const transactions = await Transaction.find({ websiteId }).exec();

    let balance = 0;

    websiteTransactions.forEach(transaction => {
      balance += transaction.depositAmount || 0;
      balance -= transaction.withdrawAmount || 0;
    });

    transactions.forEach(transaction => {
      if (transaction.transactionType === "Deposit") {
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
    const duplicateWebsite = await Website.findOne({ websiteName: data.websiteName });
    if (duplicateWebsite && duplicateWebsite._id.toString() !== id) {
      throw { code: 400, message: "Website name already exists!" };
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

  updateUserProfile: async (id, data) => {
    const existingUser = await User.findById(id);
    if (!existingUser) {
      throw { code: 404, message: `Existing User not found with id: ${id}` };
    }

    // Validate introducerPercentage, introducerPercentage1, and introducerPercentage2
    const introducerPercentage = data.introducerPercentage !== undefined ? parseFloat(data.introducerPercentage) : existingUser.introducerPercentage;
    const introducerPercentage1 = data.introducerPercentage1 !== undefined ? parseFloat(data.introducerPercentage1) : existingUser.introducerPercentage1;
    const introducerPercentage2 = data.introducerPercentage2 !== undefined ? parseFloat(data.introducerPercentage2) : existingUser.introducerPercentage2;

    if (isNaN(introducerPercentage) || isNaN(introducerPercentage1) || isNaN(introducerPercentage2)) {
      throw { code: 400, message: 'Introducer percentages must be valid numbers.' };
    }

    const totalIntroducerPercentage = introducerPercentage + introducerPercentage1 + introducerPercentage2;

    if (totalIntroducerPercentage < 0 || totalIntroducerPercentage > 100) {
      throw { code: 400, message: 'The sum of introducer percentages must be between 0 and 100.' };
    }

    // Create a new object to store the updated user data
    const updatedUserData = {
      ...existingUser.toObject(), // Convert existing user object to plain JavaScript object
      introducersUserName1: data.introducersUserName1 || existingUser.introducersUserName1,
      introducerPercentage1: introducerPercentage1,
      introducersUserName2: data.introducersUserName2 || existingUser.introducersUserName2,
      introducerPercentage2: introducerPercentage2,
    };

    // Update the remaining fields
    updatedUserData.firstname = data.firstname || existingUser.firstname;
    updatedUserData.lastname = data.lastname || existingUser.lastname;
    updatedUserData.contactNumber = data.contactNumber || existingUser.contactNumber;
    updatedUserData.bankDetail = data.bankDetail || existingUser.bankDetail;
    updatedUserData.upiDetail = data.upiDetail || existingUser.upiDetail;
    updatedUserData.introducerPercentage = introducerPercentage;
    updatedUserData.introducersUserName = data.introducersUserName || existingUser.introducersUserName;
    updatedUserData.webSiteDetail = data.webSiteDetail || existingUser.webSiteDetail;

    // Save the updated user data
    await existingUser.set(updatedUserData).save().catch((err) => {
      console.error(err);
      throw {
        code: 500,
        message: `Failed to update User Profile with id: ${id}`,
      };
    });

    return true;
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

  deleteBankTransaction: async (transaction, user) => {
    const existingTransaction = await BankTransaction.findById(transaction);
    if (!existingTransaction) {
      throw { code: 404, message: `Transaction not found with id: ${transaction}` };
    }
    const existingEditRequest = await EditRequest.findOne({
      id: transaction,
      type: "Delete",
    });
    if (existingEditRequest) {
      throw { code: 409, message: "Request Already Sent For Approval" };
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
      isSubmit: transaction.isSubmit
    };
    const name = user.firstname;
    const editMessage = `${updatedTransactionData.transactionType} is sent to Super Admin for moving to trash approval`;
    await createEditRequest(updatedTransactionData, editMessage, name);
    async function createEditRequest(updatedTransactionData, editMessage, name) {
      const backupTransaction = new EditRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        requesteduserName: name,
        type: "Delete",
        Nametype: "Bank"
      });
      await backupTransaction.save();
    }
    return true;
  },

  deleteWebsiteTransaction: async (transaction, user) => {
    const existingTransaction = await WebsiteTransaction.findById(transaction);
    if (!existingTransaction) {
      throw {
        code: 404,
        message: `Website Transaction not found with id: ${transaction}`,
      };
    }
    const existingEditRequest = await EditRequest.findOne({
      id: transaction,
      type: "Delete",
    });
    if (existingEditRequest) {
      throw {
        code: 409,
        message: "Request Already Sent For Approval",
      };
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
    await createEditRequest(updatedTransactionData, editMessage, name);
    async function createEditRequest(updatedTransactionData, editMessage, name) {
      const backupTransaction = new EditRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        requesteduserName: name,
        type: "Delete",
        Nametype: "Website"
      });
      await backupTransaction.save();
    }

    return true;
  },

  deleteTransaction: async (transaction, user) => {
    const existingTransaction = await Transaction.findById(transaction);
    if (!existingTransaction) {
      throw { code: 404, message: `Transaction not found with id: ${transaction}` };
    }
    const existingEditRequest = await EditRequest.findOne({
      id: transaction,
      type: "Delete",
    });
    if (existingEditRequest) {
      throw {
        code: 409,
        message: "Request Already Sent For Approval",
      };
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
      amount: transaction.amount,
      bonus: transaction.bonus,
      bankCharges: transaction.bankCharges,
      createdAt: transaction.createdAt,
    };
    const name = user.firstname;
    console.log("user", user)
    const editMessage = `${updatedTransactionData.transactionType} is sent to Super Admin for moving into trash approval`;
    await createEditRequest(updatedTransactionData, editMessage, name);
    async function createEditRequest(updatedTransactionData, editMessage, name) {
      const backupTransaction = new EditRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        requesteduserName: name,
        type: "Delete",
        Nametype: "Transaction"
      });
      await backupTransaction.save();
    }
    return true;
  },

  deleteIntroducerTransaction: async (transaction, user) => {
    const existingTransaction = await IntroducerTransaction.findById(transaction);
    if (!existingTransaction) {
      throw { code: 404, message: `Transaction not found with id: ${transaction}` };
    }
    const existingEditRequest = await IntroducerEditRequest.findOne({
      id: transaction,
      type: "Delete",
    });
    if (existingEditRequest) {
      throw { code: 409, message: "Request Already Sent For Approval" };
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
      createdAt: transaction.createdAt
    };
    const name = user.firstname;
    const editMessage = `Introducer ${updatedTransactionData.transactionType} is sent to Super Admin for moving into trash approval`;
    await createEditRequest(updatedTransactionData, editMessage, name);
    async function createEditRequest(updatedTransactionData, editMessage, name) {
      const backupTransaction = new IntroducerEditRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        requesteduserName: name,
        type: "Delete",
        Nametype: "Introducer"
      });
      await backupTransaction.save();
    }
    return true;
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

  deleteBank: async (id) => {
    const existingTransaction = await Bank.findById(id);
    if (!existingTransaction) {
      throw { code: 404, message: `Bank not found with id: ${id}` };
    }
    const existingEditRequest = await EditBankRequest.findOne({
      id: id,
      type: "Delete Bank Detail's",
    });
    if (existingEditRequest) {
      throw {
        code: 409,
        message: "Delete Request Already Sent For Approval",
      };
    }
    const updatedTransactionData = {
      id: id._id,
      accountHolderName: id.accountHolderName,
      bankName: id.bankName,
      accountNumber: id.accountNumber,
      ifscCode: id.ifscCode,
      upiId: id.upiId,
      upiAppName: id.upiAppName,
      upiNumber: id.upiNumber,
    };
    const editMessage = `${updatedTransactionData.bankName} is sent to Super Admin for deleting approval`;
    await createEditRequest(updatedTransactionData, editMessage);
    async function createEditRequest(updatedTransactionData, editMessage) {
      const backupTransaction = new EditBankRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        type: "Delete Bank Detail's",
      });
      await backupTransaction.save();
    }
    return true;
  },

  deleteWebsite: async (id) => {
    const existingTransaction = await Website.findById(id);
    if (!existingTransaction) {
      throw { code: 404, message: `Website not found with id: ${id}` };
    }
    const existingEditRequest = await EditWebsiteRequest.findOne({
      id: id,
      type: "Delete Website Detail's",
    });
    if (existingEditRequest) {
      throw {
        code: 409,
        message: "Delete Request Already Sent For Approval",
      };
    }
    const updatedTransactionData = {
      id: id._id,
      websiteName: id.websiteName,
    };
    const editMessage = `${updatedTransactionData.websiteName} is sent to Super Admin for deleting approval`;
    await createEditRequest(updatedTransactionData, editMessage);
    async function createEditRequest(updatedTransactionData, editMessage) {
      const backupTransaction = new EditWebsiteRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        type: "Delete Website Detail's",
      });
      await backupTransaction.save();
    }
    return true;
  },

  trashBankTransaction: async (transaction) => {
    const existingTransaction = await EditRequest.findById(transaction);
    if (!existingTransaction) {
      throw { code: 404, message: `Transaction not found with id: ${transaction}` };
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
      isSubmit: transaction.isSubmit
    };
    const backupTransaction = new Trash({ ...updatedTransactionData, Nametype: "Bank" });
    await backupTransaction.save();
    const deletedAdminUser = await BankTransaction.findByIdAndDelete(transaction.id);
    const deletedUser = await EditRequest.findByIdAndDelete(transaction);
    if (!deletedAdminUser) {
      throw { code: 500, message: `Failed to delete Admin User with id: ${transaction}` };
    }
    if (!deletedUser) {
      throw { code: 500, message: `Failed to delete Admin User with id: ${transaction}` };
    }
    return true;
  },

  trashWebsiteTransaction: async (transaction) => {
    const existingTransaction = await EditRequest.findById(transaction);
    if (!existingTransaction) {
      throw { code: 404, message: `Transaction not found with id: ${transaction}` };
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
    const backupTransaction = new Trash({ ...updatedTransactionData, Nametype: "Website" });
    await backupTransaction.save();
    const deletedAdminUser = await WebsiteTransaction.findByIdAndDelete(transaction.id);
    const deletedUser = await EditRequest.findByIdAndDelete(transaction);
    if (!deletedAdminUser) {
      throw { code: 500, message: `Failed to delete Admin User with id: ${transaction}` };
    }
    if (!deletedUser) {
      throw { code: 500, message: `Failed to delete Admin User with id: ${transaction}` };
    }
    return true;
  },

  trashTransaction: async (transaction) => {
    const existingTransaction = await EditRequest.findById(transaction);
    if (!existingTransaction) {
      throw { code: 404, message: `Transaction not found with id: ${transaction}` };
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
      amount: transaction.amount,
      bonus: transaction.bonus,
      bankCharges: transaction.bankCharges,
      createdAt: transaction.createdAt,
    };
    const backupTransaction = new Trash({ ...updatedTransactionData, Nametype: "Transaction" });
    await backupTransaction.save();
    const deletedAdminUser = await EditRequest.findByIdAndDelete(transaction);
    const deletedAdminTransaction = await Transaction.findByIdAndDelete(transaction.id);
    const user = await User.findOne({ "transactionDetail": { $elemMatch: { "transactionID": transaction.transactionID } } });
    const transactionIndex = user.transactionDetail.findIndex(
      (transactionItem) => transactionItem.transactionID === transaction.transactionID
    );
    if (transactionIndex === -1) {
      throw { code: 404, message: `Transaction not found in user's transactionDetail` };
    }
    user.transactionDetail.splice(transactionIndex, 1);
    await user.save();
    if (!deletedAdminTransaction) {
      throw { code: 500, message: `Failed to delete Admin User with id: ${transaction}` };
    }
    if (!deletedAdminUser) {
      throw { code: 500, message: `Failed to delete Admin User with id: ${transaction}` };
    }
    return true;
  },

  trashIntroducerTransaction: async (transaction) => {
    const existingTransaction = await EditRequest.findById(transaction);
    if (!existingTransaction) {
      throw { code: 404, message: `Transaction not found with id: ${transaction}` };
    }
    const updatedTransactionData = {
      introUserId: transaction.introUserId,
      amount: transaction.amount,
      transactionType: transaction.transactionType,
      remarks: transaction.remarks,
      subAdminId: transaction.subAdminId,
      subAdminName: transaction.subAdminName,
      introducerUserName: transaction.introducerUserName,
      createdAt: transaction.createdAt
    };
    const backupTransaction = new Trash({ ...updatedTransactionData, Nametype: "Introducer" });
    await backupTransaction.save();
    const deletedAdminUser = await IntroducerTransaction.findByIdAndDelete(transaction.id);
    const deletedUser = await EditRequest.findByIdAndDelete(transaction);
    if (!deletedAdminUser) {
      throw { code: 500, message: `Failed to delete Admin User with id: ${transaction}` };
    }
    if (!deletedUser) {
      throw { code: 500, message: `Failed to delete Admin User with id: ${transaction}` };
    }
    return true;
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
      //res.status(200).send(resultArray);
      return apiResponseSuccess(resultArray, true, statusCode.success, 'Usernames fetched successfully', res);
    } catch (error) {
      console.log(error);
      //res.status(500).send("Internal Server error");
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
      //res.status(200).send(resultArray);
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

  getSingleUserProfile : async (req, res) => {
    try {
      const id = req.params.id;
      const userProfile = await User.find({ _id: id }).sort({ createdAt: 1 }).exec();

      if(!userProfile || userProfile.length === 0){
        throw new CustomError(`User profile not Found with ${id}`, null, 404)
      }
      //res.status(200).send(userProfile);
      return apiResponseSuccess(userProfile, true, statusCode.success, "User Profile Fetched Successfully!", res)
    } catch (error) {
      console.error(error);
        return apiResponseErr(
        null,
        false,
        error.responseCode ?? statusCode.internalServerError,
        error.message,
        res
)
    }
  },

  adminFilterData : async (req, res) => {
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
          { paginatedResults, pageNumber,  allIntroDataLength }, 
          true, 
          statusCode.success,
          "Filtered data retrieved successfully",
          res   
      )
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
        "Filtered data retrieved successfully",
        res   
    )
      }
    } catch (error) {
    console.log(error)
    return apiResponseErr(
      null,
      false,
      error.responseCode ?? statusCode.internalServerError,
      error.message,
      res
    )}
  },


};

export default AccountServices;
