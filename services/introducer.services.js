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
      if (!userName) {
        //throw { code: 400, message: 'User Name is required' };
        throw new CustomError('User Name is required', null, 400);
      }

      if (!password) {
        //throw { code: 400, message: 'Password is required' };
        throw new CustomError('Password is required', null, 400);
      }
      const accessToken = await introducerUser.generateIntroducerAccessToken(userName, password, persist);

      if (!accessToken) {
        //throw { code: 500, message: 'Failed to generate access token' };
        throw new CustomError('Failed to generate access token', null, responseCode);
      }
      const user = await IntroducerUser.findOne({ userName: userName });
      if (!user) {
        //throw { code: 404, message: 'User not found' };
        throw new CustomError('User not found', null, 404);
      }
      if (user && accessToken) {
        // res.status(200).send({
        //   token: accessToken,
        // });
        return apiResponseSuccess({ token: accessToken }, true, statusCode.success, 'Login SuccessFully', res);
      } else {
        res.status(404).json({ error: 'User not found or access token is invalid' });
      }
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  createintroducerUser: async (req, res) => {
    try{
      const {firstname,lastname,userName,password, role} = req.body;

    const [existingOtherUser, existingUser, existingAdminUser] = await Promise.all([
      IntroducerUser.findOne({ userName: userName }).exec(),
      User.findOne({ userName: userName }),
      Admin.findOne({ userName: userName }),
    ]);
    
    if (existingUser || existingOtherUser || existingAdminUser) {
      return apiResponseSuccess(null,true,statusCode.exist,`User already exists: ${userName}`, res)
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
      return apiResponseSuccess(user, true, statusCode.success,"Intoducer Register SuccessFully!", res)
    } catch (error) {
      console.error(error);
      return apiResponseErr(
        null,
        false,
        statusCode.internalServerError,
        error.message,
        res
      )
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
      throw { code: 409, message: 'Required parameter: filter' };
    }
    return IntroducerUser.findOne(filter).exec();
  },

  generateIntroducerAccessToken: async (userName, password, persist) => {
    if (!userName) {
      throw { code: 400, message: 'Invalid value for: User Name' };
    }
    if (!password) {
      throw { code: 400, message: 'Invalid value for: password' };
    }

    const existingUser = await introducerUser.findIntroducerUser({
      userName: userName,
    });
    if (!existingUser) {
      throw { code: 401, message: 'Invalid User Name or password' };
    }

    const passwordValid = await bcrypt.compare(password, existingUser.password);
    if (!passwordValid) {
      throw { code: 401, message: 'Invalid User Name or password' };
    }

    const accessTokenResponse = {
      id: existingUser._id,
      name: existingUser.firstname,
      userName: existingUser.userName,
      role: existingUser.role,
    };
    console.log(accessTokenResponse);
    const accessToken = jwt.sign(accessTokenResponse, process.env.JWT_SECRET_KEY, {
      expiresIn: persist ? '1y' : '8h',
    });

    return {
      userName: existingUser.userName,
      accessToken: accessToken,
    };
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
        throw new CustomError(` User not found with id : ${id}`, null, 404);
      }

      existingUser.firstname = firstname || existingUser.firstname;
      existingUser.lastname = lastname || existingUser.lastname;

      const user = await existingUser.save();
      return apiResponseSuccess(user, true, statusCode.success, 'Profile Update Successfully!', res);
    } catch (error) {
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  introducerLiveBalance: async (req, res) => {
    try {
      const id = req.params.id;
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

      
      const balance =  Math.round(liveBalance)
      return apiResponseSuccess({ LiveBalance: balance }, true, statusCode.success, 'Balance Fetched SuccessFully!', res);
    } catch (error) {
      console.error(error);
      return apiResponseErr(null,
        false,
        error.responseCode ?? statusCode.internalServerError,
        error.message,
        res
      )
    }
  },

  introducerPasswordResetCode: async (userName, oldPassword, password) => {
    const existingUser = await introducerUser.findIntroducerUser({
      userName: userName,
    });

    const oldPasswordIsCorrect = await bcrypt.compare(oldPassword, existingUser.password);

    if (!oldPasswordIsCorrect) {
      throw {
        code: 401,
        message: 'Invalid old password',
      };
    }

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
      // console.log("userId", userId);
      const user = await IntroducerUser.findById(userId).exec();
      // console.log("user", user);
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
      //res.status(201).send(response);
      return apiResponseSuccess(response, true, statusCode.success, 'Introducer Profile Retrived Successfully!', res);
    } catch (error) {
      console.error(error);
      return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
    }
  },

  getIntroducerClientData :  async (req, res) => {
    try {
      const id = req.params.id;
      const introducer = await IntroducerUser.findById(
        id).exec();

      if (!introducer) {
        return apiResponseErr(null, false, statusCode.notFound, 'Introducer not found', res);
      }

      const intoducerId = introducer.userName;
      const introducerUser = await User.find({
        introducersUserName: intoducerId,
      }).exec();

     
      return apiResponseSuccess(introducerUser, true, statusCode.success, "Successfully retrieved introducer clients", res)
    } catch (error) {
      console.error(error);
      return apiResponseErr(
        null,
        false,
        statusCode.internalServerError,
        error.message,
        res
      )
    }
  },

  getSingleIntroducer :   async (req, res) => {
    try {
      const id = req.params.id;
      const bankData = await IntroducerUser.findOne({ _id: id }).exec();

      if (!bankData) {
        return apiResponseErr(null, false, statusCode.notFound, 'Introducer not found', res);
      }

      return apiResponseSuccess(bankData, true, statusCode.success, "Successfully retrieved introducer", res)
    } catch (error) {
      console.error(error);
      return apiResponseErr(
        null,
        false,
        statusCode.internalServerError,
        error.message,
        res

      )
    }
  },

};
