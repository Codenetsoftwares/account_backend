import AccountServices from '../services/Accounts.services.js';
import { Authorize } from '../middleware/Authorize.js';
import { Bank } from '../models/bank.model.js';
import { BankTransaction } from '../models/BankTransaction.model.js';
import { Transaction } from '../models/transaction.js';
import { EditBankRequest } from '../models/EditBankRequest.model.js';
import { Website } from '../models/website.model.js';
import { string } from '../constructor/string.js';
import { BankServices } from '../services/Bank.services.js';
import {
  addBankBalanceValidate,
  validateAddBank,
  validateApproveBank,
  validateBankId,
  validateBankUpdate,
  validateId,
  validateImproveBank,
  validateIsActive,
  validatePagination,
  withdrawalBankBalanceValidate,
} from '../utils/commonSchema.js';
import customErrorHandler from '../utils/customErrorHandler.js';

const BankRoutes = (app) => {
  // API To Add Bank Name
  app.post(
    '/api/add-bank-name',
    validateAddBank,
    customErrorHandler,
    Authorize([string.superAdmin, string.transactionView, string.bankView]),
    BankServices.addBank,
  );

  app.post(
    '/api/approve-bank/:id',
    validateApproveBank,
    customErrorHandler,
    Authorize([string.superAdmin]),
    BankServices.approveBank,
  );

  app.post(
    '/api/improve-bank/:id',
    validateImproveBank,
    customErrorHandler,
    Authorize([string.superAdmin]),
    BankServices.improveBank,
  );

  app.get(
    '/api/superadmin/view-bank-requests',
    validatePagination,
    customErrorHandler,
    Authorize([string.superAdmin]),
    BankServices.viewBankRequest,
  );

  app.delete(
    '/api/bank/reject/:id',
    validateId,
    customErrorHandler,
    Authorize([string.superAdmin]),
    BankServices.rejectBank,
  );

  // API To Edit Bank Details
  app.put(
    '/api/bank-edit/:id',
    validateBankUpdate,
    customErrorHandler,
    Authorize([string.superAdmin, string.transactionView, string.bankView]),
    BankServices.editBank,
  );

  app.get(
    '/api/get-bank-name',
    Authorize([
      string.superAdmin,
      string.bankView,
      string.transactionView,
      string.createTransaction,
      string.createDepositTransaction,
      string.createWithdrawTransaction,
    ]),
    BankServices.getBankNames,
  );

  app.get(
    '/api/get-activeBank-name',
    validatePagination,
    customErrorHandler,
    Authorize([
      string.superAdmin,
      string.bankView,
      string.transactionView,
      string.createTransaction,
      string.createDepositTransaction,
      string.createWithdrawTransaction,
    ]),
    BankServices.activeBankName,
  );

  app.get(
    '/api/get-single-bank-name/:id',
    validateId,
    customErrorHandler,
    Authorize([string.superAdmin, string.bankView, string.transactionView]),
    BankServices.getSingleBankDetails,
  );

  app.post(
    '/api/admin/add-bank-balance/:id',
    addBankBalanceValidate,
    customErrorHandler,
    Authorize([string.superAdmin, string.bankView, string.transactionView]),
    BankServices.addBankBalance,
  );

  app.post(
    '/api/admin/withdraw-bank-balance/:id',
    withdrawalBankBalanceValidate,
    customErrorHandler,
    Authorize([string.superAdmin, string.bankView, string.transactionView]),
    BankServices.withdrawalBankBalance,
  );

  app.get(
    '/api/admin/bank-name',
    Authorize([
      string.superAdmin,
      string.bankView,
      string.transactionView,
      string.dashboardView,
      string.websiteView,
      string.profileView,
      string.transactionEditRequest,
      string.transactionDeleteRequest,
    ]),
    BankServices.bankName,
  );

  app.get(
    '/api/admin/user-bank-account-summary/:accountNumber', // receives accountNumber in the parameters but sends bankName, so the parameter isn't functioning as expected
    Authorize([string.superAdmin]),
    BankServices.bankAccountSummary,
  );

  app.post(
    '/api/admin/manual-user-bank-account-summary/:bankId',
    validateBankId,
    customErrorHandler,
    Authorize([string.superAdmin, string.bankView, string.transactionView]),
    BankServices.manualBankAccountSummary,
  );

  app.get(
    '/api/superadmin/view-bank-edit-requests',
    validatePagination,
    customErrorHandler,
    Authorize([string.superAdmin]),
    BankServices.viewBankEditRequest,
  );

  app.post(
    '/api/admin/bank/isactive/:bankId',
    validateIsActive,
    customErrorHandler,
    Authorize([string.superAdmin, string.requestAdmin]),
    BankServices.isActive
  );


  // API To Delete Bank Name

  // app.post("/api/delete-bank-name", Authorize(["superAdmin", "Transaction-View", "Bank-View"]), async (req, res) => {
  //   try {
  //     const { bankName } = req.body;
  //     console.log("req.body", bankName);

  //     const bankToDelete = await Bank.findOne({ bankName: bankName }).exec();
  //     if (!bankToDelete) {
  //       return res.status(404).send({ message: "Bank not found" });
  //     }

  //     console.log("bankToDelete", bankToDelete);

  //     const deleteData = await Bank.deleteOne({ _id: bankToDelete._id }).exec();
  //     console.log("deleteData", deleteData);

  //     res.status(200).send({ message: "Bank name removed successfully!" });
  //   } catch (e) {
  //     console.error(e);
  //     res.status(e.code || 500).send({ message: e.message });
  //   }
  // }
  // );

  // API To View Bank Name

  // app.get(
  //   "/api/get-bank-name",
  //   Authorize(["superAdmin", "Bank-View", "Transaction-View", "Create-Transaction", "Create-Deposit-Transaction", "Create-Withdraw-Transaction"]),
  //   async (req, res) => {
  //     console.log('req', req.user)
  //     const {
  //       page,
  //       itemsPerPage
  //     } = req.query;

  //     try {
  //       let dbBankData = await Bank.find().exec();
  //       let bankData = JSON.parse(JSON.stringify(dbBankData));

  //       for (var index = 0; index < bankData.length; index++) {
  //         bankData[index].balance = await AccountServices.getBankBalance(
  //           bankData[index]._id
  //         );
  //         const subAdmins = bankData[index].subAdmins;
  //         const user = req.user.userName;

  //         const userSubAdmin = subAdmins.find(subAdmin => subAdmin.subAdminId === user);

  //         if (userSubAdmin) {
  //           bankData[index].isDeposit = userSubAdmin.isDeposit;
  //           bankData[index].isWithdraw = userSubAdmin.isWithdraw;
  //           bankData[index].isRenew = userSubAdmin.isRenew;
  //           bankData[index].isEdit = userSubAdmin.isEdit;
  //           bankData[index].isDelete = userSubAdmin.isDelete;
  //         }

  //       }
  //       bankData.sort((a, b) => b.createdAt - a.createdAt)

  //       return res.status(200).send(bankData);
  //     } catch (e) {
  //       console.error(e);
  //       res.status(e.code).send({ message: e.message });
  //     }
  //   }
  // );


  // app.post("/api/admin/bank/assign-subadmin/:bankId", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
  //   try {
  //     const bankId = req.params.bankId;
  //     const { subAdminIds } = req.body; // Use subAdminIds as an array in the request body

  //     // First, check if the bank with the given ID exists
  //     const bank = await Bank.findById(bankId);
  //     if (!bank) {
  //       return res.status(404).send({ message: "Bank not found" });
  //     }

  //     for (const subAdminId of subAdminIds) {
  //       bank.subAdminId.push(subAdminId);
  //     }

  //     bank.isActive = true;
  //     await bank.save();

  //     res.status(200).send({ message: "Subadmins assigned successfully" });
  //   } catch (e) {
  //     console.error(e);
  //     res.status(e.code || 500).send({ message: e.message || "Internal server error" });
  //   }
  // });

  app.get('/api/admin/bank/view-subadmin/:subadminId', Authorize(['superAdmin', 'RequestAdmin']), async (req, res) => {
    try {
      const subadminId = req.params.subadminId;
      const dbBankData = await Bank.find({
        'subAdmins.subAdminId': subadminId,
      }).exec();
      let bankData = JSON.parse(JSON.stringify(dbBankData));

      for (var index = 0; index < bankData.length; index++) {
        bankData[index].balance = await BankServices.getBankBalance(bankData[index]._id);
      }

      bankData = bankData.filter((bank) => bank.isActive === true);
      console.log('bankdata', bankData);

      if (bankData.length === 0) {
        return res.status(404).send({ message: 'No bank found' });
      }

      res.status(200).send(bankData);
    } catch (e) {
      console.error(e);
      res.status(e.code || 400).send({ message: e.message || 'Internal server error' });
    }
  });

  app.put('/api/bank/edit-request/:id', Authorize(['superAdmin', 'RequstAdmin', 'Bank-View']), async (req, res) => {
    try {
      const { subAdmins } = req.body;
      const bankId = req.params.id;

      const approvedBankRequest = await Bank.findById(bankId);

      if (!approvedBankRequest) {
        throw { code: 404, message: 'Bank not found!' };
      }

      for (const subAdminData of subAdmins) {
        const { subAdminId, isDeposit, isWithdraw, isDelete, isRenew, isEdit } = subAdminData;
        const subAdmin = approvedBankRequest.subAdmins.find((sa) => sa.subAdminId === subAdminId);

        if (subAdmin) {
          // If subAdmin exists, update its properties
          subAdmin.isDeposit = isDeposit;
          subAdmin.isWithdraw = isWithdraw;
          subAdmin.isEdit = isEdit;
          subAdmin.isRenew = isRenew;
          subAdmin.isDelete = isDelete;
        } else {
          // If subAdmin doesn't exist, add a new one
          approvedBankRequest.subAdmins.push({
            subAdminId,
            isDeposit,
            isWithdraw,
            isEdit,
            isRenew,
            isDelete,
          });
        }
      }

      await approvedBankRequest.save();

      res.status(200).send({ message: 'Updated successfully' });
    } catch (error) {
      res.status(error.code || 500).send({ message: error.message || 'An error occurred' });
    }
  });

  app.delete(
    '/api/bank/delete-subadmin/:bankId/:subAdminId',
    Authorize(['superAdmin', 'RequstAdmin', 'Bank-View']),
    async (req, res) => {
      try {
        const { bankId, subAdminId } = req.params;

        const bank = await Bank.findById(bankId);
        if (!bank) {
          throw { code: 404, message: 'Bank not found!' };
        }

        // Remove the subAdmin with the specified subAdminId
        bank.subAdmins = bank.subAdmins.filter((sa) => sa.subAdminId !== subAdminId);

        await bank.save();

        res.status(200).send({ message: 'SubAdmin removed successfully' });
      } catch (error) {
        res.status(error.code || 500).send({ message: error.message || 'An error occurred' });
      }
    },
  );

  app.get('/api/active-visible-bank', Authorize(['superAdmin', 'RequstAdmin']), async (req, res) => {
    try {
      let getBank = await Bank.find({ isActive: true }).exec();
      let getWebsite = await Website.find({ isActive: true }).exec();
      console.log('web', getWebsite);
      if (getBank.length === 0) {
        return res.status(404).send({ message: 'No bank found' });
      }
      if (getWebsite.length === 0) {
        return res.status(404).send({ message: 'No Website found' });
      }

      const bankNames = getBank.map((bank) => bank.bankName);
      const websiteNames = getWebsite.map((website) => website.websiteName);
      console.log('web', websiteNames);
      return res.send({ bank: bankNames, website: websiteNames });
    } catch (err) {
      console.error(err);
    }
  });
};

export default BankRoutes;
