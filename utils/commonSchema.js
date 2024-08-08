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
export const validateRole = [body('roles').notEmpty().withMessage('Role is required')];
export const validateEmailVerification = [
  body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('code')
    .notEmpty()
    .withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 characters long'),
];
export const validateSendResetPasswordEmail = [
  body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
];

export const validateBankDetails = [
  body('accountHolderName')
    .notEmpty()
    .withMessage('Account holder name is required')
    .isString()
    .withMessage('Account holder name must be a string'),

  body('bankName').notEmpty().withMessage('Bank name is required').isString().withMessage('Bank name must be a string'),

  body('ifscCode')
    .notEmpty()
    .withMessage('IFSC code is required')
    .isLength({ min: 9, max: 12 })
    .withMessage('ifscCode must be between 9 and 12 digits'),

  body('accountNumber')
    .notEmpty()
    .withMessage('Account number is required')
    .isNumeric()
    .withMessage('Account number must be numeric')
    .isLength({ min: 5, max: 20 })
    .withMessage('Account number must be between 5 and 20 digits'),
];

export const validateWebsiteDetails = [
  body('websiteName')
    .notEmpty()
    .withMessage('Website name is required')
    .isString()
    .withMessage('Website name must be a string'),
];

export const validateUpiDetails = [
  body('upiId').notEmpty().withMessage('UPI ID is required').isString().withMessage('UPI ID must be a string'),
  body('upiApp').notEmpty().withMessage('UPI App is required').isString().withMessage('UPI App must be a string'),
  body('upiNumber')
    .notEmpty()
    .withMessage('UPI Number is required')
    .isString()
    .withMessage('UPI Number must be a string'),
];

export const validateCreateUser = [
  body('firstname').trim().notEmpty().withMessage('First name is required'),
  body('lastname').trim().notEmpty().withMessage('Last name is required'),
  body('userName')
    .trim()
    .notEmpty()
    .withMessage('User Name is required')
    .isLength({ min: 3 })
    .withMessage('User Name must be at least 3 characters long'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('contactNumber')
    .notEmpty()
    .withMessage('Contact Number is required')
    .isMobilePhone()
    .withMessage('Invalid Contact Number'),

  body('introducersUserName').optional().trim(),
  body('introducersUserName1').optional().trim(),
  body('introducersUserName2').optional().trim(),
  body('introducerPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Introducer Percentage must be between 0 and 100'),
  body('introducerPercentage1')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Introducer Percentage 1 must be between 0 and 100'),
  body('introducerPercentage2')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Introducer Percentage 2 must be between 0 and 100'),
];
export const validateUserProfileUpdate = [
  body('firstname').optional().isString().withMessage('Firstname must be a string'),
  body('lastname').optional().isString().withMessage('Lastname must be a string'),
  body('contactNumber').optional().isString().withMessage('Contact Number must be a string'),
  body('bankDetail').optional().isObject().withMessage('Bank Detail must be an object'),
  body('upiDetail').optional().isString().withMessage('UPI Detail must be a string'),
  body('introducerPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Introducer Percentage must be a number between 0 and 100'),
  body('introducersUserName').optional().isString().withMessage('Introducers Username must be a string'),
  body('webSiteDetail').optional().isString().withMessage('Website Detail must be a string'),
  body('introducersUserName1').optional().isString().withMessage('Introducers Username 1 must be a string'),
  body('introducerPercentage1')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Introducer Percentage 1 must be a number between 0 and 100'),
  body('introducersUserName2').optional().isString().withMessage('Introducers Username 2 must be a string'),
  body('introducerPercentage2')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Introducer Percentage 2 must be a number between 0 and 100'),
];
export const validateIntroducerUser = [
  body('firstname').notEmpty().withMessage('First name is required'),
  body('lastname').notEmpty().withMessage('Last name is required'),
  body('userName').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required').isString().withMessage('Password must be a string'),
  // body('role').isArray().withMessage('Role must be an array of strings')
];
export const validateIntroducerProfileUpdate = [
  body('firstname').optional().isString().withMessage('Firstname must be a string'),
  body('lastname').optional().isString().withMessage('Lastname must be a string'),
];
export const validateIsActive = [
  param('bankId')
    .isMongoId()
    .withMessage('Invalid bankId format'),

  body('isActive')
    .isBoolean()
    .withMessage('isActive field must be a boolean value')
]


export const validateResetPassword = [
  body('userName').notEmpty().withMessage('Username is required'),
  body('oldPassword').notEmpty().withMessage('Old Password is required'),
  body('password').notEmpty().withMessage('Password is required'),
];


export const validateUserProfile = [
  param('id').notEmpty().withMessage('ID  is required').isMongoId().withMessage('ID must be a valid ID'),
  body('firstname').optional().isString().withMessage('Firstname must be a string'),
  body('lastname').optional().isString().withMessage('Lastname must be a string'),
  body('contactNumber').optional().isMobilePhone().withMessage('Invalid contact number'),
];

export const validateUserId = [
  param('userId').notEmpty().withMessage('User Id  is required').isMongoId().withMessage('User Id must be a valid ID'),
];

export const validatePasswordReset = [
  body('userName').notEmpty().withMessage('Username is required'),
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('password')
    .notEmpty()
    .withMessage('password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];
export const validateUserProfiles = [
  param('page').optional().isInt({ min: 1 }).withMessage('Page must be an integer greater than or equal to 1'),
  query('search').optional().isString().withMessage('Search query must be a string'),
];
export const validateDeleteUser = [
  param('userName')
    .notEmpty()
    .withMessage('Username cannot be empty')
    .isString()
    .withMessage('Username must be a string'),
];

export const updateUserValidator = [
  param('userName')
    .notEmpty()
    .withMessage('Username cannot be empty')
    .isString()
    .withMessage('Username must be a string'),
  body('newUserName')
    .isString()
    .withMessage('New user name must be a string')
    .notEmpty()
    .withMessage('New user name is required')
    .trim()
    .escape(), // Escape potentially harmful characters
];

export const validateTransaction = [
  body('transactionID').notEmpty().withMessage('transactionID is required'),
  body('amount').notEmpty().withMessage('Amount is required'),
  body('paymentMethod').notEmpty().withMessage('Payment Method is required'),
];
export const validateParamsId = [
  param('id').isMongoId().withMessage('Invalid Given ID'),
];