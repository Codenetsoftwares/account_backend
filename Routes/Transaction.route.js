import { Authorize } from '../middleware/Authorize.js';
import TransactionServices from '../services/Transaction.services.js';
import { Transaction } from '../models/transaction.js';
import { EditRequest } from '../models/EditRequest.model.js';
import { WebsiteTransaction } from '../models/WebsiteTransaction.model.js';
import { BankTransaction } from "../models/BankTransaction.model.js";
import { IntroducerTransaction } from "../models/IntroducerTransaction.model.js"
import { IntroducerEditRequest } from "../models/IntroducerEditRequest.model.js"
import AccountServices from "../services/Accounts.services.js";
import { User } from '../models/user.model.js';

const TransactionRoutes = (app) => {

  // API To Create Transaction

  app.post(
    '/api/admin/create/transaction',
    Authorize(["superAdmin", "Dashboard-View","Create-Deposit-Transaction", "Create-Withdraw-Transaction", "Create-Transaction"]),
    async (req, res) => {
      try {
        const subAdminName = req.user;
        await TransactionServices.createTransaction(req, res, subAdminName);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
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
        res.status(e.code).send({ message: e.message });
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
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  // API To Edit Transaction Detail and Send Request For Approval From Super Admin

  app.put(
    "/api/admin/edit-transaction-request/:id",
    Authorize(["superAdmin", "Dashboard-View", "Transaction-Edit-Request"]),
    async (req, res) => {
      try {
        const trans = await Transaction.findById(req.params.id);
        const updateResult = await TransactionServices.updateTransaction(trans, req.body);
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
    Authorize(["superAdmin", "Dashboard-View", "Transaction-Edit-Request"]),
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
    Authorize(["superAdmin", "Dashboard-View", "Transaction-Edit-Request"]),
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

  app.put(
    "/api/admin/edit-introducer-transaction-request/:id",
    Authorize(["superAdmin", "Dashboard-View", "Transaction-Edit-Request"]),
    async (req, res) => {
      try {
        const trans = await IntroducerTransaction.findById(req.params.id);
        const updateResult = await TransactionServices.updateIntroTransaction(trans, req.body);
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
      const dbBankData = await EditRequest.find().exec();
      // let bankData = JSON.parse(JSON.stringify(dbBankData));
      // for (var index = 0; index < bankData.length; index++) {
      //   bankData[index].balance = await AccountServices.getEditedBankBalance(
      //     bankData[index]._id
      //   );
      // }
      res.status(200).send(dbBankData);
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server error");
    }
  });

  app.get('/api/superadmin/view-edit-introducer-transaction-requests', Authorize(["superAdmin"]), async (req, res) => {
    try {
      const introEdit = await IntroducerEditRequest.find().exec();
      res.status(200).send(introEdit);
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
          remarks: editRequest.remarks,
        });
        const user = await User.findOne({
          "transactionDetail": {
            $elemMatch: { "_id": editRequest.id }
          }
        });
        console.log("user", user)
        if (!user) {
          return res.status(404).json({ status: false, message: "User not found" });
        }
        // Find the specific transactionDetail within the user's document and update its fields
        const transactionIndex = user.transactionDetail.findIndex(transaction => transaction._id.toString() === editRequest.id.toString());
        if (transactionIndex !== -1) {
          user.transactionDetail[transactionIndex].transactionID = editRequest.transactionID;
          user.transactionDetail[transactionIndex].transactionType = editRequest.transactionType;
          user.transactionDetail[transactionIndex].amount = editRequest.amount;
          user.transactionDetail[transactionIndex].paymentMethod = editRequest.paymentMethod;
          user.transactionDetail[transactionIndex].userId = editRequest.userId;
          user.transactionDetail[transactionIndex].subAdminId = editRequest.subAdminId;
          user.transactionDetail[transactionIndex].bankName = editRequest.bankName;
          user.transactionDetail[transactionIndex].websiteName = editRequest.websiteName;
          user.transactionDetail[transactionIndex].remarks = editRequest.remarks;
          // Update other fields as needed
        
          // Save the updated user document
          await user.save();}
        console.log("updatedTransaction", updatedTransaction)
        if (updatedTransaction.matchedCount === 0) {
          return res.status(404).send({ message: "Transaction not found" });
        }
        editRequest.isApproved = true;
        if (editRequest.isApproved === true) {
          const deletedEditRequest = await EditRequest.deleteOne({ _id: req.params.requestId });
          console.log(deletedEditRequest)
          if (!deletedEditRequest) {
            return res.status(500).send({ message: "Error deleting edit request" });
          }
          
          return res.status(200).send({
            message: "Edit request approved and data updated",
            updatedTransaction,})
        } else {
          return res.status(200).send({ message: "Edit request rejected" });
        }
      } else {
        return res.status(200).send({ message: "Edit request rejected" });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
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
        const updatedTransaction = await BankTransaction.updateOne({ _id: editRequest.id }, {
          transactionType: editRequest.transactionType,
          remarks: editRequest.remarks,
          withdrawAmount: editRequest.withdrawAmount,
          depositAmount: editRequest.depositAmount,
          subAdminId: editRequest.subAdminId,
          subAdminName: editRequest.subAdminName,
        });
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
             
          return res.status(200).send({
            message: "Edit request approved and data updated",
            updatedTransaction,
          });
        } else {
          return res.status(200).send({ message: "Edit request rejected" });
        }
      } else {
        return res.status(200).send({ message: "Edit request rejected" });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });
  

  app.post("/api/admin/approve-website-edit-request/:requestId", Authorize(["superAdmin"]), async (req, res) => {
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
        const updatedTransaction = await WebsiteTransaction.updateOne({ _id: editRequest.id }, {
          transactionType: editRequest.transactionType,
          remarks: editRequest.remarks,
          withdrawAmount: editRequest.withdrawAmount,
          depositAmount: editRequest.depositAmount,
          currentWebsiteBalance : editRequest.currentWebsiteBalance,
          subAdminId: editRequest.subAdminId,
          subAdminName: editRequest.subAdminName,
        });
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
  
          return res.status(200).send({
            message: "Edit request approved and data updated",
            updatedTransaction,
          });
        } else {
          return res.status(200).send({ message: "Edit request rejected" });
        }
      } else {
        return res.status(200).send({ message: "Edit request rejected" });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });
 
  app.get("/api/all/transaction/pages/:requestId",async(req,res)=>{
       
    try {
      const page = req.query.page * 1 || 1;
      const limit = req.query.limit * 1 || 10;
      const skip = (page - 1) * limit;     
      const bankTransaction = await BankTransaction.find().limit(limit).skip(skip);      
      res.status(200).json({ bankTransaction });
    } catch (error) {
      console.log(error); 
    }
  });
  
  app.post("/api/admin/approve-introducer-edit-request/:requestId", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const editRequest = await IntroducerEditRequest.findById(req.params.requestId);
      if (!editRequest) {
        return res.status(404).send({ message: "Edit request not found" });
      }
      const { isApproved } = req.body;
      if (typeof isApproved !== "boolean") {
        return res.status(400).send({ message: "isApproved field must be a boolean value" });
      }
      if (!editRequest.isApproved) {
        const updatedTransaction = await IntroducerTransaction.updateOne({ _id: editRequest.id }, {
          transactionType: editRequest.transactionType,
          remarks: editRequest.remarks,
          amount: editRequest.amount,
          subAdminId: editRequest.subAdminId,
          subAdminName: editRequest.subAdminName,
          introducerUserName: editRequest.introducerUserName,
        });
        console.log("updatedTransaction", updatedTransaction);
        if (updatedTransaction.matchedCount === 0) {
          return res.status(404).send({ message: "Transaction not found" });
        }
        editRequest.isApproved = true;
        if (editRequest.isApproved === true) {
          const deletedEditRequest = await IntroducerEditRequest.deleteOne({_id: req.params.requestId,});
          console.log(deletedEditRequest);
          if (!deletedEditRequest) {
            return res.status(500).send({ message: "Error deleting edit request" });
          }
  
          return res.status(200).send({
            message: "Edit request approved and data updated",
            updatedTransaction,
          });
        } else {
          return res.status(200).send({ message: "Edit request rejected" });
        }
      } else {
        return res.status(200).send({ message: "Edit request rejected" });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });
};

export default TransactionRoutes;
