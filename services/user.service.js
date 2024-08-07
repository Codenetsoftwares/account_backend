import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { User } from '../models/user.model.js';
import { IntroducerUser } from '../models/introducer.model.js';
import dotenv from 'dotenv';
import { Admin } from '../models/admin_user.js';
import { apiResponseErr, apiResponsePagination, apiResponseSuccess } from '../utils/response.js';
import { statusCode } from '../utils/statusCodes.js';
import CustomError from '../utils/extendError.js';
import { Transaction } from '../models/transaction.js';
import AccountServices from './Accounts.services.js';
dotenv.config();

export const userService = {
  createUser: async (req, res) => {
    try {
      const {
        firstname,
        lastname,
        userName,
        password,
        contactNumber,
        introducersUserName,
        introducersUserName1,
        introducersUserName2,
        introducerPercentage,
        introducerPercentage1,
        introducerPercentage2,
      } = req.body;
      const [existingUser, existingAdminUser, existingIntroUser] = await Promise.all([
        User.findOne({ userName: userName }).exec(),
        Admin.findOne({ userName: userName }).exec(),
        IntroducerUser.findOne({ userName: userName }).exec(),
      ]);

      if (existingUser || existingAdminUser || existingIntroUser) {
        throw new CustomError(`User already exists: ${userName}`, null, 409);
      }

      const passwordSalt = await bcrypt.genSalt();
      const encryptedPassword = await bcrypt.hash(password, passwordSalt);
      const newUser = new User({
        firstname: firstname,
        lastname: lastname,
        userName: userName,
        contactNumber: contactNumber,
        introducerPercentage: introducerPercentage,
        introducersUserName: introducersUserName,
        introducerPercentage1: introducerPercentage1,
        introducersUserName1: introducersUserName1,
        introducerPercentage2: introducerPercentage2,
        introducersUserName2: introducersUserName2,
        password: encryptedPassword,
        wallet: 0,
      });

      const createdUser = await newUser.save();
      return apiResponseSuccess(createdUser, true, statusCode.create, 'User registered successfully!', res);
    } catch (error) {
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  createAdminUser: async (data) => {
    const existingUser = await IntroducerUser.findOne({ email: data.email }).exec();
    if (existingUser) {
      throw { code: 409, message: `User already exists: ${data.email}` };
    }

    const passwordSalt = await bcrypt.genSalt();
    const encryptedPassword = await bcrypt.hash(data.password, passwordSalt);

    if (!data.firstname) {
      throw { code: 400, message: 'Firstname is required' };
    }
    if (!data.lastname) {
      throw { code: 400, message: 'Lastname is required' };
    }
    if (!data.email) {
      throw { code: 400, message: 'Email is required' };
    }
    if (!data.password) {
      throw { code: 400, message: 'Password is required' };
    }

    const newIntroducerUser = new IntroducerUser({
      firstname: data.firstname,
      lastname: data.lastname,
      email: data.email,
      password: encryptedPassword,
      roles: data.roles,
      introducerId: data.introducerId,
      introducerPercentage: data.introducerPercentage,
    });

    newIntroducerUser.save().catch((err) => {
      console.error(err);
      throw { code: 500, message: 'Failed to Save New Introducer User' };
    });

    return true;
  },

  generateRandomAlphanumeric: async (length) => {
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
      throw { code: 409, message: 'Required parameter: id' };
    }

    return User.findById(id).exec();
  },

  findUser: async (filter) => {
    if (!filter) {
      throw new CustomError('Required parameter: filter', null, statusCode.exist);
    }
    return await User.findOne(filter).exec();
  },

  verifyEmail: async (req, res) => {
    try {
      const { email, code } = req.body;
      const existingUser = await userService.findUser({ email: email });
      if (!existingUser) {
        return apiResponseErr(null, true, statusCode.badRequest, `Invalid user: ${email}`, res);
      }

      if (existingUser.emailVerified) {
        return apiResponseErr(null, true, statusCode.badRequest, `Email already verified for ${email}`, res);
      }

      if (existingUser.tokens.emailVerification !== code) {
        return apiResponseErr(null, true, statusCode.badRequest, `Invalid verification code: ${code}`, res);
      }

      existingUser.emailVerified = true;
      existingUser.tokens.emailVerification = null;
      const result = await existingUser.save();
      return apiResponseSuccess(result, true, statusCode.create, 'Email verified Successfully', res);
    } catch (error) {
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  generateAccessToken: async (req, res) => {
    try {
      const { userName, password, persist } = req.body;

      const existingUser = await userService.findUser({ userName: userName });
      if (!existingUser) {
        return apiResponseErr(null, true, statusCode.badRequest, 'Invalid User Name', res);
      }

      const passwordValid = await bcrypt.compare(password, existingUser.password);
      if (!passwordValid) {
        return apiResponseErr(null, true, statusCode.badRequest, 'Invalid Password', res);
      }
      const user = await User.findOne({ userName: userName });
      if (!user) {
        throw new CustomError('User not found', null, statusCode.badRequest);
      }
      const balance = user.wallet;

      const accessTokenResponse = {
        id: existingUser._id,
        name: existingUser.firstname,
        userName: existingUser.userName,
        role: existingUser.role,
        balance: balance,
      };
      const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
        expiresIn: persist ? '1y' : '8h',
      });
      return apiResponseSuccess(
        {
          userName: existingUser.userName,
          accessToken: accessToken,
          role: existingUser.role,
          balance: balance,
        },
        true,
        statusCode.success,
        'User login Successfully',
        res,
      );
    } catch (error) {
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  sendResetPasswordEmail: async (req, res) => {
    try {
      const { email } = req.body;
      const existingUser = await userService.findUser({ email: email });

      if (!existingUser) {
        throw new CustomError('First Register with Gamex', null, statusCode.exist);
      }

      const emailVerificationCode = crypto.randomBytes(6).toString('hex');
      existingUser.tokens.passwordReset = emailVerificationCode;
      existingUser.save().catch((err) => {
        throw new CustomError('Failed to save new password', null, statusCode.badRequest);
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
          subject: 'Password Reset Code',
          text: `The verification code to reset your password is ${emailVerificationCode}. (Note) : If you have not initiated a password reset then contact support as soon as possible. `,
        });
      return apiResponseSuccess(existingUser, true, statusCode.success, 'Password Reset Code Sent', res);
    } catch (error) {
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  updateBankDetails: async (req, res) => {
    try {
      const { accountHolderName, bankName, ifscCode, accountNumber } = req.body;
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return apiResponseErr(null, true, statusCode.badRequest, 'User not found.', res);
      }

      user.bankDetail.accountHolderName = accountHolderName;
      user.bankDetail.bankName = bankName;
      user.bankDetail.ifscCode = ifscCode;
      user.bankDetail.accountNumber = accountNumber;

      const bankDetails = await user.save();
      return apiResponseSuccess(bankDetails, true, statusCode.success, 'Bank details updated successfully.', res);
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  addWebsiteDetails: async (req, res) => {
    try {
      const { websiteName } = req.body;
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return apiResponseErr(null, true, statusCode.badRequest, 'User not found.', res);
      }

      const newWebsiteDetail = {
        websiteName: websiteName,
      };

      user.webSiteDetail.push(newWebsiteDetail);
      const response = await user.save();
      return apiResponseSuccess(response, true, statusCode.success, 'Website details updated successfully.', res);
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  updateUpiDetails: async (req, res) => {
    try {
      const { upiId, upiApp, upiNumber } = req.body;
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return apiResponseErr(null, true, statusCode.badRequest, 'User not found.', res);
      }

      user.upiDetail.upiId = upiId;
      user.upiDetail.upiApp = upiApp;
      user.upiDetail.upiNumber = upiNumber;
      const response = await user.save();
      return apiResponseSuccess(response, true, statusCode.success, 'UPI details updated successfully.', res);
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  UserPasswordResetCode: async (req, res) => {
    try {
      const { userName, password } = req.body;
      const existingUser = await userService.findUser({ userName: userName });

      if (!existingUser) {
        throw new CustomError('User not found', null, 404);
      }

      const passwordIsDuplicate = await bcrypt.compare(password, existingUser.password);

      if (passwordIsDuplicate) {
        throw new CustomError('New Password cannot be the same as existing password', null, 409);
      }

      const passwordSalt = await bcrypt.genSalt();
      const encryptedPassword = await bcrypt.hash(password, passwordSalt);

      existingUser.password = encryptedPassword;
      const user = await existingUser.save();
      return apiResponseSuccess(user, true, statusCode.success, 'Password Reset Successfully!', res);
    } catch (error) {
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  updateUserProfile: async (req, res) => {
    try {

      let existingUser = await User.findById( req.params.id);

      if (!existingUser) {
        return apiResponseErr(null, true, statusCode.notFound, `Existing User not found with id: ${id}`, res);
      }

      existingUser = {...existingUser, ...req.body}

      const updateUserProfile = await existingUser.save();

      return apiResponseSuccess(updateUserProfile, true, statusCode.success, 'Profile updated', res);
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  getUserProfileData: async (req, res) => {
    try {
      const userId = req.params.userId;
      const userData = await User.findById(userId).sort({ createdAt: 1 }).exec();

      if (!userData) {
        return apiResponseErr(null, true, statusCode.badRequest, 'User not found', res);
      }

      return apiResponseSuccess(userData, true, statusCode.success, 'User data retrieved successfully', res);
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  userPasswordResetCode: async (req, res) => {
    try {
      const { userName, oldPassword, password } = req.body;
      const existingUser = await User.findOne({ userName });
      if (!existingUser) {
        return apiResponseErr(null, true, statusCode.badRequest, 'User not found', res);
      }
      const oldPasswordIsCorrect = await bcrypt.compare(oldPassword, existingUser.password);
      if (!oldPasswordIsCorrect) {
        return apiResponseErr(null, true, statusCode.unauthorize, 'Invalid old password', res);
      }

      const passwordIsDuplicate = await bcrypt.compare(password, existingUser.password);
      if (passwordIsDuplicate) {
        throw new CustomError('New Password cannot be the same as existing password', null, 409);
      }
      const passwordSalt = await bcrypt.genSalt();
      const encryptedPassword = await bcrypt.hash(password, passwordSalt);

      existingUser.password = encryptedPassword;
      const passwordReset = await existingUser.save();

      return apiResponseSuccess(passwordReset, true, statusCode.success, 'Password reset successful!', res);
    } catch (error) {
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  getUserProfiles: async (req, res) => {
    try {
      const page = parseInt(req.params.page, 10) || 1;
      const limit = 10; 
      const searchQuery = req.query.search;
      let userProfiles = [];
      let totalItems = 0;

      if (searchQuery) {
        const users = await User.find({
          userName: { $regex: new RegExp(searchQuery, 'i') },
        }).exec();
        userProfiles = users;
        totalItems = users.length;
      } else {
        const allUsers = await User.find({}).exec();
        totalItems = allUsers.length;
        const startIndex = (page - 1) * limit;
        const endIndex = Math.min(startIndex + limit, totalItems);
        userProfiles = allUsers.slice(startIndex, endIndex);
      }

      if (userProfiles.length === 0) {
        return apiResponseErr(null, false, statusCode.badRequest, 'No data found for the selected criteria.', res);
      }

      const totalPages = Math.ceil(totalItems / limit);

      return apiResponsePagination(
        userProfiles,
        true,
        statusCode.success,
        'User profiles retrieved successfully',
        {
          page,
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

  deleteUserAndTransactions: async (req, res) => {
    try {
      const userName = req.params.userName;
      await Transaction.deleteMany({ userName });
      const deleteUser = await User.findOneAndDelete({ userName });
      if (!deleteUser) {
        return apiResponseErr(null, true, statusCode.notFound, 'User not found', res);
      }
      const result = await deleteUserAndTransactions(userName);
      return apiResponseSuccess(
        result,
        true,
        statusCode.success,
        'User and associated transactions deleted successfully',
        res,
      );
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

    updateUserNameAndTransactions: async (req, res) => {
    try {
      const userName = req.params.userName;
      const newUserName = req.body.newUserName;
      const userToUpdate = await User.findOne({ userName: userName });
      if (!userToUpdate) {
        return apiResponseErr(null, true, statusCode.notFound, 'User not found', res);
      }

      userToUpdate.userName = newUserName;
      const userUpdate = await userToUpdate.save();
      const transactions = await Transaction.find({ userName: userName });
      const transactionResponses = await Promise.all(
        transactions.map(async (transaction) => {
          transaction.userName = newUserName;
          return transaction.save();
        }),
      );
      return apiResponseSuccess(
        { userUpdate, transactionResponses },
        true,
        statusCode.success,
        'User username and associated transactions updated successfully',
        res,
      );
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  superAdminLogin: async (req, res) => {
    try {
      const { userName, password, persist } = req.body;

      const user = await Admin.findOne({ userName: userName });
      if (!user) {
        return apiResponseErr(null, true, statusCode.badRequest, 'User not found', res);
      }

      const accessToken = await AccountServices.generateAdminAccessToken(userName, password, persist);

      if (!accessToken) {
        return apiResponseErr(null, true, statusCode.badRequest, 'Failed to generate access token', res);
      }
      return apiResponseSuccess({ token: accessToken }, true, statusCode.success, 'Login successfully', res);
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },
};
