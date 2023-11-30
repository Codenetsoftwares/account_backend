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

    // Create updatedTransactionData using a ternary operator
    const updatedTransactionData = {
      id: id._id,
      accountHolderName:
        data.accountHolderName || existingTransaction.accountHolderName,
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
  

  getWebsiteBalance: async (websiteId) => {
    const websiteTransactions = await WebsiteTransaction.find({
      websiteId: websiteId,
    }).exec();
    const transaction = await Transaction.find({ websiteId: websiteId }).exec();
    let balance = 0;
    websiteTransactions.forEach((transaction) => {
      balance += transaction.depositAmount || 0;
      balance -= transaction.withdrawAmount || 0;
    });

    transaction.forEach((transactions) => {
      if (transactions.transactionType === "Deposit") {
        balance = Number(balance) - Number(transactions.bonus) - Number(transactions.amount);
      } else {
        balance += transactions?.amount;
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

  deleteBankTransaction: async (transaction,user) => {
    const existingTransaction = await BankTransaction.findById(transaction);
    if (!existingTransaction) {
      throw { code: 404, message: `Transaction not found with id: ${transaction}` };
    }
    const existingEditRequest = await EditRequest.findOne({
      id: transaction,
      type: "Delete",
    });
    if (existingEditRequest) {
      throw { code: 409, message: "Delete Request Already Sent For Approval" };
    }

    const updatedTransactionData = {
      id: transaction._id,
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
    };
    const name = user.firstname;
    const editMessage = `${updatedTransactionData.transactionType} is sent to Super Admin for deleting approval`;
    await createEditRequest(updatedTransactionData, editMessage, name);
    async function createEditRequest(updatedTransactionData, editMessage, name) {
      const backupTransaction = new EditRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        requesteduserName: name,
        type: "Delete",
      });
      await backupTransaction.save();
    }
    return true;
  },

  deleteWebsiteTransaction: async (transaction,user) => {
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
        message: "Delete Request Already Sent For Approval",
      };
    }
    const updatedTransactionData = {
      id: transaction._id,
      transactionType: transaction.transactionType,
      remarks: transaction.remarks,
      withdrawAmount: transaction.withdrawAmount,
      depositAmount: transaction.depositAmount,
      subAdminId: transaction.subAdminId,
      subAdminName: transaction.subAdminName,
      websiteName: transaction.websiteName,
    };
    const name = user.firstname;
    const editMessage = `${updatedTransactionData.transactionType} is sent to Super Admin for deleting approval`;
    await createEditRequest(updatedTransactionData, editMessage,name);
    async function createEditRequest(updatedTransactionData, editMessage,name) {
      const backupTransaction = new EditRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        requesteduserName: name,
        type: "Delete",
      });
      await backupTransaction.save();
    }

    return true;
  },

  deleteTransaction: async (transaction,user) => {
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
        message: "Delete Request Already Sent For Approval",
      };
    }
    const updatedTransactionData = {
      id: transaction._id,
      transactionID: transaction.transactionID,
      transactionType: transaction.transactionType,
      remarks: transaction.remarks,
      amount: transaction.amount,
      subAdminId: transaction.subAdminId,
      userId: transaction.userId,
      userName: transaction.userName,
      paymentMethod: transaction.paymentMethod,
      websiteName: transaction.websiteName,
      bankName: transaction.bankName,
      amount: transaction.amount,
      bonus: transaction.bonus,
      bankCharges: transaction.bankCharges,
    };
    const name = user.firstname;
    console.log("user",user)
    const editMessage = `${updatedTransactionData.transactionType} is sent to Super Admin for deleting approval`;
    await createEditRequest(updatedTransactionData, editMessage, name);
    async function createEditRequest(updatedTransactionData, editMessage, name) {
      const backupTransaction = new EditRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        requesteduserName: name,
        type: "Delete",
      });
      await backupTransaction.save();
    }
    return true;
  },

  deleteIntroducerTransaction: async (transaction,user) => {
    const existingTransaction = await IntroducerTransaction.findById(transaction);
    if (!existingTransaction) {
      throw { code: 404, message: `Transaction not found with id: ${transaction}` };
    }
    const existingEditRequest = await IntroducerEditRequest.findOne({
      id: transaction,
      type: "Delete",
    });
    if (existingEditRequest) {
      throw { code: 409, message: "Delete Request Already Sent For Approval" };
    }

    const updatedTransactionData = {
      id: transaction._id,
      transactionType: transaction.transactionType,
      remarks: transaction.remarks,
      subAdminId: transaction.subAdminId,
      subAdminName: transaction.subAdminName,
      amount: transaction.amount,
      introducerUserName: transaction.introducerUserName
    };
    const name = user.firstname;
    const editMessage = `Introducer ${updatedTransactionData.transactionType} is sent to Super Admin for deleting approval`;
    await createEditRequest(updatedTransactionData, editMessage, name);
    async function createEditRequest(updatedTransactionData, editMessage, name) {
      const backupTransaction = new IntroducerEditRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        requesteduserName: name,
        type: "Delete",
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
    const existingTransaction = await BankTransaction.findById(transaction);
    if (!existingTransaction) {
      throw { code: 404, message: `Transaction not found with id: ${transaction}` };
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
      createdAt: transaction.createdAt
    };
      const backupTransaction = new Trash(updatedTransactionData);
      await backupTransaction.save();
      const deletedAdminUser = await BankTransaction.findByIdAndDelete(transaction);
      if (!deletedAdminUser) {
        throw { code: 500, message: `Failed to delete Admin User with id: ${transaction}` };
      }
    return true;
  },

  trashWebsiteTransaction: async (transaction) => {
    const existingTransaction = await WebsiteTransaction.findById(transaction);
    if (!existingTransaction) {
      throw { code: 404, message: `Transaction not found with id: ${transaction}` };
    }
    const updatedTransactionData = {
      id: transaction._id,
      transactionType: transaction.transactionType,
      remarks: transaction.remarks,
      withdrawAmount: transaction.withdrawAmount,
      depositAmount: transaction.depositAmount,
      subAdminId: transaction.subAdminId,
      subAdminName: transaction.subAdminName,
      websiteName: transaction.websiteName,
    };
      const backupTransaction = new Trash(updatedTransactionData);
      await backupTransaction.save();
      const deletedAdminUser = await WebsiteTransaction.findByIdAndDelete(transaction);
      if (!deletedAdminUser) {
        throw { code: 500, message: `Failed to delete Admin User with id: ${transaction}` };
      }
    return true;
  },

  trashTransaction: async (transaction) => {
    const existingTransaction = await Transaction.findById(transaction);
    if (!existingTransaction) {
      throw { code: 404, message: `Transaction not found with id: ${transaction}` };
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
      userId: transaction.userId,
      userName: transaction.userName,
      paymentMethod: transaction.paymentMethod,
      websiteName: transaction.websiteName,
      bankName: transaction.bankName,
      amount: transaction.amount,
      bonus: transaction.bonus,
      bankCharges: transaction.bankCharges,
    };
      const backupTransaction = new Trash(updatedTransactionData);
      await backupTransaction.save();
      const deletedAdminUser = await Transaction.findByIdAndDelete(transaction);
      if (!deletedAdminUser) {
        throw { code: 500, message: `Failed to delete Admin User with id: ${transaction}` };
      }
    return true;
  },

  trashIntroducerTransaction: async (transaction) => {
    const existingTransaction = await IntroducerTransaction.findById(transaction);
    if (!existingTransaction) {
      throw { code: 404, message: `Transaction not found with id: ${transaction}` };
    }
    const updatedTransactionData = {
      id: transaction._id,
      transactionType: transaction.transactionType,
      remarks: transaction.remarks,
      subAdminId: transaction.subAdminId,
      subAdminName: transaction.subAdminName,
      amount: transaction.amount,
      introducerUserName: transaction.introducerUserName
    };
      const backupTransaction = new Trash(updatedTransactionData);
      await backupTransaction.save();
      const deletedAdminUser = await IntroducerTransaction.findByIdAndDelete(transaction);
      if (!deletedAdminUser) {
        throw { code: 500, message: `Failed to delete Admin User with id: ${transaction}` };
      }
    return true;
  }
};

export default AccountServices;
