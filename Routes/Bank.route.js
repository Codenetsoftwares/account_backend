import AccountServices from "../services/Accounts.services.js";
import { Authorize } from "../middleware/Authorize.js";
import { Bank } from "../models/bank.model.js";
import { BankTransaction } from "../models/BankTransaction.model.js";
import { Transaction } from "../models/transaction.js";
import { EditBankRequest } from "../models/EditBankRequest.model.js";

const BankRoutes = (app) => {
  
  // API To Add Bank Name

  app.post("/api/add-bank-name", Authorize(["superAdmin", "Bank-View", "Transaction-View"]), async (req, res) => {
    try {
      const userName = req.user;
      const { accountHolderName, bankName, accountNumber, ifscCode, upiId, upiAppName, upiNumber } = req.body;
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
        subAdminName : userName.firstname
      });
      const id = await Bank.find(req.params.id);
      id.map((data) => {
        console.log(data.bankName)
        if (newBankName.bankName.toLocaleLowerCase() === data.bankName.toLocaleLowerCase()) {
          throw { code: 400, message: "Bank name exists already!" };
        }
      })
      await newBankName.save();
      res.status(200).send({ message: "Bank name registered successfully!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  // API To Edit Bank Details

  app.put("/api/bank-edit/:id", Authorize(["superAdmin", "Bank-View", "Transaction-View"]), async (req, res) => {
    try {
      const id = await Bank.findById(req.params.id);
      // console.log("id", id);
      const updateResult = await AccountServices.updateBank(id, req.body);
      console.log(updateResult);
      if (updateResult) {
        res.status(201).send("Bank Detail's sent to Super Admin for Approval");
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

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

  app.get("/api/get-bank-name", Authorize(["superAdmin", "Bank-View", "Transaction-View"]), async (req, res) => {
    try {
      let dbBankData = await Bank.find().exec();
      let bankData = JSON.parse(JSON.stringify(dbBankData));

      for (var index = 0; index < bankData.length; index++) {
        bankData[index].balance = await AccountServices.getBankBalance(bankData[index]._id);
      }

      res.status(200).send(bankData);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  // API To View Single Bank Name

  app.get("/api/get-single-bank-name/:id", Authorize(["superAdmin", "Transaction-View", "Bank-View"]), async (req, res) => {
    try {
      const id = req.params.id;
      const dbBankData = await Bank.findOne({ _id: id }).exec();     
      if (!dbBankData) {
        return res.status(404).send({ message: 'Bank not found' });
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
      res.status(500).send({ message: 'Internal server error' });
    }
  });
  


  app.post("/api/admin/add-bank-balance/:id", Authorize(["superAdmin", "Bank-View", "Transaction-View"]), async (req, res) => {
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
      res.status(200).send({ message: "Wallet Balance Added to Your Bank Account" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.post("/api/admin/withdraw-bank-balance/:id", Authorize(["superAdmin", "Transaction-View", "Bank-View"]), async (req, res) => {
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
      if (await AccountServices.getBankBalance(id) < Number(amount)) {
        return res.status(400).send({ message: "Insufficient Balance " });
      };
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
      res.status(200).send({ message: "Wallet Balance Deducted from your Bank Account" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );


  app.get("/api/admin/bank-name", Authorize(["superAdmin", "Dashboard-View", "Transaction-View", "Transaction-Edit-Request", "Transaction-Delete-Request"]), async (req, res) => {
    try {
      const bankName = await Bank.find({}, "bankName").exec();
      res.status(200).send(bankName);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.get("/api/admin/bank-account-summary/:accountNumber", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const accountNumber = req.params.bankName;
      const bankSummary = await BankTransaction.find({ accountNumber }).sort({ createdAt: 1 }).exec();
      console.log(bankSummary);

      res.status(200).send(bankSummary);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );


  app.get("/api/admin/user-bank-account-summary/:accountNumber", Authorize(["superAdmin"]), async (req, res) => {
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
      const accountSummary = await Transaction.find({ accountNumber, userId }).exec();
      res.status(200).send(accountSummary);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );


  app.get("/api/admin/manual-user-bank-account-summary/:accountNumber", Authorize(["superAdmin", "Bank-View", "Transaction-View"]),
    async (req, res) => {
      try {
        console.log('req', req.params)
        const bankName = req.params.accountNumber;
        console.log('acnt', bankName)
        const transaction = await Transaction.findOne({ bankName: bankName }).exec();
        console.log("transaction", transaction);
        if (!transaction) {
          console.log('first')
          const bankSummary = await BankTransaction.find({ bankName }).sort({ createdAt: -1 }).exec();
          console.log('banksummary', bankSummary)
          if (bankSummary.length > 0) {
            res.status(200).send(bankSummary);
          } else {
            return res.status(404).send({ message: "Account not found" });
          }
        } else {
          const userId = transaction.userName;
          if (!userId) {
            return res.status(404).send({ message: "User Id not found" });
          }
          const accountSummary = await Transaction.find({ bankName, userId, }).sort({ createdAt: -1 }).exec();
          const bankSummary = await BankTransaction.find({ bankName }).sort({ createdAt: -1 }).exec();
          const allTransactions = [...accountSummary, ...bankSummary]
          allTransactions.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);

            if (dateA < dateB) {
              return 1;
            } else if (dateA > dateB) {
              return -1;
            } else {
              return b.createdAt - a.createdAt;
            }
          });
          if (accountSummary.length > 0 || bankSummary.length > 0) {
            res.status(200).send(allTransactions);
          } else {
            return res.status(404).send({ message: "Account not found" });
          }
        }
      } catch (e) {
        console.error(e);
        res.status(e.code || 500).send({ message: e.message });
      }
    }
  );


  app.get('/api/superadmin/view-bank-edit-requests', Authorize(["superAdmin"]), async (req, res) => {
    try {
      const resultArray = await EditBankRequest.find().exec();
      res.status(200).send(resultArray);
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server error");
    }
  });

};

export default BankRoutes;
