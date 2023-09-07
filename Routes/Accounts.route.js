import AccountServices from "../services/Accounts.services.js";
import { Admin } from "../models/admin_user.js";
import { Authorize } from "../middleware/Authorize.js";
import { Bank } from "../models/bank.model.js";
import { Website } from "../models/website.model.js";
import { User } from "../models/user.model.js";
import { BankTransaction } from "../models/BankTransaction.model.js";
import { WebsiteTransaction } from "../models/WebsiteTransaction.model.js";
import { Transaction } from "../models/transaction.js";
import { introducerUser } from "../services/introducer.services.js";
import { IntroducerUser } from "../models/introducer.model.js";
import { userservice } from "../services/user.service.js";
import { EditWebsiteRequest } from "../models/EditWebsiteRequest.model.js";

const AccountsRoute = (app) => {
  // API For Admin Login

  app.post("/admin/login", async (req, res) => {
    try {
      const { userName, password, persist } = req.body;

      if (!userName) {
        throw { code: 400, message: "User Name is required" };
      }

      if (!password) {
        throw { code: 400, message: "Password is required" };
      }

      const user = await Admin.findOne({ userName: userName });
      console.log("user", user);
      if (!user) {
        throw { code: 404, message: "User not found" };
      }

      const accessToken = await AccountServices.generateAdminAccessToken(
        userName,
        password,
        persist
      );

      if (!accessToken) {
        throw { code: 500, message: "Failed to generate access token" };
      }

      res.status(200).send({
        token: accessToken,
      });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  // API To Create Admin User

  app.post("/api/create/user-admin", Authorize(["superAdmin"]),async (req, res) => {
      try {
        await AccountServices.createAdmin(req.body);
        res.status(200).send({ code: 200, message: "Admin registered successfully!" });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  // API To Add Bank Name

  app.post("/api/add-bank-name", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const { accountHolderName, bankName, accountNumber, ifscCode, upiId, upiAppName, upiNumber } = req.body;
        if (!bankName) {
          throw { code: 400, message: "Please give a bank name to add" };
        }
        const newBankName = new Bank({
          accountHolderName: accountHolderName,
          bankName: bankName,
          accountNumber: accountNumber,
          ifscCode: ifscCode,
          upiId: upiId,
          upiAppName: upiAppName,
          upiNumber: upiNumber,
          walletBalance: 0,
        });
        newBankName.save();
        res.status(200).send({ message: "Bank name registered successfully!" });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  // API To Edit Bank Details

  app.put("/api/bank-edit/:id", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const id = await Bank.findById(req.params.id);
      console.log("id", id);
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

  app.post("/api/delete-bank-name", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const { bankName } = req.body;
        console.log("req.body", bankName);

        const bankToDelete = await Bank.findOne({ bankName: bankName }).exec();
        if (!bankToDelete) {
          return res.status(404).send({ message: "Bank not found" });
        }

        console.log("bankToDelete", bankToDelete);

        const deleteData = await Bank.deleteOne({ _id: bankToDelete._id }).exec();
        console.log("deleteData", deleteData);

        res.status(200).send({ message: "Bank name removed successfully!" });
      } catch (e) {
        console.error(e);
        res.status(e.code || 500).send({ message: e.message });
      }
    }
  );

  // API To View Bank Name

  app.get("/api/get-bank-name", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const bankData = await Bank.find({}).exec();
      res.status(200).send(bankData);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  // API To View Single Bank Name

  app.get("/api/get-single-bank-name/:id", Authorize(["superAdmin"]),async (req, res) => {
      try {
        const id = req.params.id;
        const bankData = await Bank.findOne({ _id: id }).exec();
        res.status(200).send(bankData);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  // API To Add Website Name

  app.post("/api/add-website-name", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const websiteName = req.body.websiteName;
        if (!websiteName) {
          throw { code: 400, message: "Please give a website name to add" };
        }
        const newWebsiteName = new Website({
          websiteName: websiteName,
          walletBalance: 0,
        });
        newWebsiteName.save();
        res.status(200).send({ message: "Website registered successfully!" });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  // API To Edit Website Name

  app.put("/api/website-edit/:id", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const id = await Website.findById(req.params.id);
        console.log("id", id);
        const updateResult = await AccountServices.updateWebsite(id, req.body);
        console.log(updateResult);
        if (updateResult) {
          res.status(201).send("Website Detail's Sent to Super Admin For Approval");
        }
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  // API To Delete Website Name

  app.post(
    "/api/delete-wesite-name",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const { websiteName } = req.body;
        console.log("req.body", websiteName);

        const WebsiteToDelete = await Website.findOne({
          websiteName: websiteName,
        }).exec();
        if (!WebsiteToDelete) {
          return res.status(404).send({ message: "Website not found" });
        }

        console.log("WebsiteToDelete", WebsiteToDelete);

        const deleteData = await Website.deleteOne({
          _id: WebsiteToDelete._id,
        }).exec();
        console.log("deleteData", deleteData);

        res.status(200).send({ message: "Website name removed successfully!" });
      } catch (e) {
        console.error(e);
        res.status(e.code || 500).send({ message: e.message });
      }
    }
  );

  // API To View Website Name

  app.get(
    "/api/get-website-name",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const websiteData = await Website.find({}).exec();
        res.status(200).send(websiteData);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  // API To View User Profiles

  app.get("/api/user-profile", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const user = await User.find({}).exec();
      res.send(user);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  // API To Edit User Profiles

  app.put(
    "/api/admin/user-profile-edit/:id",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const id = await User.findById(req.params.id);
        const updateResult = await AccountServices.updateUserProfile(
          id,
          req.body
        );
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

  app.post(
    "/api/admin/add-bank-balance/:id",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const id = req.params.id;
        const userId = req.user;
        const { amount, transactionType, remark } = req.body;
        if (transactionType !== "Manual-Bank-Deposit") {
          return res.status(500).send({ message: "Invalid transaction type" });
        }
        const bank = await Bank.findOne({ _id: id }).exec();
        console.log("bank", bank);
        if (!bank) {
          return res.status(404).send({ message: "Bank account not found" });
        }
        bank.walletBalance += amount;
        bank.subAdminId = userId.email;
        bank.subAdminName = userId.firstname;
        bank.transactionType = transactionType.transactionType;
        await bank.save();

        const bankTransaction = new BankTransaction({
          accountHolderName: bank.accountHolderName,
          bankName: bank.bankName,
          accountNumber: bank.accountNumber,
          ifscCode: bank.ifscCode,
          transactionType: transactionType,
          upiId: bank.upiId,
          upiAppName: bank.upiAppName,
          upiNumber: bank.upiNumber,
          beforeBalance: bank.walletBalance - amount,
          currentBalance: bank.walletBalance,
          depositAmount: amount,
          subAdminId: userId.email,
          subAdminName: userId.firstname,
          remark: remark,
          createdAt: new Date(),
          isSubmit: false
        });
        console.log("banktrans", bankTransaction);

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
    "/api/admin/add-website-balance/:id",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const id = req.params.id;
        const userId = req.user;
        const { amount, transactionType, remark } = req.body;
        if (transactionType !== "Manual-Webiste-Deposit") {
          return res.status(500).send({ message: "Invalid transaction type" });
        }
        const website = await Website.findOne({ _id: id }).exec();
        console.log("website", website);
        if (!website) {
          return res.status(404).send({ message: "Website  not found" });
        }
        website.walletBalance += amount;
        website.subAdminId = userId.email;
        website.subAdminName = userId.firstname;
        website.transactionType = transactionType.transactionType;
        await website.save();

        let beforBal = website.walletBalance - amount;
        let currentBal = website.walletBalance;
        console.log("currentBal", currentBal);

        const websiteTransaction = new WebsiteTransaction({
          websiteName: website.websiteName,
          transactionType: transactionType,
          beforeBalance: beforBal,
          currentBalance: currentBal,
          depositAmount: amount,
          subAdminId: userId.email,
          subAdminName: userId.firstname,
          remark: remark,
          createdAt: new Date(),
          isSubmit: false
        });
        console.log("websiteTransaction", websiteTransaction);

        await websiteTransaction.save();
        res
          .status(200)
          .send({ message: "Wallet Balance Added to Your Website" });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.post(
    "/api/admin/withdraw-bank-balance/:id",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const id = req.params.id;
        const userId = req.user;
        const { amount, transactionType, remark } = req.body;
        if (transactionType !== "Manual-Bank-Withdraw") {
          return res.status(500).send({ message: "Invalid transaction type" });
        }
        console.log("amount", amount);
        const bank = await Bank.findOne({ _id: id }).exec();
        console.log("bank", bank);
        if (!bank) {
          return res.status(404).send({ message: "Bank account not found" });
        }
        bank.walletBalance -= amount;
        console.log("bankwallet", bank.walletBalance);
        bank.transactionType = transactionType;
        bank.subAdminId = userId.email;
        bank.subAdminName = userId.firstname;
        await bank.save();

        let currentBal = bank.walletBalance;

        const bankTransaction = new BankTransaction({
          accountHolderName: bank.accountHolderName,
          bankName: bank.bankName,
          accountNumber: bank.accountNumber,
          ifscCode: bank.ifscCode,
          transactionType: transactionType,
          upiId: bank.upiId,
          upiAppName: bank.upiAppName,
          upiNumber: bank.upiNumber,
          beforeBalance: bank.walletBalance + amount,
          currentBalance: currentBal,
          withdrawAmount: amount,
          subAdminId: userId.email,
          subAdminName: userId.firstname,
          remark: remark,
          createdAt: new Date(),
          isSubmit: false
        });
        console.log("banktrans", bankTransaction);

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

  app.post(
    "/api/admin/withdraw-website-balance/:id",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const id = req.params.id;
        const userId = req.user;
        const { amount, transactionType, remark } = req.body;
        if (transactionType !== "Manual-Website-Withdraw") {
          return res.status(500).send({ message: "Invalid transaction type" });
        }
        console.log("amount", amount);
        const website = await Website.findOne({ _id: id }).exec();
        console.log("website", website);
        if (!website) {
          return res.status(404).send({ message: "Websitet not found" });
        }
        website.walletBalance -= amount;
        console.log("Websitewallet", website.walletBalance);
        website.transactionType = transactionType;
        website.subAdminId = userId.email;
        website.subAdminName = userId.firstname;
        await website.save();

        let currentBal = website.walletBalance;

        const websiteTransaction = new WebsiteTransaction({
          websiteName: website.websiteName,
          transactionType: transactionType,
          beforeBalance: website.walletBalance + amount,
          currentBalance: currentBal,
          withdrawAmount: amount,
          subAdminId: userId.email,
          subAdminName: userId.firstname,
          remark: remark,
          createdAt: new Date(),
          isSubmit: false
        });
        console.log("websiteTransaction", websiteTransaction);

        await websiteTransaction.save();
        res
          .status(200)
          .send({ message: "Wallet Balance Deducted from your Website" });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get("/api/admin/sub-admin-name", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const superAdmin = await Admin.find({ roles: "superAdmin" },"firstname").exec();
        res.status(200).send(superAdmin);
      } catch (e) {
        console.error(e);
        res.status(e.code || 500).send({ message: e.message });
      }
    }
  );

  app.get("/api/admin/bank-name", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const bankName = await Bank.find({}, "bankName").exec();
        res.status(200).send(bankName);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get("/api/admin/website-name", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const websiteName = await Website.find({}, "websiteName").exec();
        res.status(200).send(websiteName);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get("/api/admin/bank-account-summary/:accountNumber", Authorize(["superAdmin"]),async (req, res) => {
      try {
        const accountNumber = req.params.accountNumber;
        const bankSummary = await BankTransaction.find({accountNumber}).exec();
        res.status(200).send(bankSummary);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get("/api/admin/website-account-summary/:websiteName", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const websiteName = req.params.websiteName;
        const websiteSummary = await WebsiteTransaction.find({websiteName}).exec();
        res.status(200).send(websiteSummary);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get("/api/admin/account-summary", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const transactions = await Transaction.find({}).sort({ createdAt: -1 }).exec();
        const websiteTransactions = await WebsiteTransaction.find({}).sort({ date: -1 }).exec();
        const bankTransactions = await BankTransaction.find({}).sort({ date: -1 }).exec();
        const allTransactions = [...transactions, ...websiteTransactions, ...bankTransactions];
        res.status(200).send(allTransactions);
      } catch (e) {
        console.error(e);
        res.status(e.code || 500).send({ message: e.message });
      }
    }
  );

  app.get("/api/admin/user-bank-account-summary/:accountNumber", Authorize(["superAdmin"]),async (req, res) => {
      try {
        const accountNumber = req.params.accountNumber;
        const transaction = await Transaction.findOne({ accountNumber }).exec();
        console.log("transaction", transaction);
        if (!transaction) {
          return res.status(404).send({ message: "Account not found" });
        }
        const userId = transaction.userId;
        if (!userId) {
          return res.status(404).send({ message: "User Id not found" });
        }
        const accountSummary = await Transaction.find({accountNumber, userId}).exec();
        res.status(200).send(accountSummary);
      } catch (e) {
        console.error(e);
        res.status(e.code || 500).send({ message: e.message });
      }
    }
  );

  app.get("/api/admin/user-website-account-summary/:websiteName", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const websiteName = req.params.websiteName;
        const transaction = await Transaction.findOne({ websiteName }).exec();
        console.log("transaction", transaction);
        if (!transaction) {
          return res.status(404).send({ message: "Website Name not found" });
        }
        const userId = transaction.userId;
        if (!userId) {
          return res.status(404).send({ message: "User Id not found" });
        }
        const accountSummary = await Transaction.find({websiteName, userId}).exec();
        res.status(200).send(accountSummary);
      } catch (e) {
        console.error(e);
        res.status(e.code || 500).send({ message: e.message });
      }
    }
  );

  app.post("/api/admin/accounts/introducer/register", Authorize(["superAdmin"]), async (req, res) => {
      try {
        await introducerUser.createintroducerUser(req.body);
        res.status(200).send({code: 200, message: "Introducer User registered successfully!"});
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.post("/api/admin/introducer/introducerCut/:id", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const id = req.params.id;
        const { startDate, endDate } = req.body;
        await introducerUser.introducerPercentageCut(id, startDate, endDate);
        res.status(200).send({code: 200,message: "Introducer Percentage Transferred successfully!"});
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get("/api/admin/introducer-live-balance/:id",  Authorize(["superAdmin"]), async (req, res) => {
    try {
      const id = req.params.id;
      const data =  await introducerUser.introducerLiveBalance(id);
      console.log("data", data)
     res.send({ LiveBalance: data })
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
);

  app.put("/api/admin/intoducer-profile-edit/:id", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const id = await IntroducerUser.findById(req.params.id);
        const updateResult = await introducerUser.updateIntroducerProfile(id,req.body);
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

  app.get("/api/intoducer-profile", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const introducerUser = await IntroducerUser.find({}).exec();
        res.send(introducerUser);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get("/api/intoducer/client-data/:id", Authorize(["superAdmin"]), async (req, res) => {
      try {
        const id = req.params.id;
        const intoducer = await IntroducerUser.findOne({ id }).exec();
        const intoducerId = intoducer.introducerId;
        const introducerUser = await User.find({introducersUserId: intoducerId}).exec();
        res.send(introducerUser);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );


  app.get("/api/superadmin/user-id", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const resultArray = await User.find({}, "userId").exec();
      res.status(200).send(resultArray);
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server error");
    }
  }
);

app.get("/api/superadmin/Introducer-id", Authorize(["superAdmin"]), async (req, res) => {
  try {
    const resultArray = await IntroducerUser.find({}, "introducerId").exec();
    res.status(200).send(resultArray);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server error");
  }
}
);

app.get("/api/admin/manual-user-bank-account-summary/:accountNumber", Authorize(["superAdmin"]),
  async (req, res) => {
    try {
      const accountNumber = req.params.accountNumber;
      const transaction = await Transaction.findOne({ accountNumber }).exec();
      console.log("transaction", transaction);
      if (!transaction) {
        return res.status(404).send({ message: "Account not found" });
      }
      const userId = transaction.userId;
      if (!userId) {
        return res.status(404).send({ message: "User Id not found" });
      }
      const accountSummary = await Transaction.find({accountNumber,userId,}).sort({ createdAt: -1 }).exec();
      const bankSummary = await BankTransaction.find({accountNumber,}).sort({ createdAt: -1 }).exec();
      const allTransactions = [...accountSummary, ...bankSummary];
      res.status(200).send(allTransactions);
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message });
    }
  }
);
  
app.get("/api/admin/manual-user-website-account-summary/:websiteName", Authorize(["superAdmin"]),async (req, res) => {
    try {
      const websiteName = req.params.websiteName;
      const transaction = await Transaction.findOne({ websiteName }).exec();
      console.log("transaction", transaction);
      if (!transaction) {
        return res.status(404).send({ message: "Website Name not found" });
      }
      const userId = transaction.userId;
      if (!userId) {
        return res.status(404).send({ message: "User Id not found" });
      }
      const accountSummary = await Transaction.find({websiteName, userId,}).exec();
      const wesiteSummary = await WebsiteTransaction.find({websiteName}).sort({ createdAt: -1 }).exec();
      const allTransactions = [...accountSummary, ...wesiteSummary];
      res.status(200).send(allTransactions);
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message });
    }
  }
);


app.post("/api/admin/user/register", Authorize(["superAdmin"]), async (req, res) => {
  try {
    await userservice.createUser(req.body);
    res.status(200).send({ code: 200, message: "User registered successfully!" });
  } catch (e) {
    console.error(e);
    res.status(e.code).send({ message: e.message });
  }
});

app.get(
  "/api/admin/view-sub-admins",
  Authorize(["superAdmin"]),
  async (req, res) => {
    try {
      const allAdmins = await Admin.find().exec();
      console.log(allAdmins);
      let arr = [];
      for (let i = 0; i < allAdmins.length; i++) {
        if (!allAdmins[i].roles.includes("superAdmin")) {
          let obj = {};
          obj = allAdmins[i];
          arr.push(obj);
        }
      }
      arr.length === 0
        ? res.status(200).send("No sub-admins")
        : res.status(200).send(arr);
    } catch (error) {
      console.log(error);
      res.status(e.code).send(e.message);
    }
  }
);

app.post(
  "/api/admin/single-sub-admin/:id",
  Authorize(["superAdmin"]),
  async (req, res) => {
    try {
      if (!req.params.id) {
        throw { code: 400, message: "Sub Admin's Id not present" };
      }
      const subadminId = req.params.id;
      const subAdmin = await Admin.findById(subadminId);
      if (!subAdmin) {
        throw { code: 500, message: "Sub Admin not found with the given Id" };
      }
      res.status(200).send(subAdmin);
    } catch (error) {
      console.log(error);
      res.status(error.code).send(error.message);
    }
  }
);

app.put("/api/admin/edit-subadmin-roles/:id", Authorize(["superAdmin"]),
  async (req, res) => {
    try {
      const subadminId = req.params.id;
      const { roles } = req.body;
      if (!subadminId) {
        throw { code: 400, message: "Id not found" };
      }
      const subAdmin = await Admin.findById(subadminId);
      if (!subAdmin) {
        throw { code: 400, message: "Sub Admin not found" };
      }
      subAdmin.roles = roles;
      await subAdmin.save();
      res.status(200).send(`${subAdmin.firstname} ${subAdmin.lastname} roles Edited with ${roles}`);
    } catch (error) {
      console.log(error);
      res.status(error.code).send(error.message);
    }
  }
);
};

export default AccountsRoute;
