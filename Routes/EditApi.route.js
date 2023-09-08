import AccountServices from "../services/Accounts.services.js";
import { Authorize } from "../middleware/Authorize.js";
import { BankTransaction } from "../models/BankTransaction.model.js";
import { WebsiteTransaction } from "../models/WebsiteTransaction.model.js";
import { Transaction } from "../models/transaction.js";
import { EditRequest } from "../models/EditRequest.model.js";

const EditApiRoute = (app) => {

  app.post("/api/admin/save-bank-transaction-request", Authorize(["superAdmin", "Transaction-Delete-Request", "Dashboard-View"]), async (req, res) => {
    try {
      const { requestId } = req.body;
      console.log(requestId);
      const transaction = await BankTransaction.findById(requestId);
      if (!transaction) {
        return res.status(404).send("Bank Transaction not found");
      }
      console.log("Transaction found", transaction);
      const updateResult = await AccountServices.deleteBankTransaction(transaction, req.body);
      console.log(updateResult);
      if (updateResult) {
        res.status(201).send("Bank Transaction delete request sent to Super Admin");
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });
  


app.post("/api/delete-bank-transaction/:id", Authorize(["superAdmin"]), async (req, res) => {
  try {
    const id = req.params.id;
    const editRequest = await EditRequest.findById(id).exec();

    if (!editRequest) {
      return res.status(404).send({ message: "Edit Bank Request not found" });
    }

    const isApproved = true;

    if (isApproved) {
      await BankTransaction.deleteOne({ _id: editRequest.id }).exec();
      await EditRequest.deleteOne({ _id: req.params.id }).exec();
      res.status(200).send({ message: "Bank Transaction deleted" });
    } else {
      res.status(400).send({ message: "Approval request rejected by super admin" });
    }
  } catch (e) {
    console.error(e);
    res.status(e.code).send({ message: e.message });
  }
});


app.post("/api/admin/save-website-transaction-request", Authorize(["superAdmin", "Transaction-Delete-Request", "Dashboard-View"]), async (req, res) => {
  try {
    const { requestId } = req.body;
    console.log(requestId);
    const transaction = await WebsiteTransaction.findById(requestId);
    if (!transaction) {
      return res.status(404).send("Website Transaction not found");
    }
    console.log("Transaction found", transaction);
    const updateResult = await AccountServices.deleteWebsiteTransaction(transaction, req.body);
    console.log(updateResult);
    if (updateResult) {
      res.status(201).send("Website Transaction delete request sent to Super Admin");
    }
  } catch (e) {
    console.error(e);
    res.status(e.code).send({ message: e.message });
  }
});

app.post("/api/delete-website-transaction/:id", Authorize(["superAdmin"]), async (req, res) => {
  try {
    const id = req.params.id;
    const editRequest = await EditRequest.findById(id).exec();

    if (!editRequest) {
      return res.status(404).send({ message: "Edit Website Request not found" });
    }

    const isApproved = true;

    if (isApproved) {
      await WebsiteTransaction.deleteOne({ _id: editRequest.id }).exec();
      await EditRequest.deleteOne({ _id: req.params.id }).exec();
      res.status(200).send({ message: "Bank Transaction deleted" });
    } else {
      res.status(400).send({ message: "Approval request rejected by super admin" });
    }
  } catch (e) {
    console.error(e);
    res.status(e.code).send({ message: e.message });
  }
});

app.post("/api/admin/save-transaction-request", Authorize(["superAdmin", "Transaction-Delete-Request", "Dashboard-View"]), async (req, res) => {
  try {
    const { requestId } = req.body;
    console.log(requestId);
    const transaction = await Transaction.findById(requestId);
    if (!transaction) {
      return res.status(404).send("Transaction not found");
    }
    console.log("Transaction found", transaction);
    const updateResult = await AccountServices.deleteTransaction(transaction, req.body);
    console.log(updateResult);
    if (updateResult) {
      res.status(201).send("Transaction delete request sent to Super Admin");
    }
  } catch (e) {
    console.error(e);
    res.status(e.code).send({ message: e.message });
  }
});

app.post("/api/delete-transaction/:id", Authorize(["superAdmin"]), async (req, res) => {
  try {
    const id = req.params.id;
    const editRequest = await EditRequest.findById(id).exec();

    if (!editRequest) {
      return res.status(404).send({ message: "Edit Website Request not found" });
    }

    const isApproved = true;

    if (isApproved) {
      await Transaction.deleteOne({ _id: editRequest.id }).exec();
      await EditRequest.deleteOne({ _id: req.params.id }).exec();
      res.status(200).send({ message: "Bank Transaction deleted" });
    } else {
      res.status(400).send({ message: "Approval request rejected by super admin" });
    }
  } catch (e) {
    console.error(e);
    res.status(e.code).send({ message: e.message });
  }
});

app.delete("/api/reject/:id", Authorize(["superAdmin"]), async (req, res) => {
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

};

export default EditApiRoute;
