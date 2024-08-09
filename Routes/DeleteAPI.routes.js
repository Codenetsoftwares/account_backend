import { string } from '../constructor/string.js';
import { Authorize } from '../middleware/Authorize.js';
import AccountServices from '../services/Accounts.services.js';
import { DeleteService } from '../services/Delete.services.js';
import { validateBankId, validateIntroducerId, validatePagination, validateParamsId, validateRequestId, validateTransactionId, validateWebsiteId } from '../utils/commonSchema.js';
import customErrorHandler from '../utils/customErrorHandler.js';

const DeleteAPIRoute = (app) => {
  app.post('/api/admin/move-bank-transaction-to-trash',validateRequestId,customErrorHandler,Authorize([string.superAdmin,string.transactionDeleteRequest ,string.dashboardView,string.requestAdmin]),AccountServices.trashBankTransaction);

  app.get('/api/admin/view-trash',validatePagination,customErrorHandler, Authorize([string.superAdmin, string.requestAdmin]), DeleteService.trashView);

  //testing No done 
  app.post('/api/admin/move-website-transaction-to-trash',validateRequestId,customErrorHandler,Authorize([string.superAdmin,string.transactionDeleteRequest ,string.dashboardView,string.requestAdmin]),AccountServices.trashWebsiteTransaction);

  app.post('/api/admin/move-transaction-to-trash',validateRequestId,customErrorHandler,Authorize([string.superAdmin,string.transactionDeleteRequest ,string.dashboardView,string.requestAdmin]),AccountServices.trashTransaction);

  app.post('/api/admin/move-introducer-transaction-to-trash',validateRequestId,customErrorHandler,Authorize([string.superAdmin,string.transactionDeleteRequest ,string.dashboardView,string.requestAdmin]),AccountServices.trashIntroducerTransaction);

  app.delete('/api/delete/transactions/:id',validateParamsId,customErrorHandler, Authorize([string.superAdmin, string.requestAdmin]), DeleteService.deleteTransaction);

  app.post('/api/restore/bank/data/:bankId',validateBankId,customErrorHandler, Authorize([string.superAdmin, string.requestAdmin]),DeleteService.restoreBankData );

  app.post('/api/restore/website/data/:websiteId',validateWebsiteId,customErrorHandler, Authorize([string.superAdmin, string.requestAdmin]), DeleteService.restoreWebsiteData );

  app.post('/api/restore/transaction/data/:transactionID',validateTransactionId,customErrorHandler,Authorize([string.superAdmin, string.requestAdmin]),DeleteService.restoreTransactionData );
  // testing not done
  app.post('/api/restore/Introducer/data/:introUserId',validateIntroducerId,customErrorHandler, Authorize([string.superAdmin, string.requestAdmin]),DeleteService.restoreIntroducerData );
};

export default DeleteAPIRoute;
