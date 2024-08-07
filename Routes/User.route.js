import { AuthorizeRole } from '../middleware/auth.js';
import AccountServices from '../services/Accounts.services.js';
import { Authorize } from '../middleware/Authorize.js';
import { User } from '../models/user.model.js';
import { userService } from '../services/user.service.js';
import { Transaction } from '../models/transaction.js';
import { Admin } from '../models/admin_user.js';
import { Website } from '../models/website.model.js';
import { Bank } from '../models/bank.model.js';
import { BankTransaction } from '../models/BankTransaction.model.js';
import { WebsiteTransaction } from '../models/WebsiteTransaction.model.js';
import {
  validateBankDetails,
  validateCreateUser,
  validateEmailVerification,
  validateLogin,
  validateSendResetPasswordEmail,
  validateUpiDetails,
  validateWebsiteDetails,
} from '../utils/commonSchema.js';
import customErrorHandler from '../utils/customErrorHandler.js';

export const UserRoutes = (app) => {
  // API For User Login

  app.post('/api/accounts/user/login', validateLogin, customErrorHandler, userService.generateAccessToken);

  // API To Create User

  app.post('/api/accounts/user/register', validateCreateUser, customErrorHandler, userService.createUser);

  // API To Verify User Email-Id

  app.post('/api/accounts/verify-email', validateEmailVerification, customErrorHandler, userService.verifyEmail);

  // API To Initiate Reset User Password

  app.post(
    '/api/accounts/initiate-reset-password',
    validateSendResetPasswordEmail,
    customErrorHandler,
    userService.sendResetPasswordEmail,
  );

  // API To Add Bank Name

  app.post(
    '/api/add-bank-name',
    validateBankDetails,
    customErrorHandler,
    AuthorizeRole(['user']),
    userService.updateBankDetails,
  );

  // API To Add Website Name
  app.post(
    '/api/user/add-website-name',
    validateWebsiteDetails,
    customErrorHandler,
    AuthorizeRole(['user']),
    userService.addWebsiteDetails,
  );

  // API To Add UPI Details
  app.post(
    '/api/user/add-upi-name',
    validateUpiDetails,
    customErrorHandler,
    AuthorizeRole(['user']),
    userService.updateUpiDetails,
  );
  // API To Edit User Profiles

  app.put('/api/user-profile-edit/:id', AuthorizeRole(['user']), async (req, res) => {
    try {
      const id = await User.findById(req.params.id);
      const updateResult = await userService.updateUserProfile(id, req.body);
      console.log(updateResult);
      if (updateResult) {
        res.status(201).send('Profile updated');
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  // API To View User Profiles

  app.get('/api/user-profile-data/:userId', AuthorizeRole(['user']), async (req, res) => {
    try {
      const userId = req.params.userId;
      const userData = await User.findById(userId).sort({ createdAt: 1 }).exec();
      if (!userData) {
        return res.status(404).send({ message: 'User not found' });
      }
      res.status(200).send(userData);
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: 'Internal server error' });
    }
  });

  app.post('/api/user/reset-password', AuthorizeRole(['user']), async (req, res) => {
    try {
      const { userName, oldPassword, password } = req.body;
      await userService.userPasswordResetCode(userName, oldPassword, password);
      res.status(200).send({ code: 200, message: 'Password reset successful!' });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.get('/api/super-admin/user-profile/:page', Authorize(['superAdmin']), async (req, res) => {
    const page = req.params.page;
    const searchQuery = req.query.search;
    try {
      let allIntroDataLength;
      if (searchQuery) {
        console.log('first');
        let SecondArray = [];
        const users = await User.find({ userName: { $regex: new RegExp(searchQuery, 'i') } }).exec();
        SecondArray = SecondArray.concat(users);
        allIntroDataLength = SecondArray.length;
        const pageNumber = Math.ceil(allIntroDataLength / 10);
        res.status(200).json({ SecondArray, pageNumber, allIntroDataLength });
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
          return res.status(404).json({ message: 'No data found for the selected criteria.' });
        }

        const pageNumber = Math.ceil(allIntroDataLength / 10);
        res.status(200).json({ SecondArray, pageNumber, allIntroDataLength });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: 'Internal Server Error' });
    }
  });

  app.post('/api/super-admin/login', async (req, res) => {
    try {
      const { userName, password, persist } = req.body;

      if (!userName) {
        throw { code: 400, message: 'User Name is required' };
      }

      if (!password) {
        throw { code: 400, message: 'Password is required' };
      }

      const user = await Admin.findOne({ userName: userName });
      console.log('user', user);
      if (!user) {
        throw { code: 404, message: 'User not found' };
      }

      const accessToken = await AccountServices.generateAdminAccessToken(userName, password, persist);

      if (!accessToken) {
        throw { code: 500, message: 'Failed to generate access token' };
      }

      res.status(200).send({
        token: accessToken,
      });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.post('/api/admin/delete/user/:userName', Authorize(['superAdmin']), async (req, res) => {
    try {
      const user = req.params.userName;
      console.log('userName', user);
      await Transaction.deleteMany({ userName: user });
      const deleteUser = await User.findOneAndDelete(user);
      if (!deleteUser) {
        return res.status(404).send({ message: 'User not found' });
      }
      res.status(200).send({ message: 'User and associated transactions deleted successfully' });
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: 'Internal server error' });
    }
  });

  app.post('/api/admin/update/user/name/:userName', Authorize(['superAdmin']), async (req, res) => {
    try {
      const user = req.params.userName;
      const newUserName = req.body.newUserName;
      const userToUpdate = await User.findOne({ userName: user });
      if (!userToUpdate) {
        return res.status(404).send({ message: 'User not found' });
      }
      userToUpdate.userName = newUserName;
      await userToUpdate.save();
      const transactions = await Transaction.find({ userName: user });
      transactions.forEach((transaction) => {
        transaction.userName = newUserName;
      });
      await Promise.all(transactions.map((transaction) => transaction.save()));
      res.status(200).send({ message: 'User username and associated transactions updated successfully' });
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: 'Internal server error' });
    }
  });
};

export default UserRoutes;
