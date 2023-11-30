import { Authorize } from "../middleware/Authorize.js";
import { BankTransaction } from "../models/BankTransaction.model.js";
import { IntroducerTransaction } from "../models/IntroducerTransaction.model.js";
import { Trash } from "../models/Trash.model.js";
import { WebsiteTransaction } from "../models/WebsiteTransaction.model.js";
import { Transaction } from "../models/transaction.js";
import AccountServices from "../services/Accounts.services.js";

const DeleteAPIRoute = (app) => {

  app.post("/api/admin/move-bank-transaction-to-trash", Authorize(["superAdmin", "Transaction-Delete-Request", "Dashboard-View"]), async (req, res) => {
    try {
      const { requestId } = req.body;
      const transaction = await BankTransaction.findById(requestId);
      if (!transaction) {
        return res.status(404).send("Bank Transaction not found");
      }
      const updateResult = await AccountServices.trashBankTransaction(transaction);
      if (updateResult) {
        res.status(201).send("Bank Transaction Moved To Trash");
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.get("/api/admin/view-trash", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const resultArray = await Trash.find().exec();
      res.status(200).send(resultArray);
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server error");
    }
  });

  app.post("/api/admin/move-website-transaction-to-trash", Authorize(["superAdmin", "Transaction-Delete-Request", "Dashboard-View"]), async (req, res) => {
    try {
      const { requestId } = req.body;
      const transaction = await WebsiteTransaction.findById(requestId);
      if (!transaction) {
        return res.status(404).send("Website Transaction not found");
      }
      const updateResult = await AccountServices.trashWebsiteTransaction(transaction);
      if (updateResult) {
        res.status(201).send("Website Transaction Moved To Trash");
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.post("/api/admin/move-transaction-to-trash", Authorize(["superAdmin", "Transaction-Delete-Request", "Dashboard-View"]), async (req, res) => {
    try {
      const { requestId } = req.body;
      const transaction = await Transaction.findById(requestId);
      if (!transaction) {
        return res.status(404).send("Transaction not found");
      }
      const updateResult = await AccountServices.trashTransaction(transaction);
      if (updateResult) {
        res.status(201).send("Transaction Moved To Trash");
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.post("/api/admin/move-introducer-transaction-to-trash", Authorize(["superAdmin", "Transaction-Delete-Request", "Dashboard-View"]), async (req, res) => {
    try {
      const { requestId } = req.body;
      const transaction = await IntroducerTransaction.findById(requestId);
      if (!transaction) {
        return res.status(404).send("Transaction not found");
      }
      const updateResult = await AccountServices.trashIntroducerTransaction(transaction);
      if (updateResult) {
        res.status(201).send("Transaction Moved To Trash");
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.delete("/api/delete/transactions/:id", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const id = req.params.id;
      const result = await Trash.deleteOne({ _id: id });
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

  app.post("/api/restore/data/:bankName", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const bankName = req.params.bankName;
      const deletedData = await Trash.findOne({ bankName }).exec();
      console.log("first", deletedData);
      if (!deletedData) {
        return res.status(404).send({ message: "Data not found in Trash" });
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
        createdAt: deletedData.createdAt
      }
      const restoredData = await BankTransaction.create(dataToRestore);
      await Trash.findByIdAndDelete(deletedData._id);
      res.status(200).send({ message: "Data restored successfully", data: restoredData });
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: e.message });
    }
  });
  
  
}

export default DeleteAPIRoute;