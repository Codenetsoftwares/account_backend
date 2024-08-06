import AccountServices from '../services/Accounts.services.js';
import { Admin } from '../models/admin_user.js';
import { Authorize } from '../middleware/Authorize.js';
import { User } from '../models/user.model.js';
import { introducerUser } from '../services/introducer.services.js';
import { IntroducerUser } from '../models/introducer.model.js';
import { userService } from '../services/user.service.js';
import TransactionServices from '../services/Transaction.services.js';
import { string } from '../constructor/string.js';
import customErrorHandler from '../utils/customErrorHandler.js';
import { apiResponseErr, apiResponseSuccess } from '../utils/response.js';
import { statusCode } from '../utils/statusCodes.js';
import { userValidator, validateCreateAdmin, validateInteroducer,validateUserProfileUpdate, validateLogin, validateRole, validateIntroducerUser, validateIntroducerProfileUpdate, validateResetPassword } from '../utils/commonSchema.js';

const AccountsRoute = (app) => {
  // API For Admin Login
  app.post(
    '/admin/login', 
    validateLogin, 
    customErrorHandler, 
    AccountServices.adminLogin
  );

  app.post(
    '/api/create/user-admin',
    validateCreateAdmin,
    customErrorHandler,
    Authorize([string.superAdmin, string.createAdmin]),
    AccountServices.createAdmin,
  );
  // API To View User Profiles

  app.get(
    '/api/user-profile/:page',
    Authorize([string.superAdmin, string.userProfileView , string.profileView]),
    AccountServices.getUserProfile
  );

  // API To Edit User Profiles
  app.put(
    '/api/admin/user-profile-edit/:id',
    validateUserProfileUpdate,
    customErrorHandler,
    Authorize([string.superAdmin, string.userProfileView , string.profileView]),
   AccountServices.updateUserProfile
       
  );

  app.get(
    '/api/admin/sub-admin-name/bank-view',
    Authorize([
      string.superAdmin,
      string.dashboardView,
      string.transactionView,
      string.transactionEditRequest,
      string.transactionDeleteRequest,
      string.websiteView,
      string.bankView,
      string.profileView,
      string.introducerProfileView,
    ]),
    AccountServices.getBankViewAdmins
     );

  app.get(
    '/api/admin/sub-admin-name',
    Authorize([
      string.superAdmin,
      string.dashboardView,
      string.transactionView,
      string.transactionEditRequest,
      string.transactionDeleteRequest,
      string.websiteView,
      string.bankView,
      string.profileView,
      string.introducerProfileView,
    ]),
   AccountServices.getSubAdminName
  );

  // pagination not needed
  app.get(
    '/api/admin/sub-admin-name/website-view',
    Authorize([
      string.superAdmin,
      string.dashboardView,
      string.transactionView,
      string.transactionEditRequest,
      string.transactionDeleteRequest,
      string.websiteView,
      string.bankView,
      string.profileView,
      string.introducerProfileView,
    ]),
    AccountServices.getWebsiteViewAdmins
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
    validateIntroducerUser,
    customErrorHandler,
    Authorize([string.superAdmin, string.createIntroducer, string.createAdmin]),
     introducerUser.createintroducerUser   
  );

  app.post('/api/admin/introducer/introducerCut/:id', 
    Authorize([string.superAdmin]), 
     introducerUser.introducerPercentageCut  
);

  app.get(
    '/api/admin/introducer-live-balance/:id',
    Authorize([string.superAdmin, string.profileView, string.introducerProfileView]),
    introducerUser.introducerLiveBalance
  );

  app.put(
    '/api/admin/intoducer-profile-edit/:id',
    validateIntroducerProfileUpdate,
    customErrorHandler,
    Authorize([string.superAdmin, string.profileView, string.introducerProfileView]),
    introducerUser.updateIntroducerProfile 
  );

  app.get(
    '/api/introducer-profile/:page',
    Authorize(['superAdmin', 'Introducer-Profile-View', 'Profile-View', 'Create-Introducer']),
    async (req, res) => {
      try {
      const page = req.params.page;
      const userName = req.query.search;

      
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
    Authorize([string.superAdmin, string.profileView, string.introducerProfileView]),
   introducerUser.getIntroducerClientData
  );

  app.get( 
    '/api/get-single-Introducer/:id',
    Authorize([string.superAdmin, string.profileView, string.introducerProfileView]),
  introducerUser. getSingleIntroducer
  );

  app.get(
    '/api/superadmin/user-id',
    Authorize([
      string.superAdmin,
      string.dashboardView,
      string.createDepositTransaction,
      string.createWithdrawTransaction,
      string.createTransaction,
    ]),
    AccountServices.getUserDetails,
  );

  app.get(
    '/api/superadmin/Introducer-id',
    Authorize([
      string.superAdmin,
      string.dashboardView,
      string.createDepositTransaction,
      string.createWithdrawTransaction,
      string.createTransaction,
      string.websiteView,
      string.bankView,
      string.profileView,
      string.createUser,
      string.createAdmin,
      string.transactionEditRequest,
      string.transactionDeleteRequest,
    ]),
    AccountServices.getIntroUserDetails,
  );

  app.post(
    '/api/admin/user/register',
    userValidator,
    customErrorHandler,
    Authorize([string.superAdmin, string.createAdmin, string.createUser ]),
    userService.createUser,
  );

  app.get(
    '/api/admin/view-sub-admins/:page',
    Authorize([string.superAdmin]),
    AccountServices.viewSubAdminPage,
  );

  app.post(
    '/api/admin/single-sub-admin/:id',
    Authorize([string.superAdmin]),
    AccountServices.getSingleSubAdmin,
  );

  app.put(
    '/api/admin/edit-subadmin-roles/:id',
    validateRole,
    customErrorHandler,
    Authorize([string.superAdmin]),
    AccountServices.editSubAdmin,
  );

  app.get(
    '/introducer-user-single-data/:id',
    Authorize([string.superAdmin,  string.introducerProfileView, string.profileView]),
    AccountServices.userSingleData,
  );

  app.post(
    '/api/admin/reset-password',
    validateLogin,
    customErrorHandler,
    Authorize([string.superAdmin]),
    AccountServices.SubAdminPasswordResetCode,
  );

  app.post(
    '/api/admin/user/reset-password',
    validateLogin,
    customErrorHandler,
    Authorize([string.superAdmin, string.createUser, string.createAdmin, string.profileView, string.userProfileView]),
    userService.UserPasswordResetCode
     
  );

  app.post(
    '/api/admin/intorducer/reset-password',validateLogin,customErrorHandler,
    Authorize([string.superAdmin, string.createAdmin, string.createIntroducer, string.introducerProfileView, string.profileView]),
     introducerUser.intorducerPasswordResetCode
      
  );

  app.get('/api/admin/user/introducersUserName/:userId',
     Authorize([string.superAdmin]), 
     introducerUser.getInteroducerUserName
);
app.post(
    '/api/admin/filter-data',
    Authorize([
      string.superAdmin,
      string.dashboardView,
      string.transactionView,
      string.transactionEditRequest,
      string.transactionDeleteRequest,
      string.websiteView,
      string.bankView,
      string.reportMyTxn,
    ]),
    AccountServices.adminFilterData
  );

  app.post(
    '/api/admin/create/introducer/deposit-transaction',
    Authorize([string.superAdmin, string.profileView, string.introducerProfileView]),
    TransactionServices.createIntroducerDepositTransaction
     
  );

  app.post(
    '/api/admin/create/introducer/withdraw-transaction',customErrorHandler,
    Authorize([string.superAdmin, string.profileView, string.introducerProfileView]),
     TransactionServices.createIntroducerWithdrawTransaction
   
  );

  app.get(
    '/api/admin/introducer-account-summary/:id',
    Authorize([string.superAdmin, string.profileView, string.introducerProfileView]),
    introducerUser.accountSummary
  );

  app.post(
    '/api/super-admin/reset-password',
    validateResetPassword,
    customErrorHandler,
    Authorize([
      string.superAdmin,
      string.dashboardView,
      string.transactionView,
      string.bankView,
      string.websiteView,
      string.profileView,
      string.userProfileView,
      string.introducerProfileView,
      string.transactionEditRequest,
      string.transactionDeleteRequest,
      string.createDepositTransaction,
      string.createWithdrawTransaction,
      string.createTransaction,
      string.createSubAdmin,
      string.createUser,
      string.createIntroducer,
    ]),
     AccountServices.SuperAdminPasswordResetCode
       
  );

  app.get(
    '/api/single-user-profile/:id',
    Authorize([string.superAdmin, string.profileView, string.userProfileView]),
    AccountServices.getSingleUserProfile
  );

  app.put('/api/admin/subAdmin-profile-edit/:id', 
    Authorize([string.superAdmin]),
  AccountServices.updateSubAdminProfile
);

  app.get(
    '/api/view-subadmin-transaction/:subadminId',
    Authorize([string.superAdmin, string.reportMyTxn]),
    AccountServices.viewSubAdminTransaction,
  );
};

export default AccountsRoute;
