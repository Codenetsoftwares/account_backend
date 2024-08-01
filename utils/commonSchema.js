import { body, param, query } from 'express-validator';

export const validateAddBank = [
  body('bankName').trim().notEmpty().withMessage('Please provide a bank name to add'),
  body('accountHolderName').optional().trim().isString().withMessage('Account Holder Name must be a string'),
  body('accountNumber').optional().trim().isNumeric().withMessage('Account Number must be a Number'),
  body('ifscCode').optional().trim().isString().withMessage('IFSC Code must be a string'),
  body('upiId').optional().trim().isString().withMessage('UPI ID must be a string'),
  body('upiAppName').optional().trim().isString().withMessage('UPI App Name must be a string'),
  body('upiNumber').optional().trim().isString().withMessage('UPI Number must be a string'),
];

export const validateApproveBank = [
  param('id').notEmpty().withMessage('ID  is required').isMongoId().withMessage('ID must be a valid ID'),
  body('isApproved').isBoolean().withMessage('isApproved must be a boolean value'),
  body('subAdmins.*.subAdminId')
    .isString()
    .withMessage('subAdminId must be a string')
    .not()
    .isEmpty()
    .withMessage('subAdminId is required'),
  body('subAdmins.*.isDeposit').optional().isBoolean().withMessage('isDeposit must be a boolean'),
  body('subAdmins.*.isWithdraw').optional().isBoolean().withMessage('isWithdraw must be a boolean'),
  body('subAdmins.*.isEdit').optional().isBoolean().withMessage('isEdit must be a boolean'),
  body('subAdmins.*.isRenew').optional().isBoolean().withMessage('isRenew must be a boolean'),
  body('subAdmins.*.isDelete').optional().isBoolean().withMessage('isDelete must be a boolean'),
];

export const validateImproveBank = [
  param('id').notEmpty().withMessage('ID  is required').isMongoId().withMessage('ID must be a valid ID'),
  body('subAdmins.*.subAdminId')
    .isString()
    .withMessage('subAdminId must be a string')
    .not()
    .isEmpty()
    .withMessage('subAdminId is required'),
  body('subAdmins.*.isDeposit').optional().isBoolean().withMessage('isDeposit must be a boolean'),
  body('subAdmins.*.isWithdraw').optional().isBoolean().withMessage('isWithdraw must be a boolean'),
  body('subAdmins.*.isEdit').optional().isBoolean().withMessage('isEdit must be a boolean'),
  body('subAdmins.*.isRenew').optional().isBoolean().withMessage('isRenew must be a boolean'),
  body('subAdmins.*.isDelete').optional().isBoolean().withMessage('isDelete must be a boolean'),
];

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be an integer greater than or equal to 1'),
  query('pageSize').optional().isInt({ min: 1 }).withMessage('Page size must be an integer greater than or equal to 1'),
];
