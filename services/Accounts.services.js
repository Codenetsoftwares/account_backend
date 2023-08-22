import { generateTokens } from '../helpers/generateToken.js';
import { Admin } from '../models/admin_user.js';
import { User } from '../models/user.model.js';
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import { Bank } from '../models/bank.model.js';
import { Website } from '../models/website.model.js';

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
          role: 'admin',
        });
        return res.send({ status: 200, message: 'success', result: token });
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
      roles: data.roles
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
      role: existingUser.roles
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

  updateBank: async(id, data) => {
    const existingBank = await Bank.findById(id);
    console.log("existingBank", existingBank)
    if (!existingBank) { throw { code: 404, message: `Existing Bank not found with id : ${id}`, };}

    existingBank.accountHolderName = data.accountHolderName || existingBank.accountHolderName;
    existingBank.bankName = data.bankName || existingBank.bankName;
    existingBank.accountNumber = data.accountNumber || existingBank.accountNumber;
    existingBank.ifscCode = data.ifscCode || existingBank.ifscCode;
    existingBank.upiId = data.upiId || existingBank.upiId;
    existingBank.upiAppName = data.upiAppName || existingBank.upiAppName;
    existingBank.upiNumber = data.upiNumber || existingBank.upiNumber;

    existingBank.save().catch((err) => {
      console.error(err);
      throw {
        code: 500,
        message: `Failed to update Bank Name with : ${id}`,
      };
    });
  
    return true;
  },

  updateWebsite: async(id, data) => {
    const existingWebsite = await Website.findById(id);
    console.log("existingWebsite", existingWebsite)
    if (!existingWebsite) { throw { code: 404, message: `Existing Website not found with id : ${id}`, };}

    existingWebsite.websiteName = data.websiteName || existingWebsite.websiteName;

    existingWebsite.save().catch((err) => {
      console.error(err);
      throw {
        code: 500,
        message: `Failed to update Website Name with : ${id}`,
      };
    });
  
    return true;
  },

  updateUserProfile: async(id, data) => {
    const existingUser = await User.findById(id);
    if (!existingUser) { throw { code: 404, message: `Existing User not found with id : ${id}`, };}
    
    existingUser.firstname = data.firstname || existingUser.firstname;
    existingUser.lastname = data.lastname || existingUser.lastname;
    existingUser.contactNumber = data.contactNumber || existingUser.contactNumber;
    existingUser.bankDetail = data.bankDetail || existingUser.bankDetail;
    existingUser.upiDetail = data.upiDetail || existingUser.upiDetail;
    existingUser.webSiteDetail = data.webSiteDetail || existingUser.webSiteDetail;

    existingUser.save().catch((err) => {
      console.error(err);
      throw {
        code: 500,
        message: `Failed to update User Profile with id : ${id}`,
      };
    });
  
    return true;
  }
};

export default AccountServices;
