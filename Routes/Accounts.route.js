import AccountServices from "../services/Accounts.services.js";
import { Admin } from "../models/admin_user.js";
import { Authorize } from "../middleware/Authorize.js";
import { User } from "../models/user.model.js";
import { BankTransaction } from "../models/BankTransaction.model.js";
import { WebsiteTransaction } from "../models/WebsiteTransaction.model.js";
import { Transaction } from "../models/transaction.js";
import { introducerUser } from "../services/introducer.services.js";
import { IntroducerUser } from "../models/introducer.model.js";
import { userservice } from "../services/user.service.js";
import lodash from "lodash";
import { Website } from "../models/website.model.js";
import { Bank } from "../models/bank.model.js";
import TransactionServices from "../services/Transaction.services.js"
import { IntroducerTransaction } from "../models/IntroducerTransaction.model.js";

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

  app.post(
    "/api/create/user-admin",
    Authorize(["superAdmin", "Create-SubAdmin"]),
    async (req, res) => {
      try {
        await AccountServices.createAdmin(req.body);
        res
          .status(200)
          .send({ code: 200, message: "Admin registered successfully!" });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  // API To View User Profiles

  app.get(
    "/api/user-profile/:page",
    Authorize(["superAdmin", "Profile-View", "User-Profile-View"]),
    async (req, res) => {
      const page = req.params.page;
      const searchQuery = req.query.search;
      try {
        let allIntroDataLength;
        if (searchQuery) {
          console.log('first')
          let SecondArray = [];
          const users = await User.find({ userName: { $regex: new RegExp(searchQuery, "i"), }, }).exec();
          SecondArray = SecondArray.concat(users);
          allIntroDataLength = SecondArray.length;
          const pageNumber = Math.ceil(allIntroDataLength / 10);
          res.status(200).json({ SecondArray, pageNumber, allIntroDataLength });
        } else {
          console.log('second')
          let introducerUser = await User.find({}).exec();
          let introData = JSON.parse(JSON.stringify(introducerUser));
          console.log('introData', introData.length)

          const SecondArray = [];
          const Limit = page * 10;
          console.log("Limit", Limit);

          for (let j = Limit - 10; j < Limit; j++) {
            SecondArray.push(introData[j]);
            console.log('lenth', SecondArray.length)
          }
          allIntroDataLength = introData.length;

          if (SecondArray.length === 0) {
            return res.status(404).json({ message: "No data found for the selected criteria." });
          }

          const pageNumber = Math.ceil(allIntroDataLength / 10);
          res.status(200).json({ SecondArray, pageNumber, allIntroDataLength });

        }
      } catch (e) {
        console.error(e);
        res.status(500).send({ message: "Internal Server Error" });
      }
    }
  );




  // API To Edit User Profiles

  app.put(
    "/api/admin/user-profile-edit/:id",
    Authorize(["superAdmin", "User-Profile-View", "Profile-View"]),
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

  app.get(
    "/api/admin/sub-admin-name",
    Authorize([
      "superAdmin",
      "Dashboard-View",
      "Transaction-View",
      "Transaction-Edit-Request",
      "Transaction-Delete-Request",
      "Website-View",
      "Bank-View",
      "Profile-View",
      "Introducer-Profile-View"
    ]),
    async (req, res) => {
      try {
        const superAdmin = await Admin.find({},"userName").exec();
        console.log('superAdmin',superAdmin)
        res.status(200).send(superAdmin);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get(
    "/api/admin/account-summary",
    Authorize([
      "superAdmin",
      "Dashboard-View",
      "Transaction-View",
      "Transaction-Edit-Request",
      "Transaction-Delete-Request",
      "Website-View",
      "Bank-View"
    ]),
    async (req, res) => {
      try {
        const transactions = await Transaction.find({})
          .sort({ createdAt: 1 })
          .exec();
        const websiteTransactions = await WebsiteTransaction.find({})
          .sort({ createdAt: 1 })
          .exec();
        const bankTransactions = await BankTransaction.find({})
          .sort({ createdAt: 1 })
          .exec();
        const allTransactions = [
          ...transactions,
          ...websiteTransactions,
          ...bankTransactions,
        ];
        allTransactions.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          if (dateA < dateB) {
            return 1;
          } else if (dateA > dateB) {
            return -1;
          } else {
            // If the dates are equal, sort by time in descending order
            return b.createdAt - a.createdAt;
          }
        });
        res.status(200).send(allTransactions);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.post(
    "/api/admin/accounts/introducer/register",
    Authorize(["superAdmin", "Create-Introducer", "Create-Admin"]),
    async (req, res) => {
      try {
        await introducerUser.createintroducerUser(req.body);
        res.status(200).send({
          code: 200,
          message: "Introducer User registered successfully!",
        });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.post(
    "/api/admin/introducer/introducerCut/:id",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const id = req.params.id;
        const { startDate, endDate } = req.body;
        await introducerUser.introducerPercentageCut(id, startDate, endDate);
        res.status(200).send({
          code: 200,
          message: "Introducer Percentage Transferred successfully!",
        });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get(
    "/api/admin/introducer-live-balance/:id",
    Authorize(["superAdmin", "Profile-View", "Introducer-Profile-View"]),
    async (req, res) => {
      try {
        const id = await IntroducerUser.findById(req.params.id);
        console.log("id", id);
        const data = await introducerUser.introducerLiveBalance(id);
        console.log("data", data);
        res.send({ LiveBalance: data });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.put(
    "/api/admin/intoducer-profile-edit/:id",
    Authorize(["superAdmin", "Profile-View", "Introducer-Profile-View"]),
    async (req, res) => {
      try {
        const id = await IntroducerUser.findById(req.params.id);
        const updateResult = await introducerUser.updateIntroducerProfile(
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

  app.get(
    "/api/introducer-profile/:page",
    Authorize(["superAdmin", "Introducer-Profile-View", "Profile-View", "Create-Introducer"]),
    async (req, res) => {
      const page = req.params.page;
      const userName = req.query.search;

      try {
        let introducerUser = await IntroducerUser.find().exec();
        let introData = JSON.parse(JSON.stringify(introducerUser));
        if (userName) {
          introData = introData.filter((user) =>
            user.userName.includes(userName)
          );
        }
        for (let index = 0; index < introData.length; index++) {
          introData[index].balance = await AccountServices.getIntroBalance(
            introData[index]._id
          );
        }
        const allIntroDataLength = introData.length;
        let pageNumber = Math.floor(allIntroDataLength / 10) + 1;
        let SecondArray = [];
        const Limit = page * 10;

        for (let j = Limit - 10; j < Limit; j++) {
          // console.log('all', [j]);
          if (introData[j] !== undefined) {
            SecondArray.push(introData[j]);
          }
        }

        if (SecondArray.length === 0) {
          return res.status(404).json({ message: "No data" });
        }

        res.status(200).json({ SecondArray, pageNumber, allIntroDataLength });
      }
     
      catch (e) {
        console.error(e);
        res.status(500).send({ message: "Internal Server Error" });
      }
    }
  );



  app.get(
    "/api/intoducer/client-data/:id",
    Authorize(["superAdmin", "Profile-View", "Introducer-Profile-View"]),
    async (req, res) => {
      try {
        const id = req.params.id;
        const intoducer = await IntroducerUser.findOne({ id }).exec();
        const intoducerId = intoducer.userName;
        const introducerUser = await User.find({
          introducersUserName: intoducerId,
        }).exec();
        res.send(introducerUser);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get(
    "/api/get-single-Introducer/:id",
    Authorize(["superAdmin", "Profile-View", "Introducer-Profile-View"]),
    async (req, res) => {
      try {
        const id = req.params.id;
        const bankData = await IntroducerUser.findOne({ _id: id }).exec();
        res.status(200).send(bankData);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get(
    "/api/superadmin/user-id",
    Authorize([
      "superAdmin",
      "Dashboard-View",
      "Create-Deposit-Transaction",
      "Create-Withdraw-Transaction",
      "Create-Transaction",
    ]),
    async (req, res) => {
      try {
        const resultArray = await User.find({}, "userName").exec();
        res.status(200).send(resultArray);
      } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server error");
      }
    }
  );

  app.get(
    "/api/superadmin/Introducer-id",
    Authorize([
      "superAdmin",
      "Dashboard-View",
      "Create-Deposit-Transaction",
      "Create-Withdraw-Transaction",
      "Create-Transaction",
      "Website-View",
      "Bank-View",
      "Profile-View",
      "Create-User",
      "Create-Admin",
      "Transaction-Edit-Request",
      "Transaction-Delete-Request"
    ]),
    async (req, res) => {
      try {
        const resultArray = await IntroducerUser.find({}, "userName").exec();
        res.status(200).send(resultArray);
      } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server error");
      }
    }
  );

  app.post(
    "/api/admin/user/register",
    Authorize(["superAdmin", "Create-Admin", "Create-User"]),
    async (req, res) => {
      try {
        await userservice.createUser(req.body);
        res
          .status(200)
          .send({ code: 200, message: "User registered successfully!" });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get(
    "/api/admin/view-sub-admins/:page",
    Authorize(["superAdmin"]),
    async (req, res) => {
      const page = req.params.page;
      const searchQuery = req.query.search;
      try {
        let allIntroDataLength;
        if (searchQuery) {
          console.log('first')
          let SecondArray = [];
          const users = await Admin.find({ userName: { $regex: new RegExp(searchQuery, "i"), }, }).exec();
          SecondArray = SecondArray.concat(users);
          allIntroDataLength = SecondArray.length;
          const pageNumber = Math.ceil(allIntroDataLength / 10);
          res.status(200).json({ SecondArray, pageNumber, allIntroDataLength });
        } else {
          console.log('second')
          let introducerUser = await Admin.find({ roles: { $nin: ["superAdmin"] } }).exec();
          let introData = JSON.parse(JSON.stringify(introducerUser));
          console.log('introData', introData.length)

          const SecondArray = [];
          const Limit = page * 10;
          console.log("Limit", Limit);

          for (let j = Limit - 10; j < Limit && j < introData.length; j++) {
            if (introData[j]) {
              SecondArray.push(introData[j]);
            }
          }
          allIntroDataLength = introData.length;

          if (SecondArray.length === 0) {
            return res.status(404).json({ message: "No data found for the selected criteria." });
          }

          const pageNumber = Math.ceil(allIntroDataLength / 10);
          res.status(200).json({ SecondArray, pageNumber, allIntroDataLength });

        }
      } catch (e) {
        console.error(e);
        res.status(500).send({ message: "Internal Server Error" });
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
        const subAdminId = req.params.id;
        const subAdmin = await Admin.findById(subAdminId);
        if (!subAdmin) {
          throw { code: 500, message: "Sub Admin not found with the given Id" };
        }
        res.status(200).send(subAdmin);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.put(
    "/api/admin/edit-subadmin-roles/:id",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const subAdminId = req.params.id;
        const { roles } = req.body;
        if (!subAdminId) {
          throw { code: 400, message: "Id not found" };
        }
        const subAdmin = await Admin.findById(subAdminId);
        if (!subAdmin) {
          throw { code: 400, message: "Sub Admin not found" };
        }
        subAdmin.roles = roles;
        await subAdmin.save();
        res
          .status(200)
          .send(
            `${subAdmin.firstname} ${subAdmin.lastname} roles Edited with ${roles}`
          );
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get(
    "/introducer-user-single-data/:id",
    Authorize(["superAdmin", "Introducer-Profile-View", "Profile-View"]),
    async (req, res) => {
      try {
        const id = req.params.id;
        const introducerUser = await IntroducerUser.findOne(
          { _id: id },
          "userName"
        ).exec();
        if (!introducerUser) {
          return res.status(404).send({ message: "IntroducerUser not found" });
        }
        const users = await User.find({
          introducersUserName: introducerUser.userName,
        }).exec();
        res.send(users);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.post(
    "/api/admin/reset-password",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const { userName, password } = req.body;
        await AccountServices.SubAdminPasswordResetCode(userName, password);
        res
          .status(200)
          .send({ code: 200, message: "Password reset successful!" });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.post(
    "/api/admin/user/reset-password",
    Authorize(["superAdmin", "Create-User", "Create-Admin", "Profile-View", "User-Profile-View"]),
    async (req, res) => {
      try {
        const { userName, password } = req.body;
        await userservice.UserPasswordResetCode(userName, password);
        res
          .status(200)
          .send({ code: 200, message: "Password reset successful!" });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.post(
    "/api/admin/intorducer/reset-password",
    Authorize(["superAdmin", "Create-Admin", "Create-Introducer", "Introducer-Profile-View", "Profile-View"]),
    async (req, res) => {
      try {
        const { userName, password } = req.body;
        await introducerUser.intorducerPasswordResetCode(userName, password);
        res
          .status(200)
          .send({ code: 200, message: "Password reset successful!" });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.put(
    "/api/admin/subAdmin-profile-edit/:id",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const id = await Admin.findById(req.params.id);
        const updateResult = await AccountServices.updateSubAdminProfile(
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

  app.get(
    "/api/admin/user/introducersUserName/:userId",
    Authorize(["superAdmin"]),
    async (req, res) => {
      try {
        const userId = req.params.userId;
        const user = await User.findById(userId).exec();

        if (!user) {
          return res.status(404).send("User not found");
        }
        const introducersUserName = user.introducersUserName;
        res.status(200).send(introducersUserName);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.post(
    "/api/admin/filter-data",
    Authorize([
      "superAdmin",
      "Dashboard-View",
      "Transaction-View",
      "Transaction-Edit-Request",
      "Transaction-Delete-Request",
      "Website-View",
      "Bank-View",
      "report-all-txn"
    ]),
    async (req, res) => {
      try {
        const {
          page,
          itemsPerPage
        } = req.query;
        const {
          transactionType,
          introducerList,
          subAdminList,
          BankList,
          WebsiteList,
          sdate,
          edate,
          minAmount,
          maxAmount
        } = req.body;

        const filter = {};

        if (transactionType) {
          filter.transactionType = transactionType;
        }
        if (introducerList) {
          filter.introducerUserName = introducerList;
        }
        if (subAdminList) {
          filter.subAdminName = subAdminList;
        }
        if (BankList) {
          filter.bankName = BankList;
        }
        if (WebsiteList) {
          filter.websiteName = WebsiteList;
        }
        if (sdate && edate) {
          filter.createdAt = { $gte: new Date(sdate), $lte: new Date(edate) };
        } else if (sdate) {
          filter.createdAt = { $gte: new Date(sdate) };
        } else if (edate) {
          filter.createdAt = { $lte: new Date(edate) };
        }

        const transactions = await Transaction.find(filter).sort({ createdAt: -1 }).exec();
        // console.log('transactions', transactions)
        const websiteTransactions = await WebsiteTransaction.find(filter).sort({ createdAt: -1 }).exec();
        // console.log('websiteTransactions', websiteTransactions)
        const bankTransactions = await BankTransaction.find(filter).sort({ createdAt: -1 }).exec();
        // console.log('bankTransactions', bankTransactions)

        const filteredTransactions = transactions.filter((transaction) => {
          if (minAmount && maxAmount) {
            return (
              transaction.amount >= minAmount &&
              transaction.amount <= maxAmount
            );
          } else {
            return true;
          }
        });

        const filteredWebsiteTransactions = websiteTransactions.filter((transaction) => {
          if (minAmount && maxAmount) {
            return (
              transaction.withdrawAmount >= minAmount &&
              transaction.withdrawAmount <= maxAmount ||
              transaction.depositAmount >= minAmount &&
              transaction.depositAmount <= maxAmount

            );
          } else {
            return true;
          }
        });

        // console.log('filteredWebsiteTransactions', filteredWebsiteTransactions)

        const filteredBankTransactions = bankTransactions.filter((transaction) => {
          if (minAmount && maxAmount) {
            return (
              transaction.withdrawAmount >= minAmount &&
              transaction.withdrawAmount <= maxAmount ||
              transaction.depositAmount >= minAmount &&
              transaction.depositAmount <= maxAmount
            );
          } else {
            return true;
          }
        });

        // console.log('filteredBankTransactions', filteredBankTransactions)   

        const alltrans = [...filteredTransactions, ...filteredWebsiteTransactions, ...filteredBankTransactions];
        alltrans.sort((a, b) => b.createdAt - a.createdAt);
        // console.log('all',alltrans.length)
        const allIntroDataLength = alltrans.length;
        // console.log("allIntroDataLength", allIntroDataLength);
        let pageNumber = Math.floor(allIntroDataLength / 10 + 1);
        const skip = (page - 1) * itemsPerPage;
        const limit = parseInt(itemsPerPage);
        const paginatedResults = alltrans.slice(skip, skip + limit);
        // console.log('pagitren',paginatedResults.length)

        if (paginatedResults.length !== 0) {
          // console.log('s')
          // console.log('pagin', paginatedResults.length)
          return res.status(200).json({ paginatedResults, pageNumber, allIntroDataLength });
        }
        else {
          const itemsPerPage = 10; // Specify the number of items per page

          const totalItems = alltrans.length;
          const totalPages = Math.ceil(totalItems / itemsPerPage);

          let page = parseInt(req.query.page) || 1; // Get the page number from the request, default to 1 if not provided
          page = Math.min(Math.max(1, page), totalPages); // Ensure page is within valid range

          const skip = (page - 1) * itemsPerPage;
          const limit = Math.min(itemsPerPage, totalItems - skip); // Ensure limit doesn't exceed the number of remaining items
          const paginatedResults = alltrans.slice(skip, skip + limit);

          const pageNumber = page;
          const allIntroDataLength = totalItems;

          return res.status(200).json({ paginatedResults, pageNumber, totalPages, allIntroDataLength });

        }
      } catch (e) {
        console.error(e);
        res.status(e.code || 500).send({ message: e.message });
      }
    }
  );


  app.post('/api/admin/create/introducer/deposit-transaction', Authorize(["superAdmin", "Profile-View", "Introducer-Profile-View"]), async (req, res) => {
    try {
      const subAdminName = req.user;
      await TransactionServices.createIntroducerDepositTransaction(req, res, subAdminName);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.post('/api/admin/create/introducer/withdraw-transaction', Authorize(["superAdmin", "Profile-View", "Introducer-Profile-View"]), async (req, res) => {
    try {
      const subAdminName = req.user;
      await TransactionServices.createIntroducerWithdrawTransaction(req, res, subAdminName);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.get("/api/admin/introducer-account-summary/:id", Authorize(["superAdmin", "Profile-View", "Introducer-Profile-View"]), async (req, res) => {
    try {
      const id = req.params.id;
      const introSummary = await IntroducerTransaction.find({ introUserId: id }).sort({ createdAt: -1 }).exec();
      let balances = 0;
      let accountData = JSON.parse(JSON.stringify(introSummary));
      accountData.slice(0).reverse().map((data) => {
        if (data.transactionType === "Deposit") {
          balances += data.amount;
          data.balance = balances;
        } else {
          balances -= data.amount;
          data.balance = balances;
        }
      });
      res.status(200).send(accountData);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.post(
    "/api/super-admin/reset-password",
    Authorize(["superAdmin", "Dashboard-View", "Transaction-View", "Bank-View", "Website-View", "Profile-View", "User-Profile-View", "Introducer-Profile-View", "Transaction-Edit-Request", "Transaction-Delete-Request", "Create-Deposit-Transaction", "Create-Withdraw-Transaction", "Create-Transaction", "Create-SubAdmin", "Create-User", "Create-Introducer"]),
    async (req, res) => {
      try {
        const { userName, oldPassword, password } = req.body;
        await AccountServices.SuperAdminPasswordResetCode(userName, oldPassword, password);
        res.status(200).send({ code: 200, message: "Password reset successful!" });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get("/api/single-user-profile/:id", Authorize(["superAdmin", "Profile-View", "User-Profile-View"]), async (req, res) => {
    try {
      const id = req.params.id;
      const userProfile = await User.find({ _id: id }).sort({ createdAt: 1 }).exec();
      res.status(200).send(userProfile);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.get("/api/view-subadmin-transaction/:subadminId", Authorize(["superAdmin", "report-my-txn"]), async (req, res) => {
    try {
      const userId = req.params.subadminId;
      console.log('userId', userId)
      const transaction = await Transaction.find({ subAdminId: userId }).sort({ createdAt: -1 }).exec();
      const bankTransaction = await BankTransaction.find({ subAdminId: userId }).sort({ createdAt: -1 }).exec();
      const webisteTransaction = await WebsiteTransaction.find({ subAdminId: userId }).sort({ createdAt: -1 }).exec();
      // console.log('transaction', transaction)
      // console.log('bankTransaction', bankTransaction)
      // console.log('webisteTransaction', webisteTransaction)
      if (!transaction && !bankTransaction && !webisteTransaction) {
        return res.status(404).send({ message: "No transaction found" });
      }
      const allTransactions = [...transaction, ...bankTransaction, ...webisteTransaction]
      allTransactions.sort((a, b) => b.createdAt - a.createdAt);
      res.status(200).send(allTransactions);
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: "Internal server error" });
    }
  });
};

export default AccountsRoute;
