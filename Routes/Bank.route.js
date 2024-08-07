import AccountServices from "../services/Accounts.services.js";
import { Authorize } from "../middleware/Authorize.js";
import { Bank } from "../models/bank.model.js";
import { BankTransaction } from "../models/BankTransaction.model.js";
import { Transaction } from "../models/transaction.js";
import { EditBankRequest } from "../models/EditBankRequest.model.js";
import { BankRequest } from "../models/BankRequest.model.js";
import lodash from "lodash";
import { Website } from "../models/website.model.js";
import { string } from "../constructor/string.js";

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
        const newBankName = new BankRequest({
          accountHolderName: accountHolderName,
          bankName: bankName,
          accountNumber: accountNumber,
          ifscCode: ifscCode,
          upiId: upiId,
          upiAppName: upiAppName,
          upiNumber: upiNumber,
          subAdminId: userName.userName,
          subAdminName: userName.firstname,
          isActive: isActive,
          isApproved: false
        });
        const id = await Bank.find({ bankName });
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
        res.status(200).send({ message: "Bank name sent for approval!" });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.post("/api/approve-bank/:id", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const { isApproved, subAdmins } = req.body;
      const bankId = req.params.id;

      const approvedBankRequest = await BankRequest.findById(bankId);
      if (!approvedBankRequest) {
        throw { code: 404, message: "Bank not found in the approval requests!" };
      }

      if (isApproved) {
        const approvedBank = new Bank({
          accountHolderName: approvedBankRequest.accountHolderName,
          bankName: approvedBankRequest.bankName,
          accountNumber: approvedBankRequest.accountNumber,
          ifscCode: approvedBankRequest.ifscCode,
          upiId: approvedBankRequest.upiId,
          upiAppName: approvedBankRequest.upiAppName,
          upiNumber: approvedBankRequest.upiNumber,
          subAdmins: subAdmins,
          isActive: true,
        });
        await approvedBank.save();
        await BankRequest.deleteOne({ _id: approvedBankRequest._id });
      } else {
        throw { code: 400, message: "Bank approval was not granted." };
      }

      res.status(200).send({ message: "Bank approved successfully & Subadmin Assigned" });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal Server Error" });
    }
  });

  app.post("/api/improve-bank/:id", Authorize(["superAdmin"]), async (req, res) => {
    try {
      // console.log('req',subAdminId)
      const { subAdmins } = req.body;
      console.log('first', subAdmins)
      const bankId = req.params.id;

      const approvedBankRequest = await Bank.findById(bankId);
      console.log('first', approvedBankRequest)
      if (!approvedBankRequest) {
        throw { code: 404, message: "Bank not found in the approval requests!" };
      }


      const approvedBank = new Bank({
        accountHolderName: approvedBankRequest.accountHolderName,
        bankName: approvedBankRequest.bankName,
        accountNumber: approvedBankRequest.accountNumber,
        ifscCode: approvedBankRequest.ifscCode,
        upiId: approvedBankRequest.upiId,
        upiAppName: approvedBankRequest.upiAppName,
        upiNumber: approvedBankRequest.upiNumber,
        subAdmins: subAdmins,
        isActive: true,
      });
      await approvedBank.save();
      // await BankRequest.deleteOne({ _id: approvedBankRequest._id });
      res.status(200).send({ message: "Bank approved successfully & Subadmin Assigned" });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal Server Error" });
    }
  });



  app.get(
    "/api/superadmin/view-bank-requests",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const resultArray = await (await BankRequest.find()).reverse();
        res.status(200).send(resultArray);
      } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server error");
      }
    });


  app.delete("/api/bank/reject/:id", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const id = req.params.id;
      const result = await BankRequest.deleteOne({ _id: id });
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
          res.status(201).send("Bank Detail's edit request sent to Super Admin for Approval");
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

  app.get(
    "/api/get-activeBank-name",
    Authorize(["superAdmin", "Bank-View", "Transaction-View", "Create-Transaction", "Create-Deposit-Transaction", "Create-Withdraw-Transaction"]),
    async (req, res) => {
      console.log('req', req.user)
      const {
        page,
        itemsPerPage
      } = req.query;

      try {
        let dbBankData = await Bank.find({ isActive: true }).select('bankName isActive').exec();
        return res.status(200).send(dbBankData);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );


  app.get(
    "/api/get-bank-name",
    Authorize([
      string.superAdmin,
      string.bankView,
      string.transactionView,
      string.createTransaction,
      string.createDepositTransaction,
      string.createWithdrawTransaction,
    ]),
    AccountServices.getBankNames
  );

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
        res.status(200).send({ message: "Wallet Balance Added to Your Bank Account" });
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
    "/api/admin/manual-user-bank-account-summary/:bankId",
    Authorize(["superAdmin", "Bank-View", "Transaction-View"]),
    async (req, res) => {
      try {
        let balances = 0;
        const bankId = req.params.bankId;
        const bankSummary = await BankTransaction.find({ bankId }).sort({ createdAt: -1 }).exec();
        console.log("id", bankSummary)
        const accountSummary = await Transaction.find({ bankId }).sort({ createdAt: -1 }).exec();

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

      bank.isActive = isActive;

      await bank.save();

      const message = isActive ? "Bank activated successfully" : "Bank inactivated successfully";
      return res.status(200).send({ message });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
  });

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


  app.get("/api/admin/bank/view-subadmin/:subadminId", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      const subadminId = req.params.subadminId;
      const dbBankData = await Bank.find({ 'subAdmins.subAdminId': subadminId }).exec();
      let bankData = JSON.parse(JSON.stringify(dbBankData));

      for (var index = 0; index < bankData.length; index++) {
        bankData[index].balance = await AccountServices.getBankBalance(
          bankData[index]._id
        );
      }

      bankData = bankData.filter(bank => bank.isActive === true);
      console.log('bankdata', bankData)

      if (bankData.length === 0) {
        return res.status(404).send({ message: "No bank found" });
      }

      res.status(200).send(bankData);

    } catch (e) {
      console.error(e);
      res.status(e.code || 400).send({ message: e.message || "Internal server error" });
    }
  });


  app.put("/api/bank/edit-request/:id", Authorize(["superAdmin", "RequstAdmin", "Bank-View"]), async (req, res) => {
    try {
      const { subAdmins } = req.body;
      const bankId = req.params.id;

      const approvedBankRequest = await Bank.findById(bankId);

      if (!approvedBankRequest) {
        throw { code: 404, message: "Bank not found!" };
      }

      for (const subAdminData of subAdmins) {
        const { subAdminId, isDeposit, isWithdraw, isDelete, isRenew, isEdit } = subAdminData;
        const subAdmin = approvedBankRequest.subAdmins.find(sa => sa.subAdminId === subAdminId);

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
            isDelete
          });
        }
      }

      await approvedBankRequest.save();

      res.status(200).send({ message: "Updated successfully" });
    } catch (error) {
      res.status(error.code || 500).send({ message: error.message || "An error occurred" });
    }
  });

  app.delete("/api/bank/delete-subadmin/:bankId/:subAdminId", Authorize(["superAdmin", "RequstAdmin", "Bank-View"]), async (req, res) => {
    try {
      const { bankId, subAdminId } = req.params;

      const bank = await Bank.findById(bankId);
      if (!bank) {
        throw { code: 404, message: "Bank not found!" };
      }

      // Remove the subAdmin with the specified subAdminId
      bank.subAdmins = bank.subAdmins.filter(sa => sa.subAdminId !== subAdminId);

      await bank.save();

      res.status(200).send({ message: "SubAdmin removed successfully" });
    } catch (error) {
      res.status(error.code || 500).send({ message: error.message || "An error occurred" });
    }
  });




  app.get("/api/active-visible-bank", Authorize(["superAdmin", "RequstAdmin"]), async (req, res) => {

    try {
      let getBank = await Bank.find({ isActive: true }).exec();
      let getWebsite = await Website.find({ isActive: true }).exec();
      console.log('web', getWebsite)
      if (getBank.length === 0) {
        return res.status(404).send({ message: "No bank found" });
      }
      if (getWebsite.length === 0) {
        return res.status(404).send({ message: "No Website found" });
      }

      const bankNames = getBank.map(bank => bank.bankName);
      const websiteNames = getWebsite.map(website => website.websiteName);
      console.log('web', websiteNames)
      return res.send({ bank: bankNames, website: websiteNames })
    }
    catch (err) {
      console.error(err)
    }
  })


};

export default BankRoutes;
