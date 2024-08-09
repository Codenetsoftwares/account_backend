import { Authorize } from '../middleware/Authorize.js';
import TransactionServices from '../services/Transaction.services.js';
import { Transaction } from '../models/transaction.js';
import { EditRequest } from '../models/EditRequest.model.js';
import { WebsiteTransaction } from '../models/WebsiteTransaction.model.js';
import { BankTransaction } from '../models/BankTransaction.model.js';
import { IntroducerTransaction } from '../models/IntroducerTransaction.model.js';
import { IntroducerEditRequest } from '../models/IntroducerEditRequest.model.js';
import AccountServices from '../services/Accounts.services.js';
import { User } from '../models/user.model.js';
import TransactionService from '../services/Transaction.services.js';
import { string } from '../constructor/string.js';
import { validateBankTransactionUpdate, validateIntroducerTransactionUpdate, validateParamsId, validateRequestIdInParams, validateTransaction, validateTransactionUpdate, validateWebsitetransactionUpdate } from '../utils/commonSchema.js';
import customErrorHandler from '../utils/customErrorHandler.js';

const TransactionRoutes = (app) => {
  // API To Create Transaction

  app.post(
    '/api/admin/create/transaction',
    validateTransaction,
    customErrorHandler,
    Authorize([
      string.superAdmin,
      string.dashboardView,
      string.createDepositTransaction,
      string.createWithdrawTransaction,
      string.createTransaction,
    ]),
      TransactionServices.createTransaction
  );

  // API To View Deposit Transaction Details
  // not in use
  app.get('/api/deposit/view', 
    Authorize([string.superAdmin]), 
   TransactionServices.depositView
   );

  // API To View Withdraw Transaction Details
  // not in used
  app.get('/api/withdraw/view', 
    Authorize([string.superAdmin]), 
    TransactionServices.withdrawView
);

  // API To Edit Transaction Detail and Send Request For Approval From Super Admin

  app.put(
    '/api/admin/edit-transaction-request/:id',
    validateTransactionUpdate,
    customErrorHandler,
    Authorize([string.superAdmin, string.dashboardView, string.transactionEditRequest]),
    TransactionServices.updateTransaction
  );

  app.put(
    '/api/admin/edit-bank-transaction-request/:id',
    validateBankTransactionUpdate,
    customErrorHandler,
    Authorize([ 
      string.superAdmin,
      string.dashboardView, 
      string.transactionEditRequest
    ]),
     TransactionServices.updateBankTransaction    
  );

  app.put(
    '/api/admin/edit-website-transaction-request/:id',
    validateWebsitetransactionUpdate,
    customErrorHandler,
    Authorize([
      string.superAdmin,
      string.dashboardView, 
      string.transactionEditRequest
    ]),
     TransactionServices.updateWebsiteTransaction    
  );

  app.put(
    '/api/admin/edit-introducer-transaction-request/:id',
    validateIntroducerTransactionUpdate,
    customErrorHandler,
    Authorize([   
      string.superAdmin,
      string.dashboardView, 
      string.transactionEditRequest]),
    TransactionServices.updateIntroTransaction
  
  );

  // API To View Edit Transaction Details

  app.get(
    '/api/superadmin/view-edit-transaction-requests',
    Authorize([string.superAdmin, string.requestAdmin]),
    TransactionService.getEditTransactionRequests,
  );

  app.get(
    '/api/superadmin/view-edit-introducer-transaction-requests',
    Authorize([string.superAdmin, string.requestAdmin]),
    TransactionService.getIntroducerEditRequests,
  );

  // API To View Approve Transaction Details

  app.post(
    '/api/admin/approve-transaction-edit-request/:requestId',
    validateRequestIdInParams,
    customErrorHandler,
    Authorize([string.superAdmin, string.requestAdmin]),
    TransactionService.approveTransactionEditRequest
  );

  app.post('/api/admin/approve-bank-edit-request/:requestId',
    validateRequestIdInParams,
    customErrorHandler, 
    Authorize([string.superAdmin]), 
    TransactionService.approveBankEditRequest 
   );

  app.post('/api/admin/approve-website-edit-request/:requestId',
    validateRequestIdInParams,
    customErrorHandler, 
    Authorize([string.superAdmin]), 
    TransactionService.approveWebsiteEditRequest
    );

  app.get('/api/all/transaction/pages/:requestId',
    validateParamsId,
    customErrorHandler, 
    TransactionService.allTransactionPages
  );

  app.post('/api/admin/approve-introducer-edit-request/:requestId',
    validateRequestIdInParams,
    customErrorHandler, 
    Authorize([string.superAdmin]), 
    TransactionService.approveIntroducerEditRequest
    );
};

export default TransactionRoutes;
