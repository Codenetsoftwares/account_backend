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
  updateUserValidator,
  validateBankDetails,
  validateCreateUser,
  validateDeleteUser,
  validateEmailVerification,
  validateLogin,
  validatePasswordReset,
  validateSendResetPasswordEmail,
  validateUpiDetails,
  validateUserId,
  validateUserProfile,
  validateUserProfiles,
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

  app.put(
    '/api/user-profile-edit/:id',
    validateUserProfile,
    customErrorHandler,
    AuthorizeRole(['user']),
    userService.updateUserProfile,
  );

  // API To View User Profiles

  app.get(
    '/api/user-profile-data/:userId',
    validateUserId,
    customErrorHandler,
    AuthorizeRole(['user']),
    userService.getUserProfileData,
  );

  app.post(
    '/api/user/reset-password',
    validatePasswordReset,
    customErrorHandler,
    AuthorizeRole(['user']),
    userService.userPasswordResetCode,
  );

  app.get(
    '/api/super-admin/user-profile/:page',
    validateUserProfiles,
    customErrorHandler,
    Authorize(['superAdmin']),
    userService.getUserProfiles, 
  );

  app.post('/api/super-admin/login', validateLogin, customErrorHandler, userService.superAdminLogin);

  app.post(
    '/api/admin/delete/user/:userName',
    validateDeleteUser,
    customErrorHandler,
    Authorize(['superAdmin']),
    userService.deleteUserAndTransactions,
  );

  app.post(
    '/api/admin/update/user/name/:userName',
    updateUserValidator,
    customErrorHandler,
    Authorize(['superAdmin']),
    userService.updateUserNameAndTransactions,
  );
};

export default UserRoutes;
