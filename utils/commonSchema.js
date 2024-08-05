import { body, param, query } from 'express-validator';

export const validateLogin = [
  body('userName').notEmpty().withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isString()
    .withMessage('Password must be a string')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

export const validateCreateAdmin = [
  body('firstname').notEmpty().withMessage('First name is required'),
  body('lastname').notEmpty().withMessage('Last name is required'),
  body('userName').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required').isString().withMessage('Password must be a string'),
  body('roles').isArray().withMessage('Role is Required'),
];

export const validateInteroducer = [
  body('firstname').notEmpty().withMessage('First name is required'),
  body('lastname').notEmpty().withMessage('Last name is required'),
  body('userName').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required').isString().withMessage('Password must be a string'),
  //body("role").isArray().withMessage("Role is Required"),
];

export const userValidator = [
  body('firstname')
    .notEmpty()
    .withMessage('Firstname is required')
    .isString()
    .withMessage('Firstname must be a string'),

  body('lastname').notEmpty().withMessage('Lastname is required').isString().withMessage('Lastname must be a string'),

  body('userName').notEmpty().withMessage('User Name is required').isString().withMessage('User Name must be a string'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

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

export const validateId = [
  param('id').notEmpty().withMessage('ID  is required').isMongoId().withMessage('ID must be a valid ID'),
];

export const validateBankUpdate = [
  param('id').notEmpty().withMessage('ID  is required').isMongoId().withMessage('ID must be a valid ID'),
  body('accountHolderName').optional().isString().withMessage('Account holder name must be a string'),
  body('bankName').optional().isString().withMessage('Bank name must be a string'),
  body('accountNumber').optional().isNumeric().withMessage('Account number must be a numnber'),
  body('ifscCode').optional().isString().withMessage('IFSC code must be a string'),
  body('upiId').optional().isString().withMessage('UPI ID must be a string'),
  body('upiAppName').optional().isString().withMessage('UPI app name must be a string'),
  body('upiNumber').optional().isString().withMessage('UPI number must be a string'),
];

export const addBankBalanceValidate = [
  param('id').notEmpty().withMessage('ID  is required').isMongoId().withMessage('ID must be a valid ID'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('transactionType').equals('Manual-Bank-Deposit').withMessage('Invalid transaction type'),
  body('remarks').notEmpty().withMessage('Remark is required'),
];

export const withdrawalBankBalanceValidate = [
  param('id').notEmpty().withMessage('ID  is required').isMongoId().withMessage('ID must be a valid ID'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('transactionType').equals('Manual-Bank-Withdraw').withMessage('Invalid transaction type'),
  body('remarks').notEmpty().withMessage('Remark is required'),
];

export const validateBankId = [
  param('bankId').notEmpty().withMessage('Bank Id  is required').isMongoId().withMessage('Bank Id must be a valid ID'),
];
