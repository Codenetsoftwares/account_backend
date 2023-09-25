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
import { Website } from "../models/website.model.js";
import { Bank } from "../models/bank.model.js";

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

  app.post("/api/create/user-admin", Authorize(["superAdmin"]), async (req, res) => {
    try {
      await AccountServices.createAdmin(req.body);
      res.status(200).send({ code: 200, message: "Admin registered successfully!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  // API To View User Profiles

  app.get("/api/user-profile", Authorize(["superAdmin", "Profile-View", "User-Profile-View"]), async (req, res) => {
    try {
      const user = await User.find({}).exec();
      res.send(user);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  // API To Edit User Profiles

  app.put("/api/admin/user-profile-edit/:id", Authorize(["superAdmin", "User-Profile-View", "Profile-View"]), async (req, res) => {
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

  app.get("/api/admin/sub-admin-name", Authorize(["superAdmin", "Dashboard-View", "Transaction-View", "Transaction-Edit-Request", "Transaction-Delete-Request"]), async (req, res) => {
    try {
      const superAdmin = await Admin.find({ roles: "superAdmin" }, "firstname").exec();
      res.status(200).send(superAdmin);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.get("/api/admin/account-summary", Authorize(["superAdmin", "Dashboard-View", "Transaction-View", "Transaction-Edit-Request", "Transaction-Delete-Request"]), async (req, res) => {
    try {
      const transactions = await Transaction.find({}).sort({ createdAt: 1 }).exec();
      const websiteTransactions = await WebsiteTransaction.find({}).sort({ createdAt: 1 }).exec();
      const bankTransactions = await BankTransaction.find({}).sort({ createdAt: 1 }).exec();
      const allTransactions = [...transactions, ...websiteTransactions, ...bankTransactions];
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


  app.post("/api/admin/accounts/introducer/register", Authorize(["superAdmin"]), async (req, res) => {
    try {
      await introducerUser.createintroducerUser(req.body);
      res.status(200).send({ code: 200, message: "Introducer User registered successfully!" });
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
      res.status(200).send({ code: 200, message: "Introducer Percentage Transferred successfully!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.get("/api/admin/introducer-live-balance/:id", Authorize(["superAdmin", "Profile-View", "Introducer-Profile-View"]), async (req, res) => {
    try {
      const id = await IntroducerUser.findById(req.params.id);
      console.log("id", id)
      const data = await introducerUser.introducerLiveBalance(id);
      console.log("data", data)
      res.send({ LiveBalance: data })
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.put("/api/admin/intoducer-profile-edit/:id", Authorize(["superAdmin", "Profile-View", "Introducer-Profile-View"]), async (req, res) => {
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

  app.get("/api/intoducer-profile", Authorize(["superAdmin", "Introducer-Profile-View", "Profile-View"]), async (req, res) => {
    try {
      const introducerUser = await IntroducerUser.find({}).exec();
      res.send(introducerUser);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.get("/api/intoducer/client-data/:id", Authorize(["superAdmin", "Profile-View", "Introducer-Profile-View"]), async (req, res) => {
    try {
      const id = req.params.id;
      const intoducer = await IntroducerUser.findOne({ id }).exec();
      const intoducerId = intoducer.userName;
      const introducerUser = await User.find({ introducersUserName: intoducerId }).exec();
      res.send(introducerUser);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.get("/api/get-single-Introducer/:id", Authorize(["superAdmin", "Profile-View", "Introducer-Profile-View"]), async (req, res) => {
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

  app.get("/api/superadmin/user-id", Authorize(["superAdmin", "Dashboard-View", "Create-Deposit-Transaction", "Create-Withdraw-Transaction", "Create-Transaction"]), async (req, res) => {
    try {
      const resultArray = await User.find({}, "userName").exec();
      res.status(200).send(resultArray);
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server error");
    }
  }
  );

  app.get("/api/superadmin/Introducer-id", Authorize(["superAdmin", "Dashboard-View", "Create-Deposit-Transaction", "Create-Withdraw-Transaction", "Create-Transaction"]), async (req, res) => {
    try {
      const resultArray = await IntroducerUser.find({}, "userName").exec();
      res.status(200).send(resultArray);
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server error");
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
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
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

  app.put("/api/admin/edit-subadmin-roles/:id", Authorize(["superAdmin"]),
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
        res.status(200).send(`${subAdmin.firstname} ${subAdmin.lastname} roles Edited with ${roles}`);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get("/introducer-user-single-data/:id", Authorize(["superAdmin", "Introducer-Profile-View", "Profile-View"]), async (req, res) => {
    try {
      const id = req.params.id;
      const introducerUser = await IntroducerUser.findOne({ _id: id }, "userName").exec();
      if (!introducerUser) {
        return res.status(404).send({ message: 'IntroducerUser not found' });
      }
      const users = await User.find({ introducersUserName: introducerUser.userName }).exec();
      res.send(users);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });


  app.post("/api/admin/reset-password", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const { userName, password } = req.body;
      await AccountServices.SubAdminPasswordResetCode(userName, password);
      res.status(200).send({ code: 200, message: "Password reset successful!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.post("/api/admin/user/reset-password", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const { userName, password } = req.body;
      await userservice.UserPasswordResetCode(userName, password);
      res.status(200).send({ code: 200, message: "Password reset successful!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.post("/api/admin/intorducer/reset-password", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const { userName, password } = req.body;
      await introducerUser.intorducerPasswordResetCode(userName, password);
      res.status(200).send({ code: 200, message: "Password reset successful!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.put("/api/admin/subAdmin-profile-edit/:id", Authorize(["superAdmin", "Profile-View", "Introducer-Profile-View"]), async (req, res) => {
    try {
      const id = await Admin.findById(req.params.id);
      const updateResult = await AccountServices.updateSubAdminProfile(id, req.body);
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

  app.get("/api/admin/user/introducersUserName/:userId", Authorize(["superAdmin"]), async (req, res) => {
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
  });
  
  app.post("/api/admin/filter-data", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const { transactionType, introducerList, subAdminList, BankList, WebsiteList } = req.body;
      const query = {};
      console.log('Query:', query);
      if (transactionType) {
        query.transactionType = transactionType;
      }
  
      if (introducerList) {
        query.introducerUserName = introducerList;
      }
  
      if (subAdminList) {
        query.subAdminName = subAdminList;
      }
  
      if (BankList) {
        query.bankName = BankList;
      }
  
      if (WebsiteList) {
        query.websiteName = WebsiteList;
      }
      const transactions = await Transaction.find(query).sort({ createdAt: 1 }).exec();
      console.log('Query:', query); 
      const websiteTransactions = await WebsiteTransaction.find(query).sort({ createdAt: 1 }).exec();
      const bankTransactions = await BankTransaction.find(query).sort({ createdAt: 1 }).exec();
      if (
        transactions.length === 0 &&
        websiteTransactions.length === 0 &&
        bankTransactions.length === 0
      ) {
        return res.status(404).json({ message: "No data found for the selected criteria." });
      }
      res.status(200).json({ transactions, websiteTransactions, bankTransactions });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message });
    }
  });

};

export default AccountsRoute;
