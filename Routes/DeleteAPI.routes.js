import { string } from '../constructor/string.js';
import { Authorize } from '../middleware/Authorize.js';
import { BankTransaction } from '../models/BankTransaction.model.js';
import { EditRequest } from '../models/EditRequest.model.js';
import { IntroducerTransaction } from '../models/IntroducerTransaction.model.js';
import { Trash } from '../models/Trash.model.js';
import { WebsiteTransaction } from '../models/WebsiteTransaction.model.js';
import { Transaction } from '../models/transaction.js';
import { User } from '../models/user.model.js';
import AccountServices from '../services/Accounts.services.js';
import { DeleteService } from '../services/Delete.services.js';

const DeleteAPIRoute = (app) => {
  app.post(
    '/api/admin/move-bank-transaction-to-trash',
    Authorize(['superAdmin', 'Transaction-Delete-Request', 'Dashboard-View', 'RequestAdmin']),
    async (req, res) => {
      try {
        const { requestId } = req.body;
        const transaction = await EditRequest.findById(requestId);
        if (!transaction) {
          return res.status(404).send('Bank Transaction not found');
        }
        const updateResult = await AccountServices.trashBankTransaction(transaction);
        if (updateResult) {
          res.status(201).send('Bank Transaction Moved To Trash');
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    },
  );

  app.get('/api/admin/view-trash', Authorize([string.superAdmin, string.requestAdmin]), DeleteService.trashView);

  app.post(
    '/api/admin/move-website-transaction-to-trash',
    Authorize(['superAdmin', 'Transaction-Delete-Request', 'Dashboard-View', 'RequestAdmin']),
    async (req, res) => {
      try {
        const { requestId } = req.body;
        const transaction = await EditRequest.findById(requestId);
        console.log('transac', transaction);
        if (!transaction) {
          return res.status(404).send('Website Transaction not found');
        }
        const updateResult = await AccountServices.trashWebsiteTransaction(transaction);
        if (updateResult) {
          res.status(201).send('Website Transaction Moved To Trash');
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    },
  );

  app.post(
    '/api/admin/move-transaction-to-trash',
    Authorize(['superAdmin', 'Transaction-Delete-Request', 'Dashboard-View', 'RequestAdmin']),
    async (req, res) => {
      try {
        const { requestId } = req.body;
        const transaction = await EditRequest.findById(requestId);
        if (!transaction) {
          return res.status(404).send('Transaction not found');
        }
        const updateResult = await AccountServices.trashTransaction(transaction);
        if (updateResult) {
          res.status(201).send('Transaction Moved To Trash');
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    },
  );

  app.post(
    '/api/admin/move-introducer-transaction-to-trash',
    Authorize(['superAdmin', 'Transaction-Delete-Request', 'Dashboard-View', 'RequestAdmin']),
    async (req, res) => {
      try {
        const { requestId } = req.body;
        const transaction = await EditRequest.findById(requestId);
        if (!transaction) {
          return res.status(404).send('Transaction not found');
        }
        const updateResult = await AccountServices.trashIntroducerTransaction(transaction);
        if (updateResult) {
          res.status(201).send('Transaction Moved To Trash');
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    },
  );

  app.delete('/api/delete/transactions/:id', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    try {
      const id = req.params.id;
      const result = await Trash.deleteOne({ _id: id });
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

  app.post('/api/restore/bank/data/:bankId', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    try {
      const bankId = req.params.bankId;
      const deletedData = await Trash.findOne({ bankId }).exec();
      console.log('first', deletedData);
      if (!deletedData) {
        return res.status(404).send({ message: 'Data not found in Trash' });
      }
      const dataToRestore = {
        bankId: deletedData.bankId,
        transactionType: deletedData.transactionType,
        remarks: deletedData.remarks,
        withdrawAmount: deletedData.withdrawAmount,
        depositAmount: deletedData.depositAmount,
        subAdminId: deletedData.subAdminId,
        subAdminName: deletedData.subAdminName,
        accountHolderName: deletedData.accountHolderName,
        bankName: deletedData.bankName,
        accountNumber: deletedData.accountNumber,
        ifscCode: deletedData.ifscCode,
        createdAt: deletedData.createdAt,
        upiId: deletedData.upiId,
        upiAppName: deletedData.upiAppName,
        upiNumber: deletedData.upiNumber,
        isSubmit: deletedData.isSubmit,
      };
      const restoredData = await BankTransaction.create(dataToRestore);
      await Trash.findByIdAndDelete(deletedData._id);
      res.status(200).send({ message: 'Data restored successfully', data: restoredData });
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: e.message });
    }
  });

  app.post('/api/restore/website/data/:websiteId', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    try {
      const websiteId = req.params.websiteId;
      const deletedData = await Trash.findOne({ websiteId }).exec();
      console.log('first', deletedData);
      if (!deletedData) {
        return res.status(404).send({ message: 'Data not found in Trash' });
      }
      const dataToRestore = {
        websiteId: deletedData.websiteId,
        transactionType: deletedData.transactionType,
        remarks: deletedData.remarks,
        withdrawAmount: deletedData.withdrawAmount,
        depositAmount: deletedData.depositAmount,
        subAdminId: deletedData.subAdminId,
        subAdminName: deletedData.subAdminName,
        websiteName: deletedData.websiteName,
        createdAt: deletedData.createdAt,
      };
      const restoredData = await WebsiteTransaction.create(dataToRestore);
      await Trash.findByIdAndDelete(deletedData._id);
      res.status(200).send({ message: 'Data restored successfully', data: restoredData });
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: e.message });
    }
  });

  app.post(
    '/api/restore/transaction/data/:transactionID',
    Authorize(['superAdmin', 'RequestAdmin']),
    async (req, res) => {
      try {
        const transactionID = req.params.transactionID;
        const deletedData = await Trash.findOne({ transactionID }).exec();
        console.log('first', deletedData);
        if (!deletedData) {
          return res.status(404).send({ message: 'Data not found in Trash' });
        }
        const dataToRestore = {
          bankId: deletedData.bankId,
          websiteId: deletedData.websiteId,
          transactionID: deletedData.transactionID,
          transactionType: deletedData.transactionType,
          remarks: deletedData.remarks,
          amount: deletedData.amount,
          subAdminId: deletedData.subAdminId,
          subAdminName: deletedData.subAdminName,
          introducerUserName: deletedData.introducerUserName,
          userId: deletedData.userId,
          userName: deletedData.userName,
          paymentMethod: deletedData.paymentMethod,
          websiteName: deletedData.websiteName,
          bankName: deletedData.bankName,
          amount: deletedData.amount,
          bonus: deletedData.bonus,
          bankCharges: deletedData.bankCharges,
          createdAt: deletedData.createdAt,
        };
        const restoredData = await Transaction.create(dataToRestore);
        const user = await User.findOneAndUpdate(
          { userName: deletedData.userName },
          { $push: { transactionDetail: dataToRestore } },
          { new: true },
        );
        await Trash.findByIdAndDelete(deletedData._id);
        res.status(200).send({ message: 'Data restored successfully', data: restoredData });
      } catch (e) {
        console.error(e);
        res.status(500).send({ message: e.message });
      }
    },
  );

  app.post('/api/restore/Introducer/data/:introUserId', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    try {
      const introUserId = req.params.introUserId;
      const deletedData = await Trash.findOne({ introUserId }).exec();
      console.log('first', deletedData);
      if (!deletedData) {
        return res.status(404).send({ message: 'Data not found in Trash' });
      }
      const dataToRestore = {
        introUserId: deletedData.introUserId,
        amount: deletedData.amount,
        transactionType: deletedData.transactionType,
        remarks: deletedData.remarks,
        subAdminId: deletedData.subAdminId,
        subAdminName: deletedData.subAdminName,
        introducerUserName: deletedData.introducerUserName,
        createdAt: deletedData.createdAt,
      };
      const restoredData = await IntroducerTransaction.create(dataToRestore);
      await Trash.findByIdAndDelete(deletedData._id);
      res.status(200).send({ message: 'Data restored successfully', data: restoredData });
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: e.message });
    }
  });
};

export default DeleteAPIRoute;
