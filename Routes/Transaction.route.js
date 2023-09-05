import { Authorize } from '../middleware/Authorize.js';
import TransactionServices from '../services/Transaction.services.js';
import { Transaction } from '../models/transaction.js';
import { EditRequest } from '../models/EditRequest.model.js';
import { WebsiteTransaction } from '../models/WebsiteTransaction.model.js';
import { BankTransaction } from "../models/banktransaction.model.js";

const TransactionRoutes = (app) => {

  // API To Create Transaction

  app.post(
    '/api/admin/create/transaction',
    Authorize(['superAdmin']),
    async (req, res) => {
      try {
        const subAdminName = req.user;
        console.log("subAdminName", subAdminName)
        await TransactionServices.createTransaction(req, res, subAdminName);
      } catch (e) {
        console.error(e);
        res.status(e.code || 500).send({ message: e.message || "Internal server error" });
      }
    }
  );

  // API To View Deposit Transaction Details

  app.get(
    '/api/deposit/view',
    Authorize(['superAdmin']),
    async (req, res) => {
      try {
        await TransactionServices.depositView(req, res);
      } catch (e) {
        console.error(e);
        res.status(e.code || 500).send({ message: e.message || "Internal server error" });
      }
    }
  );

  // API To View Withdraw Transaction Details

  app.get(
    '/api/withdraw/view',
    Authorize(['superAdmin']),
    async (req, res) => {
      try {
        await TransactionServices.withdrawView(req, res);
      } catch (e) {
        console.error(e);
        res.status(e.code || 500).send({ message: e.message || "Internal server error" });
      }
    }
  );

  // API To Edit Transaction Detail and Send Request For Approval From Super Admin

  app.put(
    "/api/admin/edit-transaction-request/:id",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const trans = await Transaction.findById(req.params.id);
        const updateResult = await TransactionServices.updateTransaction(trans, req.body);
        console.log(updateResult);
        if (updateResult) {
          res.status(201).send("Transaction update request send to Super Admin");
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.put(
    "/api/admin/edit-bank-transaction-request/:id",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const bankTransaction = await BankTransaction.findById(req.params.id);
        console.log("id", req.params.id)
        const updateResult = await TransactionServices.updateBankTransaction(bankTransaction, req.body);
        console.log(updateResult);
        if (updateResult) {
          res.status(201).send("Bank Transaction update request send to Super Admin");
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );
  
  app.put(
    "/api/admin/edit-website-transaction-request/:id",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const websiteTransaction = await WebsiteTransaction.findById(req.params.id);
        console.log("id", req.params.id)
        const updateResult = await TransactionServices.updateWebsiteTransaction(websiteTransaction, req.body);
        console.log(updateResult);
        if (updateResult) {
          res.status(201).send("Website Transaction update request send to Super Admin");
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );
  
  // API To View Edit Transaction Details

  app.get('/api/superadmin/view-edit-transaction-requests', Authorize(["superAdmin"]), async (req, res) => {
    try {
      const resultArray = await EditRequest.find().exec();
      res.status(200).send(resultArray);
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server error");
    }
  });

  // API To View Approve Transaction Details
  
  app.post("/api/admin/approve-transaction-edit-request/:requestId", Authorize(["superAdmin"]), async (req, res) => {
    try {
    const editRequest = await EditRequest.findById(req.params.requestId);
    if (!editRequest) {
    return res.status(404).send({ message: "Edit request not found" });
    }
    const { isApproved } = req.body;
    if (typeof isApproved !== "boolean") {
    return res.status(400).send({ message: "isApproved field must be a boolean value" });
    }
    if (!editRequest.isApproved) {
    const updatedTransaction = await Transaction.updateOne({ _id: editRequest.id }, {
    transactionID: editRequest.transactionID,
    transactionType: editRequest.transactionType,
    amount: editRequest.amount,
    paymentMethod: editRequest.paymentMethod,
    userId: editRequest.userId,
    subAdminId: editRequest.subAdminId,
    bankName: editRequest.bankName,
    websiteName: editRequest.websiteName,
    remark: editRequest.remark
    });
    console.log("updatedTransaction", updatedTransaction)
    if (updatedTransaction.matchedCount === 0) {
    return res.status(404).send({ message: "Transaction not found" });
    }
    editRequest.isApproved = true;
    if (editRequest.isApproved === true) {
    const deletedEditRequest = await EditRequest.deleteOne({_id : req.params.requestId});
    console.log(deletedEditRequest)
    if (!deletedEditRequest) {
    return res.status(500).send({ message: "Error deleting edit request" });
    }
    }
    return res.status(200).send({ message: "Edit request approved and data updated", updatedTransaction: updatedTransaction });
    } else {
    return res.status(200).send({ message: "Edit request rejected" });
    }
    } catch (e) {
    console.error(e);
    res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
    });
  
    app.post("/api/admin/approve-bank-edit-request/:requestId", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const editRequest = await EditRequest.findById(req.params.requestId);
        if (!editRequest) {
          return res.status(404).send({ message: "Edit request not found" });
        }
        const { isApproved } = req.body;
        if (typeof isApproved !== "boolean") {
          return res.status(400).send({ message: "isApproved field must be a boolean value" });
        }
        if (!editRequest.isApproved) {
          const updatedTransaction = await BankTransaction.updateOne({ _id: editRequest.id },
            {
              transactionType: editRequest.transactionType,
              remark: editRequest.remark,
              withdrawAmount: editRequest.withdrawAmount,
              depositAmount: editRequest.depositAmount,
              beforeBalance: editRequest.beforeBalance,
              currentBalance: editRequest.currentBalance,
              subAdminId: editRequest.subAdminId,
              subAdminName: editRequest.subAdminName,
            }
          );
          console.log("updatedTransaction", updatedTransaction);
          if (updatedTransaction.matchedCount === 0) {
            return res.status(404).send({ message: "Transaction not found" });
          }
          editRequest.isApproved = true;
          if (editRequest.isApproved === true) {
            const deletedEditRequest = await EditRequest.deleteOne({_id: req.params.requestId,});
            console.log(deletedEditRequest);
            if (!deletedEditRequest) {
              return res.status(500).send({ message: "Error deleting edit request" });
            }
          }
          return res.status(200).send({message: "Edit request approved and data updated", updatedTransaction: updatedTransaction,});
        } else {
          return res.status(200).send({ message: "Edit request rejected" });
        }
      } catch (e) {
        console.error(e);
        res.status(e.code || 500).send({ message: e.message || "Internal server error" });
      }
    }
  );

  app.post("/api/admin/approve-website-edit-request/:requestId", Authorize(["superAdmin"]),async (req, res) => {
    try {
      const editRequest = await EditRequest.findById(
        req.params.requestId
      );
      if (!editRequest) {
        return res.status(404).send({ message: "Edit request not found" });
      }
      const { isApproved } = req.body;
      if (typeof isApproved !== "boolean") {
        return res.status(400).send({ message: "isApproved field must be a boolean value" });
      }
      if (!editRequest.isApproved) {
        const updatedTransaction = await WebsiteTransaction.updateOne({ _id: editRequest.id },
          {
              transactionType: editRequest.transactionType,
              remark: editRequest.remark,
              withdrawAmount: editRequest.withdrawAmount,
              depositAmount: editRequest.depositAmount,
              beforeBalance: editRequest.beforeBalance,
              currentBalance: editRequest.currentBalance,
              subAdminId: editRequest.subAdminId,
              subAdminName: editRequest.subAdminName,
          }
        );
        console.log("updatedTransaction", updatedTransaction);
        if (updatedTransaction.matchedCount === 0) {
          return res.status(404).send({ message: "Transaction not found" });
        }
        editRequest.isApproved = true;
        if (editRequest.isApproved === true) {
          const deletedEditRequest = await EditRequest.deleteOne({_id: req.params.requestId,});
          console.log(deletedEditRequest);
          if (!deletedEditRequest) {
            return res.status(500).send({ message: "Error deleting edit request" });
          }
        }
        return res.status(200).send({message: "Edit request approved and data updated",updatedTransaction: updatedTransaction,});
      } else {
        return res.status(200).send({ message: "Edit request rejected" });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
);
};

export default TransactionRoutes;
