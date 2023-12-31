import AccountServices from "../services/Accounts.services.js";
import { Authorize } from "../middleware/Authorize.js";
import { BankTransaction } from "../models/BankTransaction.model.js";
import { WebsiteTransaction } from "../models/WebsiteTransaction.model.js";
import { Transaction } from "../models/transaction.js";
import { EditRequest } from "../models/EditRequest.model.js";
import { EditWebsiteRequest } from "../models/EditWebsiteRequest.model.js"
import { EditBankRequest } from "../models/EditBankRequest.model.js"
import { Bank } from "../models/bank.model.js"
import { Website } from "../models/website.model.js"
import { User } from "../models/user.model.js";
import { IntroducerTransaction } from "../models/IntroducerTransaction.model.js"
import { IntroducerEditRequest } from "../models/IntroducerEditRequest.model.js"
import { IntroducerUser } from "../models/introducer.model.js";
import { introducerUser } from "../services/introducer.services.js";
import { Trash } from "../models/Trash.model.js";

const EditApiRoute = (app) => {

  app.post("/api/admin/save-bank-transaction-request", Authorize(["superAdmin", "Transaction-Delete-Request", "Dashboard-View"]), async (req, res) => {
    try {
      const user = req.user;
      const { requestId } = req.body;
      const transaction = await BankTransaction.findById(requestId);
      if (!transaction) {
        return res.status(404).send("Bank Transaction not found");
      }
      console.log("Transaction found", transaction);
      const updateResult = await AccountServices.deleteBankTransaction(transaction,user);
      console.log(updateResult);
      if (updateResult) {
        res.status(201).send("Bank Transaction to trash request sent to Super Admin");
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });



  app.post("/api/delete-bank-transaction/:id", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      const id = req.params.id;
      const editRequest = await EditRequest.findById(id).exec();
      if (!editRequest) {
        return res.status(404).send({ message: "Bank Request not found" });
      }
      const isApproved = true;
      if (isApproved) {
        await BankTransaction.deleteOne({ _id: editRequest.id }).exec();
        const dataToRestore = {
          bankId: editRequest.bankId,
          transactionType: editRequest.transactionType,
          remarks: editRequest.remarks,
          withdrawAmount: editRequest.withdrawAmount,
          depositAmount: editRequest.depositAmount,
          subAdminId: editRequest.subAdminId,
          subAdminName: editRequest.subAdminName,
          accountHolderName: editRequest.accountHolderName,
          bankName: editRequest.bankName,
          accountNumber: editRequest.accountNumber,
          ifscCode: editRequest.ifscCode,
          createdAt: editRequest.createdAt,
          upiId: editRequest.upiId,
          upiAppName: editRequest.upiAppName,
          upiNumber: editRequest.upiNumber,
          isSubmit: editRequest.isSubmit
        }
        const restoredData = await Trash.create(dataToRestore);
        await EditRequest.deleteOne({ _id: req.params.id }).exec();
        res.status(200).send({ message: "Bank Transaction Moved To Trash", data: restoredData });
      } else {
        res.status(400).send({ message: "Approval request rejected by super admin" });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: "Internal server error" });
    }
  });


  app.post("/api/admin/save-website-transaction-request", Authorize(["superAdmin", "Transaction-Delete-Request", "Dashboard-View"]), async (req, res) => {
    try {
      const user = req.user;
      const { requestId } = req.body;
      const transaction = await WebsiteTransaction.findById(requestId);
      if (!transaction) {
        return res.status(404).send("Website Transaction not found");
      }
      console.log("Transaction found", transaction);
      const updateResult = await AccountServices.deleteWebsiteTransaction(transaction,user);
      console.log(updateResult);
      if (updateResult) {
        res.status(201).send("Website Transaction to trash request sent to Super Admin");
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.post("/api/delete-website-transaction/:id", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      const id = req.params.id;
      const editRequest = await EditRequest.findById(id).exec();
      if (!editRequest) {
        return res.status(404).send({ message: "Edit Website Request not found" });
      }
      const isApproved = true;
      if (isApproved) {
        await WebsiteTransaction.deleteOne({ _id: editRequest.id }).exec();
        const dataToRestore = {
          websiteId: editRequest.websiteId,
          transactionType: editRequest.transactionType,
          remarks: editRequest.remarks,
          withdrawAmount: editRequest.withdrawAmount,
          depositAmount: editRequest.depositAmount,
          subAdminId: editRequest.subAdminId,
          subAdminName: editRequest.subAdminName,
          websiteName: editRequest.websiteName,
          createdAt: editRequest.createdAt,
          }
          const restoredData = await Trash.create(dataToRestore);
        await EditRequest.deleteOne({ _id: req.params.id }).exec();
        res.status(200).send({ message: "Website Transaction Moved To Trash", data: restoredData });
      } else {
        res.status(400).send({ message: "Approval request rejected by super admin" });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: "Internal server error" });
    }
  });


  app.post("/api/admin/save-transaction-request", Authorize(["superAdmin", "Transaction-Delete-Request", "Dashboard-View"]), async (req, res) => {
    try {
      const user = req.user;
      console.log("object",user);
      const { requestId } = req.body;
      const transaction = await Transaction.findById(requestId);
      if (!transaction) {
        return res.status(404).send("Transaction not found");
      }
      const updateResult = await AccountServices.deleteTransaction(transaction, user);
      console.log(updateResult);
      if (updateResult) {
        res.status(201).send("Transaction to trash request sent to Super Admin");
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.post("/api/delete-transaction/:id", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      const id = req.params.id;
      const editRequest = await EditRequest.findById(id).exec();
      if (!editRequest) {
        return res.status(404).send({ message: "Edit Website Request not found" });
      }
      const isApproved = true;
      if (isApproved) {
        await Transaction.deleteOne({ _id: editRequest.id }).exec();
        const dataToRestore = {
          bankId: editRequest.bankId,
          websiteId: editRequest.websiteId,
          transactionID: editRequest.transactionID,
          transactionType: editRequest.transactionType,
          remarks: editRequest.remarks,
          amount: editRequest.amount,
          subAdminId: editRequest.subAdminId,
          subAdminName: editRequest.subAdminName,
          introducerUserName: editRequest.introducerUserName,
          userId: editRequest.userId,
          userName: editRequest.userName,
          paymentMethod: editRequest.paymentMethod,
          websiteName: editRequest.websiteName,
          bankName: editRequest.bankName,
          amount: editRequest.amount,
          bonus: editRequest.bonus,
          bankCharges: editRequest.bankCharges,
          createdAt: editRequest.createdAt,
        }
        const restoredData = await Trash.create(dataToRestore);
        await EditRequest.deleteOne({ _id: req.params.id }).exec();
        await User.updateOne(
          { "transactionDetail._id": editRequest.id },
          { $pull: { transactionDetail: { _id: editRequest.id } } }
        ).exec();
        res.status(200).send({ message: "Transaction moved to Trash", data: restoredData });
      } else {
        res.status(400).send({ message: "Approval request rejected by super admin" });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.post("/api/admin/save-introducer-transaction-request", Authorize(["superAdmin", "Transaction-Delete-Request", "Dashboard-View"]), async (req, res) => {
    try {
      const user = req.user;
      const { requestId } = req.body;
      const transaction = await IntroducerTransaction.findById(requestId);
      if (!transaction) {
        return res.status(404).send("Transaction not found");
      }
      console.log("Transaction found", transaction);
      const updateResult = await AccountServices.deleteIntroducerTransaction(transaction,user);
      console.log(updateResult);
      if (updateResult) {
        res.status(201).send("Transaction delete request sent to Super Admin");
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });



  app.post("/api/delete-introducer-transaction/:id", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      const id = req.params.id;
      const editRequest = await IntroducerEditRequest.findById(id).exec();
      if (!editRequest) {
        return res.status(404).send({ message: "Edit Request not found" });
      }
      const isApproved = true;
      if (isApproved) {
        await IntroducerTransaction.deleteOne({ _id: editRequest.id }).exec();
        const dataToRestore = {
          introUserId: editRequest.introUserId,
          amount: editRequest.amount,
          transactionType: editRequest.transactionType,
          remarks: editRequest.remarks,
          subAdminId: editRequest.subAdminId,
          subAdminName: editRequest.subAdminName,
          introducerUserName: editRequest.introducerUserName,
          createdAt: editRequest.createdAt
        }
        const restoredData = await Trash.create(dataToRestore);
        await IntroducerEditRequest.deleteOne({ _id: req.params.id }).exec();
        res.status(200).send({ message: "Transaction moved to Trash", data: restoredData });
      } else {
        res.status(400).send({ message: "Approval request rejected by super admin" });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: "Internal server error" });
    }
  });


  app.delete("/api/reject/:id", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      const id = req.params.id;
      const result = await EditRequest.deleteOne({ _id: id });
      if (result.deletedCount === 1) {
        res.status(200).send({ message: "Data deleted successfully" });
      } else {
        res.status(404).send({ message: "Data not found" });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: e.message });
    }
  });

  //   API For Bank Detail Edit approval

  app.post("/api/admin/approve-bank-detail-edit-request/:requestId", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      const editRequest = await EditBankRequest.findById(req.params.requestId);
      if (!editRequest) {
        return res.status(404).send({ message: "Edit request not found" });
      }
      const { isApproved } = req.body;
      if (typeof isApproved !== "boolean") {
        return res.status(400).send({ message: "isApproved field must be a boolean value" });
      }
      if (!editRequest.isApproved) {
        const updatedTransaction = await Bank.updateOne({ _id: editRequest.id },
          {
            accountHolderName: editRequest.accountHolderName,
            bankName: editRequest.bankName,
            accountNumber: editRequest.accountNumber,
            ifscCode: editRequest.ifscCode,
            upiId: editRequest.upiId,
            upiAppName: editRequest.upiAppName,
            upiNumber: editRequest.upiNumber,
          }
        );
        console.log("updatedTransaction", updatedTransaction);
        if (updatedTransaction.matchedCount === 0) {
          return res.status(404).send({ message: "Bank Details not found" });
        }
        editRequest.isApproved = true;
        if (editRequest.isApproved === true) {
          const deletedEditRequest = await EditBankRequest.deleteOne({ _id: req.params.requestId, });
          console.log(deletedEditRequest);
          if (!deletedEditRequest) {
            return res.status(500).send({ message: "Error deleting edit request" });
          }
        }
        return res.status(200).send({ message: "Edit request approved and data updated", updatedTransaction: updatedTransaction, });
      } else {
        return res.status(200).send({ message: "Edit request rejected" });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
  }
  );

  // API for Website name Edit API

  app.post("/api/admin/approve-website-detail-edit-request/:requestId", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      const editRequest = await EditWebsiteRequest.findById(req.params.requestId);
      if (!editRequest) {
        return res.status(404).send({ message: "Edit request not found" });
      }
      const { isApproved } = req.body;
      if (typeof isApproved !== "boolean") {
        return res.status(400).send({ message: "isApproved field must be a boolean value" });
      }
      if (!editRequest.isApproved) {
        const updatedTransaction = await Website.updateOne({ _id: editRequest.id },
          {
            websiteName: editRequest.websiteName,
          }
        );
        console.log("updatedTransaction", updatedTransaction);
        if (updatedTransaction.matchedCount === 0) {
          return res.status(404).send({ message: "Website Name not found" });
        }
        editRequest.isApproved = true;
        if (editRequest.isApproved === true) {
          const deletedEditRequest = await EditWebsiteRequest.deleteOne({ _id: req.params.requestId, });
          console.log(deletedEditRequest);
          if (!deletedEditRequest) {
            return res.status(500).send({ message: "Error deleting edit request" });
          }
        }
        return res.status(200).send({ message: "Edit request approved and data updated", updatedTransaction: updatedTransaction, });
      } else {
        return res.status(200).send({ message: "Edit request rejected" });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
  }
  );


  app.post("/api/admin/save-bank-request", Authorize(["superAdmin", "Transaction-View", "Bank-View"]), async (req, res) => {
    try {
      const { requestId } = req.body;
      console.log(requestId);
      const transaction = await Bank.findById(requestId);
      if (!transaction) {
        return res.status(404).send("Bank not found");
      }
      console.log("Transaction found", transaction);
      const updateResult = await AccountServices.deleteBank(transaction, req.body);
      console.log(updateResult);
      if (updateResult) {
        res.status(201).send("Bank delete request sent to Super Admin");
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.post("/api/delete-bank/:id", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      const id = req.params.id;
      const editRequest = await EditBankRequest.findById(id).exec();

      if (!editRequest) {
        return res.status(404).send({ message: "Bank Request not found" });
      }

      const isApproved = true;

      if (isApproved) {
        await Bank.deleteOne({ _id: editRequest.id }).exec();
        await EditBankRequest.deleteOne({ _id: req.params.id }).exec();
        res.status(200).send({ message: "Bank deleted" });
      } else {
        res.status(400).send({ message: "Approval request rejected by super admin" });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.post("/api/admin/save-website-request", Authorize(["superAdmin", "Transaction-View", "Website-View"]), async (req, res) => {
    try {
      const { requestId } = req.body;
      console.log(requestId);
      const transaction = await Website.findById(requestId);
      if (!transaction) {
        return res.status(404).send("Bank not found");
      }
      console.log("Transaction found", transaction);
      const updateResult = await AccountServices.deleteWebsite(transaction, req.body);
      console.log(updateResult);
      if (updateResult) {
        res.status(201).send("Website Delete request sent to Super Admin");
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.post("/api/delete-website/:id", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      const id = req.params.id;
      const editRequest = await EditWebsiteRequest.findById(id).exec();

      if (!editRequest) {
        return res.status(404).send({ message: "Website Request not found" });
      }

      const isApproved = true;

      if (isApproved) {
        await Website.deleteOne({ _id: editRequest.id }).exec();
        await EditWebsiteRequest.deleteOne({ _id: req.params.id }).exec();
        res.status(200).send({ message: "Website deleted" });
      } else {
        res.status(400).send({ message: "Approval request rejected by super admin" });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.delete("/api/reject/bank-detail/:id", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      const id = req.params.id;
      const result = await EditBankRequest.deleteOne({ _id: id });
      if (result.deletedCount === 1) {
        res.status(200).send({ message: "Data deleted successfully" });
      } else {
        res.status(404).send({ message: "Data not found" });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: e.message });
    }
  });

  app.delete("/api/reject/website-detail/:id", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      const id = req.params.id;
      const result = await EditWebsiteRequest.deleteOne({ _id: id });
      if (result.deletedCount === 1) {
        res.status(200).send({ message: "Data deleted successfully" });
      } else {
        res.status(404).send({ message: "Data not found" });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: e.message });
    }
  });

  app.put(
    "/api/intoducer-name-edit/:id",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const id = await IntroducerUser.findById(req.params.id);
        const updateResult = await introducerUser.updateIntroducerProfile(id, req.body);
        console.log(updateResult);
        if (updateResult) {
          res.status(201).send("Profile updated");
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

};

export default EditApiRoute;
