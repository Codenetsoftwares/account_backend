import { AuthorizeRole } from "../middleware/auth.js";
import AccountServices from "../services/Accounts.services.js";
import { Authorize } from "../middleware/Authorize.js";
import { User } from "../models/user.model.js";
import { userservice } from "../services/user.service.js";
import { Transaction } from "../models/transaction.js";
import { Admin } from "../models/admin_user.js";
import { Website } from "../models/website.model.js";
import { Bank } from "../models/bank.model.js";
import { BankTransaction } from "../models/BankTransaction.model.js";
import { WebsiteTransaction } from "../models/WebsiteTransaction.model.js";

export const UserRoutes = (app) => {

  // API For User Login

  app.post("/api/accounts/user/login", async (req, res) => {
    try {
      const { userName, password, persist } = req.body;
      if (!userName) {
        throw { code: 400, message: "User Name is required" };
      }

      if (!password) {
        throw { code: 400, message: "Password is required" };
      }
      const accessToken = await userservice.generateAccessToken(
        userName,
        password,
        persist
      );

      if (!accessToken) {
        throw { code: 500, message: "Failed to generate access token" };
      }
      const user = await User.findOne({ userName: userName });
      if (!user) {
        throw { code: 404, message: "User not found" };
      }
      const balance = user.wallet.amount;
      if (user && accessToken) {
        res.status(200).send({
          token: accessToken,
        });
      } else {
        // User not found or access token is invalid
        res
          .status(404)
          .json({ error: "User not found or access token is invalid" });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  // API To Create User

  app.post("/api/accounts/user/register", async (req, res) => {
    try {
      await userservice.createUser(req.body);
      res.status(200).send({ code: 200, message: "User registered successfully!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  // API To Verify User Email-Id

  app.post("/api/accounts/verify-email", async (req, res) => {
    try {
      const { email, code } = req.body;
      await userservice.verifyEmail(email, code);
      res
        .status(200)
        .send({ code: 200, message: "Email verified successfully!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  // API To Initiate Reset User Password

  app.post("/api/accounts/initiate-reset-password", async (req, res) => {
    try {
      const { email } = req.body;
      await userservice.sendResetPasswordEmail(email);
      res.status(200).send({ code: 200, message: "Password Reset Code Sent" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  // API To Add Bank Name

  app.post(
    "/api/user/add-bank-name",
    AuthorizeRole(["user"]),
    async (req, res) => {
      try {
        const userData = req.body;
        const userId = req.user.id;
        const user = await User.findById(userId);
        user.bankDetail.accountHolderName = userData.accountHolderName;
        user.bankDetail.bankName = userData.bankName;
        user.bankDetail.ifscCode = userData.ifscCode;
        user.bankDetail.accountNumber = userData.accountNumber;
        await user.save();
        res.status(200).send({ message: "Bank details updated successfully." });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  // API To Add Website Name

  app.post(
    "/api/user/add-website-name",
    AuthorizeRole(["user"]),
    async (req, res) => {
      try {
        console.log(req.body)
        console.log(req.body)
        const { websiteName } = req.body;
        console.log("websiteName", websiteName);
        const userId = req.user.id;
        console.log("id", userId);
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).send({ message: "User not found." });
        }
        const newWebsiteDetail = {
          websiteName: websiteName,
        };
        user.webSiteDetail.push(newWebsiteDetail);
        await user.save();
        res.status(200).send({ message: "Website details updated successfully." });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );


  // API To Add UPI Details

  app.post(
    "/api/user/add-upi-name",
    AuthorizeRole(["user"]),
    async (req, res) => {
      try {
        const userData = req.body;
        const userId = req.user.id;
        const user = await User.findById(userId);
        user.upiDetail.upiId = userData.upiId;
        user.upiDetail.upiApp = userData.upiApp;
        user.upiDetail.upiNumber = userData.upiNumber;
        await user.save();
        res.status(200).send({ message: "UPI details updated successfully." });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  // API To Edit User Profiles

  app.put(
    "/api/user-profile-edit/:id",
    AuthorizeRole(["user"]),
    async (req, res) => {
      try {
        const id = await User.findById(req.params.id);
        const updateResult = await userservice.updateUserProfile(id, req.body);
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

  // API To View User Profiles

  app.get("/api/user-profile-data/:userId", AuthorizeRole(["user"]), async (req, res) => {
    try {
      const userId = req.params.userId;
      const userData = await User.findById(userId).exec();
      if (!userData) {
        return res.status(404).send({ message: "User not found" });
      }
      res.status(200).send(userData);
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: "Internal server error" });
    }
  });


  app.post(
    "/api/user/reset-password",
    AuthorizeRole(["user"]),
    async (req, res) => {
      try {
        const { userName, oldPassword, password } = req.body;
        await userservice.userPasswordResetCode(userName, oldPassword, password);
        res.status(200).send({ code: 200, message: "Password reset successful!" });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get(
    "/api/super-admin/user-profile/:page",
    Authorize(["superAdmin"]),
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

  app.post("/api/super-admin/login", async (req, res) => {
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

  app.post('/api/admin/delete/user/:userName', Authorize(["superAdmin"]), async (req, res) => {
    try {
      const user = req.params.userName;
      console.log("userName", user);
      await Transaction.deleteMany({ userName: user });
      const deleteUser = await User.findOneAndDelete(user);
      if (!deleteUser) {
        return res.status(404).send({ message: 'User not found' });
      }
      res.status(200).send({ message: 'User and associated transactions deleted successfully' });
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: 'Internal server error' });
    }
  });

  app.post('/api/admin/update/user/name/:userName', Authorize(["superAdmin"]), async (req, res) => {
    try {
      const user = req.params.userName;
      const newUserName = req.body.newUserName;
      const userToUpdate = await User.findOne({ userName: user });
      if (!userToUpdate) {
        return res.status(404).send({ message: 'User not found' });
      }
      userToUpdate.userName = newUserName;
      await userToUpdate.save();
      const transactions = await Transaction.find({ userName: user });
      transactions.forEach((transaction) => {
        transaction.userName = newUserName;
      });
      await Promise.all(transactions.map((transaction) => transaction.save()));
      res.status(200).send({ message: 'User username and associated transactions updated successfully' });
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: 'Internal server error' });
    }
  });

  app.get("/api/view-subadmin-transaction/:subadminId", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const userId = req.params.subadminId;
      console.log('userId', userId)
      const transaction = await Transaction.findOne({ subAdminUserName: userId }).exec();
      const bankTransaction = await BankTransaction.findOne({ subAdminName: userId }).exec();
      const webisteTransaction = await WebsiteTransaction.findOne({ subAdminName: userId }).exec();
      console.log('transaction', transaction)
      console.log('bankTransaction', bankTransaction)
      console.log('webisteTransaction', webisteTransaction)
      if (!transaction && !bankTransaction && !webisteTransaction) {
        return res.status(404).send({ message: "No transaction found" });
      }

      let statement = [transaction,bankTransaction,webisteTransaction]
      res.status(200).send(statement);
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: "Internal server error" });
    }
  });

};


export default UserRoutes;
