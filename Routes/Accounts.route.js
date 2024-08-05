import AccountServices from '../services/Accounts.services.js';
import { Admin } from '../models/admin_user.js';
import { Authorize } from '../middleware/Authorize.js';
import { User } from '../models/user.model.js';
import { introducerUser } from '../services/introducer.services.js';
import { IntroducerUser } from '../models/introducer.model.js';
import { userservice } from '../services/user.service.js';
import TransactionServices from '../services/Transaction.services.js';
import { string } from '../constructor/string.js';
import customErrorHandler from '../utils/customErrorHandler.js';
import { apiResponseErr, apiResponseSuccess } from '../utils/response.js';
import { statusCode } from '../utils/statusCodes.js';
import { userValidator, validateCreateAdmin, validateInteroducer, validateLogin, validateRole } from '../utils/commonSchema.js';

const AccountsRoute = (app) => {
  // API For Admin Login
  app.post('/admin/login', validateLogin, customErrorHandler, AccountServices.adminLogin);

  app.post(
    '/api/create/user-admin',
    validateCreateAdmin,
    customErrorHandler,
    Authorize(['superAdmin', 'Create-SubAdmin']),
    AccountServices.createAdmin,
  );
  // API To View User Profiles

  app.get(
    '/api/user-profile/:page',
    customErrorHandler,
    Authorize(['superAdmin', 'Profile-View', 'User-Profile-View']),
    async (req, res) => {
      const page = req.params.page;
      const searchQuery = req.query.search;
      try {
        let allIntroDataLength;
        if (searchQuery) {
          console.log('first');
          let SecondArray = [];
          const users = await User.find({
            userName: { $regex: new RegExp(searchQuery, 'i') },
          }).exec();
          SecondArray = SecondArray.concat(users);
          allIntroDataLength = SecondArray.length;
          const pageNumber = Math.ceil(allIntroDataLength / 10);
          // res.status(200).json({ SecondArray, pageNumber, allIntroDataLength });
          return apiResponseSuccess(
            { SecondArray, pageNumber, allIntroDataLength },
            true,
            statusCode.success,
            'User Profile retrive successfully',
            res,
          );
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
            // return res
            //   .status(404)
            //   .json({ message: "No data found for the selected criteria." });
            return apiResponseErr(null, false, statusCode.notFound, ' No data found for the selected criteria.', res);
          }

          const pageNumber = Math.ceil(allIntroDataLength / 10);

          // res.status(200).json({ SecondArray, pageNumber, allIntroDataLength });
          return apiResponseSuccess(
            { SecondArray, pageNumber, allIntroDataLength },
            true,
            statusCode.success,
            'User Profile retrive successfully',
            res,
          );
        }
      } catch (error) {
        console.error(error);
        return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
      }
    },
  );

  // API To Edit User Profiles
  app.put(
    '/api/admin/user-profile-edit/:id',
    customErrorHandler,
    Authorize(['superAdmin', 'User-Profile-View', 'Profile-View']),
    async (req, res) => {
      try {
        const id = await User.findById(req.params.id);
        const updateResult = await AccountServices.updateUserProfile(id, req.body);
        console.log(updateResult);
        if (updateResult) {
          return apiResponseSuccess(updateResult, true, statusCode.success, 'Profile updated', res);
        }
      } catch (error) {
        return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
      }
    },
  );

  app.get(
    '/api/admin/sub-admin-name/bank-view',
    customErrorHandler,
    Authorize([
      'superAdmin',
      'Dashboard-View',
      'Transaction-View',
      'Transaction-Edit-Request',
      'Transaction-Delete-Request',
      'Website-View',
      'Bank-View',
      'Profile-View',
      'Introducer-Profile-View',
    ]),
    async (req, res) => {
      try {
        const superAdmin = await Admin.find(
          {
            roles: {
              $all: ['Bank-View'],
            },
          },
          'userName',
        ).exec();
        console.log('superAdmin', superAdmin);

        //res.status(200).send(superAdmin);
        return apiResponseSuccess(superAdmin, true, statusCode.success, " Admins with 'Bank-View' role found.", res);
      } catch (error) {
        console.error(e);
        return apiResponseErr(null, flase, error.responseCode ?? statusCode.internalServerError, error.message, res);
      }
    },
  );
  app.get(
    '/api/admin/sub-admin-name',
    customErrorHandler,
    Authorize([
      'superAdmin',
      'Dashboard-View',
      'Transaction-View',
      'Transaction-Edit-Request',
      'Transaction-Delete-Request',
      'Website-View',
      'Bank-View',
      'Profile-View',
      'Introducer-Profile-View',
    ]),
    async (req, res) => {
      try {
        const superAdmin = await Admin.find({}, 'userName').exec();
        console.log('superAdmin', superAdmin);
        // res.status(200).send(superAdmin);
        return apiResponseSuccess(superAdmin, true, statusCode.success, ' Suceessfully Retrived Admin User Name', res);
      } catch (error) {
        console.error(error);
        return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
      }
    },
  );

  // pagination not needed
  app.get(
    '/api/admin/sub-admin-name/website-view',
    customErrorHandler,
    Authorize([
      'superAdmin',
      'Dashboard-View',
      'Transaction-View',
      'Transaction-Edit-Request',
      'Transaction-Delete-Request',
      'Website-View',
      'Bank-View',
      'Profile-View',
      'Introducer-Profile-View',
    ]),
    async (req, res) => {
      try {
        const superAdmin = await Admin.find(
          {
            roles: {
              $all: ['Website-View'],
            },
          },
          'userName',
        ).exec();
        console.log('superAdmin', superAdmin);

        //res.status(200).send(superAdmin);
        return apiResponseSuccess(
          superAdmin,
          true,
          statusCode.success,
          'Successfully retrieved  admin with Website-View role',
          res,
        );
      } catch (error) {
        console.error(e);
        return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);
      }
    },
  );

  app.get(
    '/api/admin/account-summary',
    Authorize([
      string.superAdmin,
      string.dashboardView,
      string.transactionView,
      string.transactionEditRequest,
      string.transactionDeleteRequest,
      string.websiteView,
      string.bankView,
    ]),
    AccountServices.getAccountSummary,
  );

  app.post(
    '/api/admin/accounts/introducer/register',
    Authorize(['superAdmin', 'Create-Introducer', 'Create-Admin']),
    async (req, res) => {
      try {
        await introducerUser.createintroducerUser(req.body);
        res.status(200).send({
          code: 200,
          message: 'Introducer User registered successfully!',
        });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    },
  );

  app.post('/api/admin/introducer/introducerCut/:id', customErrorHandler,
    Authorize(['superAdmin']), 
     introducerUser.introducerPercentageCut  
);

  app.get(
    '/api/admin/introducer-live-balance/:id',customErrorHandler,
    Authorize(['superAdmin', 'Profile-View', 'Introducer-Profile-View']),
  introducerUser.interoducerLiveBalance
  );

  app.put(
    '/api/admin/intoducer-profile-edit/:id',
    Authorize(['superAdmin', 'Profile-View', 'Introducer-Profile-View']),
    async (req, res) => {
      try {
        const id = await IntroducerUser.findById(req.params.id);
        const updateResult = await introducerUser.updateIntroducerProfile(id, req.body);
        console.log(updateResult);
        if (updateResult) {
          res.status(201).send('Profile updated');
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    },
  );

  app.get(
    '/api/introducer-profile/:page',
    Authorize(['superAdmin', 'Introducer-Profile-View', 'Profile-View', 'Create-Introducer']),
    async (req, res) => {
      const page = req.params.page;
      const userName = req.query.search;

      try {
        let introducerUser = await IntroducerUser.find().exec();
        let introData = JSON.parse(JSON.stringify(introducerUser));
        if (userName) {
          introData = introData.filter((user) => user.userName.includes(userName));
        }
        for (let index = 0; index < introData.length; index++) {
          introData[index].balance = await AccountServices.getIntroBalance(introData[index]._id);
        }
        const allIntroDataLength = introData.length;
        let pageNumber = Math.floor(allIntroDataLength / 10) + 1;
        let SecondArray = [];
        const Limit = page * 10;

        for (let j = Limit - 10; j < Limit; j++) {
          // console.log('all', [j]);
          if (introData[j] !== undefined) {
            SecondArray.push(introData[j]);
          }
        }

        if (SecondArray.length === 0) {
          return res.status(404).json({ message: 'No data' });
        }

        res.status(200).json({ SecondArray, pageNumber, allIntroDataLength });
      } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Internal Server Error' });
      }
    },
  );

  app.get(
    '/api/intoducer/client-data/:id',
    Authorize(['superAdmin', 'Profile-View', 'Introducer-Profile-View']),
    async (req, res) => {
      try {
        const id = req.params.id;
        const intoducer = await IntroducerUser.findOne({ id }).exec();
        const intoducerId = intoducer.userName;
        const introducerUser = await User.find({
          introducersUserName: intoducerId,
        }).exec();
        res.send(introducerUser);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    },
  );

  app.get(
    '/api/get-single-Introducer/:id',
    Authorize(['superAdmin', 'Profile-View', 'Introducer-Profile-View']),
    async (req, res) => {
      try {
        const id = req.params.id;
        const bankData = await IntroducerUser.findOne({ _id: id }).exec();
        res.status(200).send(bankData);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    },
  );

  app.get(
    '/api/superadmin/user-id',
    customErrorHandler,
    Authorize([
      'superAdmin',
      'Dashboard-View',
      'Create-Deposit-Transaction',
      'Create-Withdraw-Transaction',
      'Create-Transaction',
    ]),
    AccountServices.getUserDetails,
  );

  app.get(
    '/api/superadmin/Introducer-id',
    customErrorHandler,
    Authorize([
      'superAdmin',
      'Dashboard-View',
      'Create-Deposit-Transaction',
      'Create-Withdraw-Transaction',
      'Create-Transaction',
      'Website-View',
      'Bank-View',
      'Profile-View',
      'Create-User',
      'Create-Admin',
      'Transaction-Edit-Request',
      'Transaction-Delete-Request',
    ]),
    AccountServices.getIntroUserDetails,
  );

  app.post(
    '/api/admin/user/register',
    userValidator,
    customErrorHandler,
    Authorize(['superAdmin', 'Create-Admin', 'Create-User']),
    userservice.createUser,
  );

  app.get(
    '/api/admin/view-sub-admins/:page',
    customErrorHandler,
    Authorize(['superAdmin']),
    AccountServices.viewSubAdminPage,
  );

  app.post(
    '/api/admin/single-sub-admin/:id',
    customErrorHandler,
    Authorize(['superAdmin']),
    AccountServices.getSingleSubAdmin,
  );

  app.put(
    '/api/admin/edit-subadmin-roles/:id',
    validateRole,
    customErrorHandler,
    Authorize(['superAdmin']),
    AccountServices.editSubAdmin,
  );

  app.get(
    '/introducer-user-single-data/:id',
    customErrorHandler,
    Authorize(['superAdmin', 'Introducer-Profile-View', 'Profile-View']),
    AccountServices.userSingleData,
  );

  app.post(
    '/api/admin/reset-password',validateLogin,customErrorHandler,
    customErrorHandler,
    Authorize(['superAdmin']),
    AccountServices.SubAdminPasswordResetCode,
  );

  app.post(
    '/api/admin/user/reset-password',validateLogin,customErrorHandler,
    Authorize(['superAdmin', 'Create-User', 'Create-Admin', 'Profile-View', 'User-Profile-View']),
    userservice.UserPasswordResetCode
     
  );

  app.post(
    '/api/admin/intorducer/reset-password',validateLogin,customErrorHandler,
    Authorize(['superAdmin', 'Create-Admin', 'Create-Introducer', 'Introducer-Profile-View', 'Profile-View']),
     introducerUser.intorducerPasswordResetCode
      
  );

  app.get('/api/admin/user/introducersUserName/:userId',customErrorHandler,
     Authorize(['superAdmin']), 
     introducerUser.getInteroducerUserName
);
app.post(
    '/api/admin/filter-data',
    Authorize([
      'superAdmin',
      'Dashboard-View',
      'Transaction-View',
      'Transaction-Edit-Request',
      'Transaction-Delete-Request',
      'Website-View',
      'Bank-View',
      'report-all-txn',
    ]),
    AccountServices.adminFilterData
  );

  app.post(
    '/api/admin/create/introducer/deposit-transaction',customErrorHandler,
    Authorize(['superAdmin', 'Profile-View', 'Introducer-Profile-View']),
    TransactionServices.createIntroducerDepositTransaction
     
  );

  app.post(
    '/api/admin/create/introducer/withdraw-transaction',customErrorHandler,
    Authorize(['superAdmin', 'Profile-View', 'Introducer-Profile-View']),
     TransactionServices.createIntroducerWithdrawTransaction
   
  );

  app.get(
    '/api/admin/introducer-account-summary/:id',customErrorHandler,
    Authorize(['superAdmin', 'Profile-View', 'Introducer-Profile-View']),
    introducerUser.accountSummary
  );

  app.post(
    '/api/super-admin/reset-password',customErrorHandler,
    Authorize([
      'superAdmin',
      'Dashboard-View',
      'Transaction-View',
      'Bank-View',
      'Website-View',
      'Profile-View',
      'User-Profile-View',
      'Introducer-Profile-View',
      'Transaction-Edit-Request',
      'Transaction-Delete-Request',
      'Create-Deposit-Transaction',
      'Create-Withdraw-Transaction',
      'Create-Transaction',
      'Create-SubAdmin',
      'Create-User',
      'Create-Introducer',
    ]),
     AccountServices.SuperAdminPasswordResetCode
       
  );

  app.get(
    '/api/single-user-profile/:id',customErrorHandler,
    Authorize(['superAdmin', 'Profile-View', 'User-Profile-View']),
    AccountServices.getSingleUserProfile
  );

  app.put('/api/admin/subAdmin-profile-edit/:id', customErrorHandler,
    Authorize(['superAdmin']),
  AccountServices.updateSubAdminProfile
);

  app.get(
    '/api/view-subadmin-transaction/:subadminId',customErrorHandler,
    Authorize(['superAdmin', 'report-my-txn']),
    AccountServices.viewSubAdminTransaction,
  );
};

export default AccountsRoute;
