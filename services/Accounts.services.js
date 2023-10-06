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
    const bankTransactions = await BankTransaction.find({
      bankId: bankId,
    }).exec();
    const transactions = await Transaction.find({ bankId: bankId }).exec();
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
        const totalBalance =
          balance - transaction.bankCharges - transaction.amount;
        balance = totalBalance;
      }
    });

    return balance;
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
        balance =
          Number(balance) -
          Number(transactions.bonus) -
          Number(transactions.amount);
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
      throw { code: 404, message: `Existing User not found with id : ${id}` };
    }

    existingUser.firstname = data.firstname || existingUser.firstname;
    existingUser.lastname = data.lastname || existingUser.lastname;
    existingUser.contactNumber = data.contactNumber || existingUser.contactNumber;
    existingUser.bankDetail = data.bankDetail || existingUser.bankDetail;
    existingUser.upiDetail = data.upiDetail || existingUser.upiDetail;
    existingUser.introducerPercentage = data.introducerPercentage || existingUser.introducerPercentage;
    existingUser.introducersUserName = data.introducersUserName || existingUser.introducersUserName;
    existingUser.webSiteDetail = data.webSiteDetail || existingUser.webSiteDetail;

    await existingUser.save().catch((err) => {
      console.error(err);
      throw {
        code: 500,
        message: `Failed to update User Profile with id : ${id}`,
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

  deleteBankTransaction: async (id) => {
    const existingTransaction = await BankTransaction.findById(id);
    if (!existingTransaction) {
      throw { code: 404, message: `Transaction not found with id: ${id}` };
    }
    const existingEditRequest = await EditRequest.findOne({
      id: id,
      type: "Delete",
    });
    if (existingEditRequest) {
      throw { code: 409, message: "Delete Request Already Sent For Approval" };
    }

    const updatedTransactionData = {
      id: id._id,
      transactionType: id.transactionType,
      remarks: id.remarks,
      withdrawAmount: id.withdrawAmount,
      depositAmount: id.depositAmount,
      subAdminId: id.subAdminId,
      subAdminName: id.subAdminName,
      accountHolderName: id.accountHolderName,
      bankName: id.bankName,
      accountNumber: id.accountNumber,
      ifscCode: id.ifscCode,
    };
    const editMessage = `${updatedTransactionData.transactionType} is sent to Super Admin for deleting approval`;
    await createEditRequest(updatedTransactionData, editMessage);
    async function createEditRequest(updatedTransactionData, editMessage) {
      const backupTransaction = new EditRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        type: "Delete",
      });
      await backupTransaction.save();
    }
    return true;
  },

  deleteWebsiteTransaction: async (id) => {
    const existingTransaction = await WebsiteTransaction.findById(id);
    if (!existingTransaction) {
      throw {
        code: 404,
        message: `Website Transaction not found with id: ${id}`,
      };
    }
    const existingEditRequest = await EditRequest.findOne({
      id: id,
      type: "Delete",
    });
    if (existingEditRequest) {
      throw {
        code: 409,
        message: "Delete Request Already Sent For Approval",
      };
    }
    const updatedTransactionData = {
      id: id._id,
      transactionType: id.transactionType,
      remarks: id.remarks,
      withdrawAmount: id.withdrawAmount,
      depositAmount: id.depositAmount,
      subAdminId: id.subAdminId,
      subAdminName: id.subAdminName,
      websiteName: id.websiteName,
    };
    const editMessage = `${updatedTransactionData.transactionType} is sent to Super Admin for deleting approval`;
    await createEditRequest(updatedTransactionData, editMessage);
    async function createEditRequest(updatedTransactionData, editMessage) {
      const backupTransaction = new EditRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        type: "Delete",
      });
      await backupTransaction.save();
    }

    return true;
  },

  deleteTransaction: async (id) => {
    const existingTransaction = await Transaction.findById(id);
    if (!existingTransaction) {
      throw { code: 404, message: `Transaction not found with id: ${id}` };
    }
    const existingEditRequest = await EditRequest.findOne({
      id: id,
      type: "Delete",
    });
    if (existingEditRequest) {
      throw {
        code: 409,
        message: "Delete Request Already Sent For Approval",
      };
    }
    const updatedTransactionData = {
      id: id._id,
      transactionID: id.transactionID,
      transactionType: id.transactionType,
      remarks: id.remarks,
      amount: id.amount,
      subAdminId: id.subAdminId,
      userId: id.userId,
      paymentMethod: id.paymentMethod,
      websiteName: id.websiteName,
      bankName: id.bankName,
      amount: id.amount,
      bonus: id.bonus,
      bankCharges: id.bankCharges,
    };
    const editMessage = `${updatedTransactionData.transactionType} is sent to Super Admin for deleting approval`;
    await createEditRequest(updatedTransactionData, editMessage);
    async function createEditRequest(updatedTransactionData, editMessage) {
      const backupTransaction = new EditRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
        type: "Delete",
      });
      await backupTransaction.save();
    }
    return true;
  },

  deleteIntroducerTransaction: async (id) => {
    const existingTransaction = await IntroducerTransaction.findById(id);
    if (!existingTransaction) {
      throw { code: 404, message: `Transaction not found with id: ${id}` };
    }
    const existingEditRequest = await IntroducerEditRequest.findOne({
      id: id,
      type: "Delete",
    });
    if (existingEditRequest) {
      throw { code: 409, message: "Delete Request Already Sent For Approval" };
    }

    const updatedTransactionData = {
      id: id._id,
      transactionType: id.transactionType,
      remarks: id.remarks,
      subAdminId: id.subAdminId,
      subAdminName: id.subAdminName,
      amount: id.amount,
      introducerUserName: id.introducerUserName
    };
    const editMessage = `Introducer ${updatedTransactionData.transactionType} is sent to Super Admin for deleting approval`;
    await createEditRequest(updatedTransactionData, editMessage);
    async function createEditRequest(updatedTransactionData, editMessage) {
      const backupTransaction = new IntroducerEditRequest({
        ...updatedTransactionData,
        isApproved: false,
        message: editMessage,
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
};

export default AccountServices;
