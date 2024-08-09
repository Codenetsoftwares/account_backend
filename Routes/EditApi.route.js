import AccountServices from '../services/Accounts.services.js';
import { Authorize } from '../middleware/Authorize.js';
import { introducerUser } from '../services/introducer.services.js';
import { validateId,  validateIntroducerProfileUpdate,  validateParamsId,  validateRequestId, validateRequestIdInParams, } from '../utils/commonSchema.js';
import customErrorHandler from '../utils/customErrorHandler.js'
import { string } from '../constructor/string.js';
import { editService } from '../services/edit.services.js';

const EditApiRoute = (app) => {
  app.post('/api/admin/save-bank-transaction-request',validateRequestId,customErrorHandler,Authorize([string.superAdmin, string.transactionDeleteRequest, string.dashboardView]),AccountServices.deleteBankTransaction );
 
  app.post('/api/delete-bank-transaction/:id',validateId, customErrorHandler,Authorize([string.superAdmin,string.requestAdmin ]), editService.deleteBankTransaction);

  app.post('/api/admin/save-website-transaction-request',validateRequestId,customErrorHandler,Authorize([string.superAdmin, string.transactionDeleteRequest, string.dashboardView]),AccountServices.deleteWebsiteTransaction);

  app.post('/api/delete-website-transaction/:id',validateId,customErrorHandler, Authorize([string.superAdmin, string.requestAdmin]),editService.deleteWebsiteTransaction );

  app.post('/api/admin/save-transaction-request',validateRequestId,customErrorHandler,Authorize([string.superAdmin,string.transactionDeleteRequest ,string.dashboardView ]),AccountServices.deleteTransaction);

  app.post('/api/delete-transaction/:id',validateId,customErrorHandler, Authorize([string.superAdmin,string.requestAdmin]), editService.deleteTransaction);

  app.post('/api/admin/save-introducer-transaction-request',validateRequestId,customErrorHandler,Authorize([string.superAdmin,string.transactionDeleteRequest ,string.dashboardView]),AccountServices.deleteIntroducerTransaction);

  app.post('/api/delete-introducer-transaction/:id',validateId,customErrorHandler, Authorize([string.superAdmin,string.requestAdmin]), editService.processTransactionDeletion );

  app.delete('/api/reject/:id',validateId,customErrorHandler, Authorize([string.superAdmin,string.requestAdmin]),editService.rejectEditRequest );

  //   API For Bank Detail Edit approval

  app.post('/api/admin/approve-bank-detail-edit-request/:requestId',validateRequestIdInParams,customErrorHandler,Authorize([string.superAdmin,string.requestAdmin]),editService.processBankDetailEditRequest);

  // API for Website name Edit API

  app.post('/api/admin/approve-website-detail-edit-request/:requestId',validateRequestIdInParams,customErrorHandler,Authorize([string.superAdmin,string.requestAdmin]),editService.processWebsiteDetailEditRequest);

  app.post('/api/admin/save-bank-request',validateRequestId,customErrorHandler,Authorize([string.superAdmin,string.transactionView ,string.bankView]),AccountServices.deleteBank);

  app.post('/api/delete-bank/:id',validateParamsId,customErrorHandler, Authorize([string.superAdmin,string.requestAdmin]), editService.deleteBank);

  app.post(
    '/api/admin/save-website-request',validateRequestId,customErrorHandler, Authorize([string.superAdmin,string.transactionView ,string.websiteView]), AccountServices.deleteWebsite);

  //testing not done
  app.post('/api/delete-website/:id',validateParamsId,customErrorHandler, Authorize([string.superAdmin,string.requestAdmin]), editService.deleteWebsite);

  app.delete('/api/reject/bank-detail/:id',validateParamsId,customErrorHandler, Authorize([string.superAdmin,string.requestAdmin]),editService.rejectBankDetails );
  
  //testing not done
  app.delete('/api/reject/website-detail/:id',validateParamsId,customErrorHandler, Authorize([string.superAdmin,string.requestAdmin]),editService.rejectWebsiteDetails);

  app.put('/api/intoducer-name-edit/:id',validateIntroducerProfileUpdate,customErrorHandler, Authorize(['superAdmin']), introducerUser.updateIntroducerProfile);
};

export default EditApiRoute;
