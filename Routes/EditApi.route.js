import AccountServices from "../services/Accounts.services.js";
import { Admin } from "../models/admin_user.js";
import { Authorize } from "../middleware/Authorize.js";
import { Bank } from "../models/bank.model.js";
import { Website } from "../models/website.model.js";
import { User } from "../models/user.model.js";
import { BankTransaction } from "../models/banktransaction.model.js";
import { WebsiteTransaction } from "../models/WebsiteTransaction.model.js";
import { Transaction } from "../models/transaction.js";
import { introducerUser } from "../services/introducer.services.js";
import { IntroducerUser } from "../models/introducer.model.js";
import { EditBankRequest } from "../models/EditBankRequest.model.js";
import { EditWebsiteRequest } from "../models/EditWebsiteRequest.model.js";

const EditApiRoute = (app) => {
  // Edit Request For Bank Transaction

  app.put("/api/admin/bank-edit-transaction-request/:id", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const id = await BankTransaction.findById(req.params.id);
        console.log("id", req.params.id);
        const updateResult = await AccountServices.updateBankTransaction(id,req.body);
        console.log(updateResult);
        if (updateResult) {res.status(201).send("Bank Transaction update request send to Super Admin");
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get("/api/superadmin/view-bank-edit-transaction-requests", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const resultArray = await EditBankRequest.find().exec();
        res.status(200).send(resultArray);
      } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server error");
      }
    }
  );

  app.post("/api/admin/approve-bank-edit-request/:requestId", Authorize(["superAdmin"]), async (req, res) => {
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
            const deletedEditRequest = await EditBankRequest.deleteOne({_id: req.params.requestId,});
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

  app.put("/api/admin/bank-website-transaction-request/:id", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const id = await WebsiteTransaction.findById(req.params.id);
        console.log("id", req.params.id);
        const updateResult = await AccountServices.updateWebsiteTransaction(id,req.body);
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

  app.get("/api/superadmin/view-website-edit-transaction-requests", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const resultArray = await EditWebsiteRequest.find().exec();
        res.status(200).send(resultArray);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.post("/api/admin/approve-website-edit-request/:requestId", Authorize(["superAdmin"]),async (req, res) => {
      try {
        const editRequest = await EditWebsiteRequest.findById(
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
            const deletedEditRequest = await EditWebsiteRequest.deleteOne({_id: req.params.requestId,});
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
 
//   API For Bank Detail Edit approval 

app.post("/api/admin/approve-bank-detail-edit-request/:requestId", Authorize(["superAdmin"]), async (req, res) => {
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
          const deletedEditRequest = await EditBankRequest.deleteOne({_id: req.params.requestId,});
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

app.post("/api/admin/approve-website-detail-edit-request/:requestId", Authorize(["superAdmin"]), async (req, res) => {
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
          const deletedEditRequest = await EditWebsiteRequest.deleteOne({_id: req.params.requestId,});
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


app.get("/api/admin/save-bank-transaction-request/:id", Authorize(["superAdmin"]), async (req, res) => {
  try {
    const id = await BankTransaction.findById(req.params.id);
    console.log("id", req.params.id);
    const updateResult = await AccountServices.deleteBankTransaction(id,req.body);
    console.log(updateResult);
    if (updateResult) {res.status(201).send("Bank Transaction delete request send to Super Admin");
    }
  } catch (e) {
    console.error(e);
    res.status(e.code).send({ message: e.message });
  }
}
);


app.post("/api/delete-bank-transaction/:id", Authorize(["superAdmin"]), async (req, res) => {
  try {
    const id = req.params.id;
    const editRequest = await EditBankRequest.findById(id).exec();

    if (!editRequest) {
      return res.status(404).send({ message: "Edit Bank Request not found" });
    }

    const isApproved = true;

    if (isApproved) {
      await BankTransaction.deleteOne({ _id: editRequest.id }).exec();
      await EditBankRequest.deleteOne({ _id: req.params.id }).exec();
      res.status(200).send({ message: "Bank Transaction deleted" });
    } else {
      res.status(400).send({ message: "Approval request rejected by super admin" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Internal server error" });
  }
});


app.get("/api/admin/save-website-transaction-request/:id", Authorize(["superAdmin"]), async (req, res) => {
  try {
    const id = await WebsiteTransaction.findById(req.params.id);
    console.log("id", req.params.id);
    const updateResult = await AccountServices.deleteWebsiteTransaction(id,req.body);
    console.log(updateResult);
    if (updateResult) {res.status(201).send("Website Transaction delete request send to Super Admin");
    }
  } catch (e) {
    console.error(e);
    res.status(e.code).send({ message: e.message });
  }
}
);


app.post("/api/delete-website-transaction/:id", Authorize(["superAdmin"]), async (req, res) => {
  try {
    const id = req.params.id;
    const editRequest = await EditWebsiteRequest.findById(id).exec();

    if (!editRequest) {
      return res.status(404).send({ message: "Edit Website Request not found" });
    }

    const isApproved = true;

    if (isApproved) {
      await WebsiteTransaction.deleteOne({ _id: editRequest.id }).exec();
      await EditWebsiteRequest.deleteOne({ _id: req.params.id }).exec();
      res.status(200).send({ message: "Bank Transaction deleted" });
    } else {
      res.status(400).send({ message: "Approval request rejected by super admin" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Internal server error" });
  }
});
};

export default EditApiRoute;
