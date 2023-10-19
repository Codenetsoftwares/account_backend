import AccountServices from "../services/Accounts.services.js";
import { Authorize } from "../middleware/Authorize.js";
import { Bank } from "../models/bank.model.js";
import { BankTransaction } from "../models/BankTransaction.model.js";
import { Transaction } from "../models/transaction.js";
import { EditBankRequest } from "../models/EditBankRequest.model.js";
import lodash from "lodash";

const BankRoutes = (app) => {
  // API To Add Bank Name

  app.post(
    "/api/add-bank-name",
    Authorize(["superAdmin", "Bank-View", "Transaction-View"]),
    async (req, res) => {
      try {
        const userName = req.user;
        const {
          accountHolderName,
          bankName,
          accountNumber,
          ifscCode,
          upiId,
          upiAppName,
          upiNumber,
          isActive

        } = req.body;
        if (!bankName) {
          throw { code: 400, message: "Please provide a bank name to add" };
        }
        const newBankName = new Bank({
          accountHolderName: accountHolderName,
          bankName: bankName,
          accountNumber: accountNumber,
          ifscCode: ifscCode,
          upiId: upiId,
          upiAppName: upiAppName,
          upiNumber: upiNumber,
          subAdminId: userName.userName,
          subAdminName: userName.firstname,
          isActive: isActive
        });
        const id = await Bank.find(req.params.id);
        id.map((data) => {
          console.log(data.bankName);
          if (
            newBankName.bankName.toLocaleLowerCase() ===
            data.bankName.toLocaleLowerCase()
          ) {
            throw { code: 400, message: "Bank name exists already!" };
          }
        });
        await newBankName.save();
        res.status(200).send({ message: "Bank name registered successfully!" });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  // API To Edit Bank Details

  app.put(
    "/api/bank-edit/:id",
    Authorize(["superAdmin", "Bank-View", "Transaction-View"]),
    async (req, res) => {
      try {
        const id = await Bank.findById(req.params.id);
        // console.log("id", id);
        const updateResult = await AccountServices.updateBank(id, req.body);
        console.log(updateResult);
        if (updateResult) {
          res
            .status(201)
            .send("Bank Detail's sent to Super Admin for Approval");
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
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

  app.get(
    "/api/get-bank-name",
    Authorize(["superAdmin", "Bank-View", "Transaction-View", "Create-Transaction", "Create-Deposit-Transaction", "Create-Withdraw-Transaction"]),
    async (req, res) => {
      try {
        let dbBankData = await Bank.find().exec();
        let bankData = JSON.parse(JSON.stringify(dbBankData));

        for (var index = 0; index < bankData.length; index++) {
          bankData[index].balance = await AccountServices.getBankBalance(
            bankData[index]._id
          );
        }
        // console.log('bankd', bankData)
        res.status(200).send(bankData);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  // API To View Single Bank Name

  app.get(
    "/api/get-single-bank-name/:id",
    Authorize(["superAdmin", "Transaction-View", "Bank-View"]),
    async (req, res) => {
      try {
        const id = req.params.id;
        const dbBankData = await Bank.findOne({ _id: id }).exec();
        if (!dbBankData) {
          return res.status(404).send({ message: "Bank not found" });
        }
        const bankId = dbBankData._id;
        const bankBalance = await AccountServices.getBankBalance(bankId);
        const response = {
          _id: dbBankData._id,
          bankName: dbBankData.bankName,
          subAdminId: dbBankData.subAdminId,
          subAdminName: dbBankData.subAdminName,
          balance: bankBalance,
        };

        res.status(200).send(response);
      } catch (e) {
        console.error(e);
        res.status(500).send({ message: "Internal server error" });
      }
    }
  );

  app.post(
    "/api/admin/add-bank-balance/:id",
    Authorize(["superAdmin", "Bank-View", "Transaction-View"]),
    async (req, res) => {
      try {
        const id = req.params.id;
        const userName = req.user;
        const { amount, transactionType, remarks } = req.body;
        if (transactionType !== "Manual-Bank-Deposit") {
          return res.status(500).send({ message: "Invalid transaction type" });
        }
        if (!amount || typeof amount !== "number") {
          return res.status(400).send({ message: "Invalid amount" });
        }
        if (!remarks) {
          throw { code: 400, message: "Remark is required" };
        }
        const bank = await Bank.findOne({ _id: id }).exec();
        if (!bank) {
          return res.status(404).send({ message: "Bank account not found" });
        }
        const bankTransaction = new BankTransaction({
          bankId: bank._id,
          accountHolderName: bank.accountHolderName,
          bankName: bank.bankName,
          accountNumber: bank.accountNumber,
          ifscCode: bank.ifscCode,
          transactionType: transactionType,
          upiId: bank.upiId,
          upiAppName: bank.upiAppName,
          upiNumber: bank.upiNumber,
          depositAmount: amount,
          subAdminId: userName.userName,
          subAdminName: userName.firstname,
          remarks: remarks,
          createdAt: new Date(),
        });
        await bankTransaction.save();
        res
          .status(200)
          .send({ message: "Wallet Balance Added to Your Bank Account" });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.post(
    "/api/admin/withdraw-bank-balance/:id",
    Authorize(["superAdmin", "Transaction-View", "Bank-View"]),
    async (req, res) => {
      try {
        const id = req.params.id;
        const userName = req.user;
        const { amount, transactionType, remarks } = req.body;
        if (transactionType !== "Manual-Bank-Withdraw") {
          return res.status(500).send({ message: "Invalid transaction type" });
        }
        if (!amount || typeof amount !== "number") {
          return res.status(400).send({ message: "Invalid amount" });
        }
        if (!remarks) {
          throw { code: 400, message: "Remark is required" };
        }
        const bank = await Bank.findOne({ _id: id }).exec();
        if (!bank) {
          return res.status(404).send({ message: "Bank account not found" });
        }
        if ((await AccountServices.getBankBalance(id)) < Number(amount)) {
          return res.status(400).send({ message: "Insufficient Balance " });
        }
        const bankTransaction = new BankTransaction({
          bankId: bank._id,
          accountHolderName: bank.accountHolderName,
          bankName: bank.bankName,
          accountNumber: bank.accountNumber,
          ifscCode: bank.ifscCode,
          transactionType: transactionType,
          upiId: bank.upiId,
          upiAppName: bank.upiAppName,
          upiNumber: bank.upiNumber,
          withdrawAmount: amount,
          subAdminId: userName.userName,
          subAdminName: userName.firstname,
          remarks: remarks,
          createdAt: new Date(),
        });
        await bankTransaction.save();
        res
          .status(200)
          .send({ message: "Wallet Balance Deducted from your Bank Account" });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get(
    "/api/admin/bank-name",
    Authorize([
      "superAdmin",
      "Dashboard-View",
      "Transaction-View",
      "Bank-View",
      "Website-View",
      "Profile-View",
      "Transaction-Edit-Request",
      "Transaction-Delete-Request",
    ]),
    async (req, res) => {
      try {
        const bankName = await Bank.find({}, "bankName").exec();
        res.status(200).send(bankName);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get(
    "/api/admin/bank-account-summary/:accountNumber",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const accountNumber = req.params.bankName;
        const bankSummary = await BankTransaction.find({ accountNumber })
          .sort({ createdAt: 1 })
          .exec();
        console.log(bankSummary);

        res.status(200).send(bankSummary);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get(
    "/api/admin/user-bank-account-summary/:accountNumber",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const accountNumber = req.params.bankName;
        const transaction = await Transaction.findOne({ accountNumber }).exec();
        console.log("transaction", transaction);
        if (!transaction) {
          return res.status(404).send({ message: "Account not found" });
        }
        const userId = transaction.userName;
        if (!userId) {
          return res.status(404).send({ message: "User Id not found" });
        }
        const accountSummary = await Transaction.find({
          accountNumber,
          userId,
        }).exec();
        res.status(200).send(accountSummary);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.post(
    "/api/admin/manual-user-bank-account-summary/:accountNumber",
    Authorize(["superAdmin", "Bank-View", "Transaction-View"]),
    async (req, res) => {
      try {
        let balances = 0;
        const bankName = req.params.accountNumber;
        const bankSummary = await BankTransaction.find({ bankName }).sort({ createdAt: -1 }).exec();
        const accountSummary = await Transaction.find({ bankName }).sort({ createdAt: -1 }).exec();

        const allTransactions = [...accountSummary, ...bankSummary];
        allTransactions.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA;
        });
        let allData = JSON.parse(JSON.stringify(allTransactions));
        allData.slice(0).reverse().map((data) => {
          if (data.transactionType === "Manual-Bank-Deposit") {
            balances += data.depositAmount;
            data.balance = balances;
            console.log("balances", balances)
          }
          if (data.transactionType === "Manual-Bank-Withdraw") {
            balances -= data.withdrawAmount;
            data.balance = balances;
            console.log("balances2", balances)

          }
          if (data.transactionType === "Deposit") {
            let totalamount = 0;
            totalamount += data.amount;
            balances += totalamount;
            data.balance = balances;
            console.log("balances3", balances)
          }
          if (data.transactionType === "Withdraw") {
            const netAmount = balances - data.bankCharges - data.amount;
            console.log("netAmount", netAmount);
            balances = netAmount;
            data.balance = balances;
            console.log("balances4", balances)
          }
        });
        return res.status(200).send(allData);
      } catch (e) {
        console.error(e);
        res.status(e.code || 500).send({ message: e.message });
      }
    }
  );

  app.get(
    "/api/superadmin/view-bank-edit-requests",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const resultArray = await EditBankRequest.find().exec();
        res.status(200).send(resultArray);
      } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server error");
      }
    }
  );

  app.post("/api/admin/bank/isactive/:bankId", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      console.log('req', req.params.bankId)
      const bankId = req.params.bankId;
      const activeRequest = await Bank.findById(bankId);
      console.log('act', activeRequest)
      const { isActive } = req.body;
      if (typeof isActive !== "boolean") {
        return res.status(400).send({ message: "isApproved field must be a boolean value" });
      }
      const bank = await Bank.findById(bankId);
      if (!bank) {
        return res.status(404).send({ message: "Bank not found" });
      }
      // Check if the user has permission to access this bank based on their role
      // You can implement your own logic here, including checking the subAdminId if needed

      // Update the isActive field
      bank.isActive = isActive;

      await bank.save();

      res.status(200).send({ message: "Bank status updated successfully" });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
  });

  app.post("/api/admin/bank/assign-subadmin/:bankId", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      const bankId = req.params.bankId;
      const { subAdminId } = req.body;

      // First, check if the bank with the given ID exists
      const bank = await Bank.findById(bankId);
      if (!bank) {
        return res.status(404).send({ message: "Bank not found" });
      }

      bank.subAdminId.push(subAdminId);
      bank.isActive = true; // Set isActive to true for the assigned subadmin
      await bank.save();

      res.status(200).send({ message: "Subadmin assigned successfully" });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
  });


};

export default BankRoutes;
