import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { IntroducerUser } from '../models/introducer.model.js';
import { Admin } from '../models/admin_user.js';
import { IntroducerTransaction } from '../models/IntroducerTransaction.model.js';
import dotenv from 'dotenv';
import CustomError from '../utils/extendError.js';
import { apiResponseErr, apiResponseSuccess } from '../utils/response.js';
import { statusCode } from '../utils/statusCodes.js';
import AccountServices from './Accounts.services.js';
dotenv.config();

export const introducerUser = {
  introducerLogin: async (req, res) => {
    try {
      const { userName, password, persist } = req.body;

      const accessToken = await introducerUser.generateIntroducerAccessToken(userName, password, persist);

      return apiResponseSuccess({ token: accessToken }, true, statusCode.success, 'Login SuccessFully', res);
    } catch (error) {
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  createintroducerUser: async (req, res) => {
    try {
      const { firstname, lastname, userName, password, role } = req.body;

      const [existingOtherUser, existingUser, existingAdminUser] = await Promise.all([
        IntroducerUser.findOne({ userName: userName }).exec(),
        User.findOne({ userName: userName }),
        Admin.findOne({ userName: userName }),
      ]);

      if (existingUser || existingOtherUser || existingAdminUser) {
        return apiResponseSuccess(null, true, statusCode.exist, `User already exists: ${userName}`, res);
      }

      const passwordSalt = await bcrypt.genSalt();
      const encryptedPassword = await bcrypt.hash(password, passwordSalt);

      const newIntroducerUser = new IntroducerUser({
        firstname: firstname,
        lastname: lastname,
        userName: userName,
        password: encryptedPassword,
        role: role,
      });
      const user = await newIntroducerUser.save();
      return apiResponseSuccess(user, true, statusCode.success, 'Intoducer Register SuccessFully!', res);
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  intorducerPasswordResetCode: async (req, res) => {
    try {
      const { userName, password } = req.body;
      const existingUser = await introducerUser.findIntroducerUser({ userName: userName });

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
      console.log(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  findIntroducerUserById: async (id) => {
    if (!id) {
      throw { code: 409, message: 'Required parameter: id' };
    }

    return IntroducerUser.findById(id).exec();
  },

  findIntroducerUser: async (filter) => {
    if (!filter) {
      throw new CustomError('Required parameter: filter', null, 409);
    }
    return IntroducerUser.findOne(filter).exec();
  },

  generateIntroducerAccessToken: async (userName, password, persist) => {
    const existingUser = await introducerUser.findIntroducerUser({
      userName: userName,
    });
    if (!existingUser) {
      throw new CustomError('Invalid User Name', null, 401);
    }

    const passwordValid = await bcrypt.compare(password, existingUser.password);
    if (!passwordValid) {
      throw new CustomError('Invalid User Password', null, 401);
    }

    const accessTokenResponse = {
      id: existingUser._id,
      name: existingUser.firstname,
      userName: existingUser.userName,
      role: existingUser.role,
    };
    return jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
      expiresIn: persist ? '1y' : '8h',
    });
  },

  introducerPercentageCut: async (req, res) => {
    try {
      const id = req.params.id;
      const { startDate, endDate } = req.body;

      const user = await User.findOne({ id }).exec();
      const userName = user.userName;
      const userId = user.userId;
      const introducerUserId = user.introducersUserId;
      console.log('introducerUserId', introducerUserId);

      const introducerId = await IntroducerUser.findOne({
        id: introducerUserId,
      }).exec();
      console.log('introducerUser', introducerId);
      const introducerid = introducerId.introducerId;
      console.log('introducerid', introducerid);

      // This is Introducer's User's Percentage
      const introducerpercent = user.introducerPercentage;

      const transDetails = user.transactionDetail;

      const selectedStartDate = new Date(startDate);
      const selectedEndDate = new Date(endDate);

      const transactionsWithin7Days = transDetails.filter((transaction) => {
        const transDate = new Date(transaction.createdAt);
        return transDate >= selectedStartDate && transDate <= selectedEndDate;
      });

      let totalDep = 0;
      let totalWith = 0;

      transactionsWithin7Days.map((res) => {
        if (res.transactionType === 'Deposit') {
          totalDep += Number(res.amount);
        }
        if (res.transactionType === 'Withdraw') {
          totalWith += Number(res.amount);
        }
      });

      if (totalDep <= totalWith) {
        throw { message: "Can't send amount to Introducer" };
      }
      const date = new Date();
      let amount = 0;
      const transactionType = 'Credit';
      if (totalDep > totalWith) {
        let diff = totalDep - totalWith;
        amount = (introducerpercent / 100) * diff;
        introducerId.wallet += amount;
      }
      introducerId.creditTransaction.push({
        date,
        transactionType,
        amount,
        userId,
        userName,
      });
      const introducerUser = await introducerId.save();
      return apiResponseSuccess(
        introducerUser,
        true,
        statusCode.success,
        'Introducer Percentage Transferred successfully!',
        res,
      );
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  updateIntroducerProfile: async (req, res) => {
    try {
      const id = req.params.id;
      const { firstname, lastname } = req.body;
      const existingUser = await IntroducerUser.findById(id);
      if (!existingUser) {
        return apiResponseErr(null,false,statusCode.notFound,` User not found with id : ${id}`,res)
      }

      existingUser.firstname = firstname || existingUser.firstname;
      existingUser.lastname = lastname || existingUser.lastname;

      const user = await existingUser.save();
      return apiResponseSuccess(user, true, statusCode.success, 'Profile Update Successfully!', res);
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  introducerLiveBalance: async (id) => {
    try {
      const introId = await IntroducerUser.findById(id).exec();
      if (!introId) {
        throw new CustomError(`Introducer  ID  not found`, null, 404);
      }

      const IntroducerId = introId.userName;

      // Check if IntroducerId exists in any of the introducer user names
      const userIntroId = await User.find({
        $or: [
          { introducersUserName: IntroducerId },
          { introducersUserName1: IntroducerId },
          { introducersUserName2: IntroducerId },
        ],
      }).exec();

      if (userIntroId.length === 0) {
        return 0;
      }

      let liveBalance = 0;
      for (const user of userIntroId) {
        let matchedIntroducersUserName, matchedIntroducerPercentage;

        if (user.introducersUserName === IntroducerId) {
          matchedIntroducersUserName = user.introducersUserName;
          matchedIntroducerPercentage = user.introducerPercentage;
        } else if (user.introducersUserName1 === IntroducerId) {
          matchedIntroducersUserName = user.introducersUserName1;
          matchedIntroducerPercentage = user.introducerPercentage1;
        } else if (user.introducersUserName2 === IntroducerId) {
          matchedIntroducersUserName = user.introducersUserName2;
          matchedIntroducerPercentage = user.introducerPercentage2;
        }

        const transDetails = user.transactionDetail;

        if (!transDetails || transDetails.length === 0) {
          continue;
        }

        let totalDep = 0;
        let totalWith = 0;

        transDetails?.forEach((res) => {
          if (res.transactionType === 'Deposit') {
            totalDep += Number(res.amount);
          }
          if (res.transactionType === 'Withdraw') {
            totalWith += Number(res.amount);
          }
        });

        let amount = 0;
        if (totalDep > totalWith) {
          let diff = totalDep - totalWith;
          amount = (matchedIntroducerPercentage / 100) * diff;
        } else {
          let diff = totalDep - totalWith;
          amount = (matchedIntroducerPercentage / 100) * diff;
        }

        liveBalance += amount;
      }

      return Math.round(liveBalance);
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  introducerPasswordResetCode: async (req, res) => {
    try {
      const { userName, oldPassword, password } = req.body;

      const existingUser = await introducerUser.findIntroducerUser({ userName });

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
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  getInteroducerUserName: async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await User.findById(userId).exec();

      if (!user) {
        throw new CustomError('User not found', null, 404);
      }
      const introducersUserName = await user.introducersUserName;
      return apiResponseSuccess(
        introducersUserName,
        true,
        statusCode.success,
        "Introducer's username retrieved successfully",
        res,
      );
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  accountSummary: async (req, res) => {
    try {
      const id = req.params.id;
      const introSummary = await IntroducerTransaction.find({ introUserId: id }).sort({ createdAt: -1 }).exec();

      if (!introSummary || introSummary.length === 0) {
        throw new CustomError(`Introducer Transaction Not Found with ID ${id}`, null, 404);
      }
      let balances = 0;
      let accountData = JSON.parse(JSON.stringify(introSummary));
      accountData
        .slice(0)
        .reverse()
        .map((data) => {
          if (data.transactionType === 'Deposit') {
            balances += data.amount;
            data.balance = balances;
          } else {
            balances -= data.amount;
            data.balance = balances;
          }
        });

      return apiResponseSuccess(accountData, true, statusCode.success, 'Account summary retrieved successfully', res);
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  // interoducerLiveBalance: async (req, res) => {
  //   try {
  //     const id = await IntroducerUser.findById(req.params.id);
  //     if (!id) {

  //       throw new CustomError(`Introducer  ID  not found`, null, 404);
  //     }
  //     console.log('id', id);
  //     const data = await introducerUser.introducerLiveBalance();
  //     console.log('data', data);
  //     return apiResponseSuccess({ LiveBalance: data }, true, statusCode.success, 'Balance Fetched SuccessFully!', res);
  //   } catch (error) {
  //     console.error(error);
  //     return apiResponseErr(null, false,  statusCode.internalServerError, error.message, res);
  //   }
  // },

  getInroducerProfile: async (req, res) => {
    try {
      const userId = req.user;
      const user = await IntroducerUser.findById(userId).exec();
      const introUserId = user._id;
      console.log('introUserId', introUserId);
      const TPDLT = await AccountServices.IntroducerBalance(introUserId);
      const response = {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        userName: user.userName,
        balance: TPDLT,
      };
      const liveBalance = await introducerUser.introducerLiveBalance(introUserId);
      const currentDue = liveBalance - response.balance;
      response.currentDue = currentDue;
      return apiResponseSuccess(response, true, statusCode.success, 'Introducer Profile Retrived Successfully!', res);
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  getIntroducerClientData: async (req, res) => {
    try {
      const id = req.params.id;
      const introducer = await IntroducerUser.findById(id).exec();

      if (!introducer) {
        return apiResponseErr(null, false, statusCode.notFound, 'Introducer not found', res);
      }

      const intoducerId = introducer.userName;
      const introducerUser = await User.find({
        introducersUserName: intoducerId,
      }).exec();

      return apiResponseSuccess(
        introducerUser,
        true,
        statusCode.success,
        'Successfully retrieved introducer clients',
        res,
      );
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  getSingleIntroducer: async (req, res) => {
    try {
      const id = req.params.id;
      const bankData = await IntroducerUser.findOne({ _id: id }).exec();

      if (!bankData) {
        return apiResponseErr(null, false, statusCode.notFound, 'Introducer not found', res);
      }

      return apiResponseSuccess(bankData, true, statusCode.success, 'Successfully retrieved introducer', res);
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  getIntroducerUserData: async (req, res) => {
    try {
      const id = req.params.id;
      const intoducer = await IntroducerUser.findById(id).exec();

      if (!intoducer) {
        return apiResponseErr(null, false, statusCode.notFound, 'Introducer user not found.', res);
      }
      const intoducerId = intoducer.introducerId;
      const introducerUser = await User.find({ introducersUserId: intoducerId }).exec();

      if (!introducerUser || introducerUser.length === 0) {
        return apiResponseErr(
          null,
          false,
          statusCode.notFound,
          'No users found for the given introducer user ID.',
          res,
        );
      }

      return apiResponseSuccess(
        introducerUser,
        true,
        statusCode.success,
        'Introducer User Data fetched Successfully!',
        res,
      );
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  getListIntroducerUser: async (req, res) => {
    try {
      const id = req.params.id;
      const introducerUser = await IntroducerUser.findById(id, 'userName').exec();
      if (!introducerUser) {
        return apiResponseErr(null, false, statusCode.badRequest, 'Introducer User Not Found', res);
      }

      // Fetch users with introducer names matching any of the three fields
      const users = await User.find({
        $or: [
          { introducersUserName: introducerUser.userName },
          { introducersUserName1: introducerUser.userName },
          { introducersUserName2: introducerUser.userName },
        ],
      }).exec();

      return apiResponseSuccess(users, true, statusCode.success, 'Users fetched successfully', res);
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  getIntroducerUserSingleData: async (req, res) => {
    try {
      const id = req.params.id;
      const user = req.user;
      const introUser = user.userName;
      const introducerUser = await User.findById(id).exec();

      // Check if introducerUser exists
      if (!introducerUser) {
        return apiResponseErr(null, false, statusCode.badRequest, 'user not Found', res);
      }

      let filteredIntroducerUser = {
        _id: introducerUser._id,
        firstname: introducerUser.firstname,
        lastname: introducerUser.lastname,
        userName: introducerUser.userName,
        wallet: introducerUser.wallet,
        role: introducerUser.role,
        webSiteDetail: introducerUser.webSiteDetail,
        transactionDetail: introducerUser.transactionDetail,
      };

      let matchedIntroducersUserName = null;
      let matchedIntroducerPercentage = null;

      // Check if req.user.UserName exists in introducerUser's introducersUserName, introducersUserName1, or introducersUserName2 fields
      if (introducerUser.introducersUserName === introUser) {
        matchedIntroducersUserName = introducerUser.introducersUserName;
        matchedIntroducerPercentage = introducerUser.introducerPercentage;
      } else if (introducerUser.introducersUserName1 === introUser) {
        matchedIntroducersUserName = introducerUser.introducersUserName1;
        matchedIntroducerPercentage = introducerUser.introducerPercentage1;
      } else if (introducerUser.introducersUserName2 === introUser) {
        matchedIntroducersUserName = introducerUser.introducersUserName2;
        matchedIntroducerPercentage = introducerUser.introducerPercentage2;
      }

      // If matched introducersUserName found, include it along with percentage in the response
      if (matchedIntroducersUserName) {
        filteredIntroducerUser.matchedIntroducersUserName = matchedIntroducersUserName;
        filteredIntroducerUser.introducerPercentage = matchedIntroducerPercentage;
        return apiResponseSuccess(
          filteredIntroducerUser,
          true,
          statusCode.success,
          'User details fetched successfully.',
          res,
        );
      } else {
        return apiResponseErr(
          null,
          false,
          statusCode.badRequest,
          'The requested introducer does not match any introducer records for this user.',
          res,
        );
      }
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, statusCode.success, error.message, res);
    }
  },

  getIntroducerLiveBalance: async (req, res) => {
    try {
      const id = await IntroducerUser.findById(req.params.id);

      if (!id) {
        return apiResponseErr(null, false, statusCode.badRequest, 'User Not found', res);
      }
      const data = await introducerUser.introducerLiveBalance(id);
      return apiResponseSuccess({ LiveBalance: data }, true, statusCode.success, 'Balance fetched Successfully!', res);
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  getIntroducerAccountSummary: async (req, res) => {
    try {
      const id = req.params.id;
      const introSummary = await IntroducerTransaction.findById(id).sort({ createdAt: 1 }).exec();

      if (!introSummary) {
        return apiResponseErr(null, false, statusCode.notFound, 'Account Summary Not Found', res);
      }
      return apiResponseSuccess(introSummary, true, statusCode.success, 'Account Summary Fetched Successfully!', res);
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },

  getIntroducerUserAccountSummary: async (req, res) => {
    try {
      const id = req.params.introducerUsername;
      const introSummary = await User.find({ introducersUserName: id }).sort({ createdAt: 1 }).exec();

      if (introSummary.length === 0) {
        return apiResponseErr(null, false, statusCode.notFound, 'User Name Not Found', res);
      }

      const formattedIntroSummary = {
        transaction: introSummary.flatMap((user) => user.transactionDetail),
      };
      return apiResponseSuccess(
        formattedIntroSummary,
        true,
        statusCode.success,
        'Account Summary fetched Successfully!',
        res,
      );
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
    }
  },
};
