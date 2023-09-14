import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { User } from "../models/user.model.js";
import { IntroducerUser } from "../models/introducer.model.js"

import dotenv from "dotenv";
import AccountServices from "./Accounts.services.js";
import { Admin } from "../models/admin_user.js";
dotenv.config();

export const userservice = {

  createUser: async (data) => {
    if (!data.firstname) {
      throw { code: 400, message: "Firstname is required" };
    }
    if (!data.lastname) {
      throw { code: 400, message: "Lastname is required" };
    }
    if (!data.userName) {
      throw { code: 400, message: "User Name is required" };
    }
    if (!data.password) {
      throw { code: 400, message: "Password is required" };
    }
    const existingUser = await User.findOne({ userName: data.userName });
    const existingAdminUser = await Admin.findOne({ userName: data.userName });
    const existingIntroUser = await IntroducerUser.findOne({ userName: data.userName });
    if (existingUser) {
      throw { code: 409, message: `User already exists: ${data.userName}` };
    }
    if (existingAdminUser) {
      throw { code: 409, message: `User already exists: ${data.userName}` };
    }
    if (existingIntroUser) {
      throw { code: 409, message: `User already exists: ${data.userName}` };
    }
    const passwordSalt = await bcrypt.genSalt();
    const encryptedPassword = await bcrypt.hash(data.password, passwordSalt);
    // const emailVerificationCode = crypto.randomBytes(6).toString("hex");
    const newUser = new User({
      firstname: data.firstname,
      lastname: data.lastname,
      userName: data.userName,
      contactNumber: data.contactNumber,
      introducerPercentage : data.introducerPercentage,
      introducersUserName : data.introducersUserName,
      password: encryptedPassword,
      wallet: 0,
      // introducersUserId : data.introducersUserId,
      // userId: data.userId,
      // emailVerified: false,
      // tokens: {
      //   emailVerification: emailVerificationCode,
      //   passwordReset: null,
      // },
    });

    newUser.save().catch((err) => {console.error(err); throw { code: 500, message: "Failed to save user" };});
    return true;
  },
  
  createAdminUser: async (data) => {
    const existingUser = await IntroducerUser.findOne({ email: data.email }).exec();
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
  
    const newIntroducerUser = new IntroducerUser({
      firstname: data.firstname,
      lastname: data.lastname,
      email: data.email,
      password: encryptedPassword,
      roles: data.roles,
      introducerId: data.introducerId,
      introducerPercentage: data.introducerPercentage
    });
  
    newIntroducerUser.save().catch((err) => {
      console.error(err);
      throw { code: 500, message: "Failed to Save New Introducer User" };
    });
  
    return true;
  },

  generateRandomAlphanumeric: async(length) => {
    const alphanumericChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * alphanumericChars.length);
      result += alphanumericChars.charAt(randomIndex);
    }
    
    return result;
  },
  
  findUserById: async (id) => {
    if (!id) {
      throw { code: 409, message: "Required parameter: id" };
    }

    return User.findById(id).exec();
  },

  findUser: async (filter) => {
    if (!filter) {
      throw { code: 409, message: "Required parameter: filter" };
    }
    return User.findOne(filter).exec();
  },

  verifyEmail: async (email, code) => {
    const existingUser = await userservice.findUser({ email: email });
    if (!existingUser) throw { code: 404, message: `Invalid user: ${email}` };

    if (existingUser.emailVerified) {
      throw { code: 400, message: `Email already verified for ${email}` };
    }

    if (existingUser.tokens.emailVerification !== code) {
      throw { code: 401, message: `Invalid verification code: ${code}` };
    }

    existingUser.emailVerified = true;
    existingUser.tokens.emailVerification = null;
    existingUser.save();
  },

  generateAccessToken: async (userName, password, persist) => {
    if (!userName) {
      throw { code: 400, message: "Invalid value for: User Name" };
    }
    if (!password) {
      throw { code: 400, message: "Invalid value for: Password" };
    }

    const existingUser = await userservice.findUser({ userName: userName });
    if (!existingUser) {
      throw { code: 401, message: "Invalid User Name  or Password" };
    }

    const passwordValid = await bcrypt.compare(password, existingUser.password);
    if (!passwordValid) {
      throw { code: 401, message: "Invalid User Name or Password" };
    }

    const accessTokenResponse = {
      id: existingUser._id,
      name: existingUser.firstname,
      userName: existingUser.userName,
      role: existingUser.role
    };
    console.log(accessTokenResponse);
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
      role: existingUser.role
    };
  },

  sendResetPasswordEmail: async (email) => {
    const existingUser = await userservice.findUser({ email: email });

    if (!existingUser) {
      throw { code: 409, message: "First Register with Gamex" };
    }

    const emailVerificationCode = await crypto.randomBytes(6).toString("hex");
    existingUser.tokens.passwordReset = emailVerificationCode;
    existingUser.save().catch((err) => {
      console.error(err);
      throw { code: 500, message: "Failed to save new password" };
    });

    nodemailer
      .createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_CLIENTID,
          pass: process.env.SMTP_CLIENTSECRET,
        },
      })
      .sendMail({
        from: `'Customer Relationship Manager' <${process.env.SMTP_SENDER}>`,
        to: email,
        subject: "Password Reset Code",
        text: `The verification code to reset your password is ${emailVerificationCode}. (Note) : If you have not initiated a password reset then contact support as soon as possible. `,
      })
      .catch((err) => {
        console.error(err);
        throw { code: 500, message: "Failed to send verification email" };
      });

    return existingUser;
  },

  UserPasswordResetCode: async (userName, password) => {
    const existingUser = await userservice.findUser({ userName: userName });
  
    const passwordIsDuplicate = await bcrypt.compare(password, existingUser.password);

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

  updateUserProfile: async(id, data) => {
    const existingUser = await User.findById(id);
    if (!existingUser) { throw { code: 404, message: `Existing User not found with id : ${id}`, };}
        
    existingUser.firstname = data.firstname ? data. firstname : existingUser.firstname;
    existingUser.lastname = data.lastname ? data.lastname : existingUser.lastname;
    existingUser.contactNumber = data.contactNumber ? data.contactNumber : existingUser.contactNumber;
    // existingUser.bankDetail = data.bankDetail ? data.bankDetail : existingUser.bankDetail;
    // existingUser.upiDetail = data.upiDetail ? data.upiDetail : existingUser.upiDetail;
    // existingUser.webSiteDetail = data.webSiteDetail ? data.webSiteDetail : existingUser.webSiteDetail;

    existingUser.save().catch((err) => {
      console.error(err);
      throw {
        code: 500,
        message: `Failed to update User Profile with id : ${id}`,
      };
    });
  
    return true;
  },
  
 
};
