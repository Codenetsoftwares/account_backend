import { generateTokens } from "../helpers/generateToken.js";
import { Admin } from "../models/admin_user.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Bank } from "../models/bank.model.js";
import { Website } from "../models/website.model.js";
import { BankTransaction } from "../models/banktransaction.model.js";
import { WebsiteTransaction } from "../models/WebsiteTransaction.model.js";
import { EditBankRequest } from "../models/EditBankRequest.model.js";
import { EditWebsiteRequest } from "../models/EditWebsiteRequest.model.js";

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
    const existingUser = await Admin.findOne({ email: data.email }).exec();
    if (existingUser) {
      throw { code: 409, message: `User already exists: ${data.email}` };
    }

    const passwordSalt = await bcrypt.genSalt();
    const encryptedPassword = await bcrypt.hash(data.password, passwordSalt);

    if (!data.firstname) {
      throw { code: 400, message: "Firstname is required" };
    }
    if (!data.lastname) {
      throw { code: 400, message: "Lastname is required" };
    }
    if (!data.email) {
      throw { code: 400, message: "Email is required" };
    }
    if (!data.password) {
      throw { code: 400, message: "Password is required" };
    }
    if (!data.roles || !data.roles.length) {
      throw { code: 400, message: "Roles are required" };
    }

    const newAdmin = new Admin({
      firstname: data.firstname,
      lastname: data.lastname,
      email: data.email,
      password: encryptedPassword,
      roles: data.roles,
    });

    newAdmin.save().catch((err) => {
      console.error(err);
      throw { code: 500, message: "Failed to Save New Admin" };
    });

    return true;
  },

  generateAdminAccessToken: async (email, password, persist) => {
    if (!email) {
      throw { code: 400, message: "Invalid value for: email" };
    }
    if (!password) {
      throw { code: 400, message: "Invalid value for: password" };
    }

    const existingUser = await AccountServices.findAdmin({ email: email });
    if (!existingUser) {
      throw { code: 401, message: "Invalid email address or password" };
    }

    const passwordValid = await bcrypt.compare(password, existingUser.password);
    if (!passwordValid) {
      throw { code: 401, message: "Invalid email address or password" };
    }

    const accessTokenResponse = {
      id: existingUser._id,
      firstname: existingUser.firstname,
      lastname: existingUser.lastname,
      email: existingUser.email,
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
      email: existingUser.email,
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
      throw {code: 404, message: `Bank not found with id: ${id}`};
    }
    
    const updatedTransactionData = {
      id: id._id,
      accountHolderName: data.accountHolderName,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      ifscCode: data.ifscCode,
      upiId: data.upiId,
      upiAppName: data.upiAppName,
      upiNumber:data.upiNumber
    };
    const backupTransaction = new EditBankRequest({...updatedTransactionData, isApproved: false});
    await backupTransaction.save();
    return true;
  },

  updateWebsite: async (id, data) => {
    const existingTransaction = await Website.findById(id);
    if (!existingTransaction) {
      throw {code: 404, message: `Website not found with id: ${id}`};
    }
    
    const updatedTransactionData = {
      id: id._id,
      websiteName: data.websiteName
    };
    const backupTransaction = new EditWebsiteRequest({...updatedTransactionData, isApproved: false});
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
    existingUser.contactNumber =
      data.contactNumber || existingUser.contactNumber;
    existingUser.bankDetail = data.bankDetail || existingUser.bankDetail;
    existingUser.upiDetail = data.upiDetail || existingUser.upiDetail;
    existingUser.webSiteDetail =
      data.webSiteDetail || existingUser.webSiteDetail;

    existingUser.save().catch((err) => {
      console.error(err);
      throw {
        code: 500,
        message: `Failed to update User Profile with id : ${id}`,
      };
    });

    return true;
  },

  updateBankTransaction: async (id, data) => {
    const existingTransaction = await BankTransaction.findById(id);
    if (!existingTransaction) {
      throw {code: 404, message: `Transaction not found with id: ${id}`};
    }
    
    const updatedTransactionData = {
      id: id._id,
      transactionType: data.transactionType,
      remark: data.remark,
      withdrawAmount: data.withdrawAmount,
      depositAmount: data.depositAmount,
      subAdminId: data.subAdminId,
      subAdminName: data.subAdminName,
      beforeBalance : id.currentBalance,
      currentBalance: Number(id.beforeBalance) + Number(data.depositAmount),
      currentBalance : Number(id.currentBalance) - Number(data.withdrawAmount)
    };
    const backupTransaction = new EditBankRequest({...updatedTransactionData, isApproved: false});
    await backupTransaction.save();

    return true;
  },

  updateWebsiteTransaction: async (id, data) => {
    const existingTransaction = await WebsiteTransaction.findById(id);
    if (!existingTransaction) {
      throw {
        code: 404,
        message: `Transaction not found with id: ${id}`,
      };
    }
    const updatedTransactionData = {
      id: id._id,
      transactionType: data.transactionType,
      remark: data.remark,
      withdrawAmount: data.withdrawAmount,
      depositAmount: data.depositAmount,
      subAdminId: data.subAdminId,
      subAdminName: data.subAdminName,
      beforeBalance : id.currentBalance,
      currentBalance: Number(id.beforeBalance) + Number(data.depositAmount),
      currentBalance : Number(id.currentBalance) - Number(data.withdrawAmount)
    };
    const backupTransaction = new EditWebsiteRequest({
      ...updatedTransactionData,
      isApproved: false,
    });
    await backupTransaction.save();

    return true;
  },
};

export default AccountServices;
