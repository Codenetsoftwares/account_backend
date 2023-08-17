import { Authorize } from '../middleware/Authorize.js';
import TransactionServices from '../services/Transaction.services.js';
import { Transaction } from '../models/transaction.js';
import { EditRequest } from '../models/EditRequest.model.js';

const TransactionRoutes = (app) => {

  // API To Create Transaction

  app.post(
    '/api/admin/create/transaction',
    Authorize(['superAdmin']),
    async (req, res) => {
      try {
        await TransactionServices.createTransaction(req, res);
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
        console.log("id", req.params.id)
        const updateResult = await TransactionServices.update(trans, req.body);
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
  
  app.post("/api/admin/approve-edit-request/:requestId", Authorize(["superAdmin"]), async (req, res) => {
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

};

export default TransactionRoutes;
