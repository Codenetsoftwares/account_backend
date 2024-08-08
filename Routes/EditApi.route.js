import AccountServices from '../services/Accounts.services.js';
import { Authorize } from '../middleware/Authorize.js';
import { BankTransaction } from '../models/BankTransaction.model.js';
import { WebsiteTransaction } from '../models/WebsiteTransaction.model.js';
import { Transaction } from '../models/transaction.js';
import { EditRequest } from '../models/EditRequest.model.js';
import { EditWebsiteRequest } from '../models/EditWebsiteRequest.model.js';
import { EditBankRequest } from '../models/EditBankRequest.model.js';
import { Bank } from '../models/bank.model.js';
import { Website } from '../models/website.model.js';
import { User } from '../models/user.model.js';
import { IntroducerTransaction } from '../models/IntroducerTransaction.model.js';
import { IntroducerEditRequest } from '../models/IntroducerEditRequest.model.js';
import { IntroducerUser } from '../models/introducer.model.js';
import { introducerUser } from '../services/introducer.services.js';
import { Trash } from '../models/Trash.model.js';
import { validateId,  validateRequestId, validateRequestIdInParams, } from '../utils/commonSchema.js';
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

  app.post('/api/admin/save-bank-request',Authorize([string.superAdmin,string.transactionView ,string.bankView]),AccountServices.deleteBank);

  app.post('/api/delete-bank/:id', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    try {
      const id = req.params.id;
      const editRequest = await EditBankRequest.findById(id).exec();

      if (!editRequest) {
        return res.status(404).send({ message: 'Bank Request not found' });
      }

      const isApproved = true;

      if (isApproved) {
        await Bank.deleteOne({ _id: editRequest.id }).exec();
        await EditBankRequest.deleteOne({ _id: req.params.id }).exec();
        res.status(200).send({ message: 'Bank deleted' });
      } else {
        res.status(400).send({ message: 'Approval request rejected by super admin' });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.post(
    '/api/admin/save-website-request',
    Authorize(['superAdmin', 'Transaction-View', 'Website-View']),
    async (req, res) => {
      try {
        const { requestId } = req.body;
        console.log(requestId);
        const transaction = await Website.findById(requestId);
        if (!transaction) {
          return res.status(404).send('Bank not found');
        }
        console.log('Transaction found', transaction);
        const updateResult = await AccountServices.deleteWebsite(transaction, req.body);
        console.log(updateResult);
        if (updateResult) {
          res.status(201).send('Website Delete request sent to Super Admin');
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    },
  );

  app.post('/api/delete-website/:id', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    try {
      const id = req.params.id;
      const editRequest = await EditWebsiteRequest.findById(id).exec();

      if (!editRequest) {
        return res.status(404).send({ message: 'Website Request not found' });
      }

      const isApproved = true;

      if (isApproved) {
        await Website.deleteOne({ _id: editRequest.id }).exec();
        await EditWebsiteRequest.deleteOne({ _id: req.params.id }).exec();
        res.status(200).send({ message: 'Website deleted' });
      } else {
        res.status(400).send({ message: 'Approval request rejected by super admin' });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.delete('/api/reject/bank-detail/:id', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    try {
      const id = req.params.id;
      const result = await EditBankRequest.deleteOne({ _id: id });
      if (result.deletedCount === 1) {
        res.status(200).send({ message: 'Data deleted successfully' });
      } else {
        res.status(404).send({ message: 'Data not found' });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: e.message });
    }
  });

  app.delete('/api/reject/website-detail/:id', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    try {
      const id = req.params.id;
      const result = await EditWebsiteRequest.deleteOne({ _id: id });
      if (result.deletedCount === 1) {
        res.status(200).send({ message: 'Data deleted successfully' });
      } else {
        res.status(404).send({ message: 'Data not found' });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: e.message });
    }
  });

  app.put('/api/intoducer-name-edit/:id', Authorize(['superAdmin']), async (req, res) => {
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
  });
};

export default EditApiRoute;
