import { AuthorizeRole } from "../middleware/auth.js";
import { User } from "../models/user.model.js";
import { userBank } from "../models/userBank.model.js";
import { userWebsite } from "../models/userWebsite.model.js";
import { userservice } from "../services/user.service.js";

export const UserRoutes = (app) => {
  app.post("/api/accounts/user/login", async (req, res) => {
    try {
      const { email, password, persist } = req.body;
      if (!email) {
        throw { code: 400, message: "Email ID is required" };
      }

      if (!password) {
        throw { code: 400, message: "Password is required" };
      }
      const accessToken = await userservice.generateAccessToken(
        email,
        password,
        persist
      );

      if (!accessToken) {
        throw { code: 500, message: "Failed to generate access token" };
      }
      const user = await User.findOne({ email: email });
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

  app.post("/api/accounts/user/register", async (req, res) => {
    try {
      await userservice.createUser(req.body);
      res
        .status(200)
        .send({ code: 200, message: "User registered successfully!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

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

  app.post("/api/accounts/reset-password", async (req, res) => {
    try {
      const { code, email, password } = req.body;
      await userservice.verifyPasswordResetCode(code, email, password);
      res
        .status(200)
        .send({ code: 200, message: "Password reset successful!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.get(
    "/api/accounts/profileUserData",
    AuthorizeRole(["user"]),
    async (req, res) => {
      try {
        const user = req.user;
        const response = {
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          emailVerified: user.emailVerified,
          contactNumber: user.contactNumber,
          wallet: user.wallet.amount,
          role: user.role,
          account_name: user.bankDetail.accountName
            ? user.bankDetail.accountName
            : null,
          ifsc_code: user.bankDetail.ifscCode ? user.bankDetail.ifscCode : null,
          account_number: user.bankDetail.accountNumber
            ? user.bankDetail.accountNumber
            : null,
          profileUrl: user.profilePicture,
          id: user.id,
        };
        res.status(200).send(response);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

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


  app.post(
    "/api/user/add-website-name",
    AuthorizeRole(["user"]),
    async (req, res) => {
      try {
        const userData = req.body;
        console.log(userData)
        const userId = req.user.id;
        const user = await User.findById(userId);
        user.webSiteDetail.push(userData);
        console.log(user.webSiteDetail)
        await user.save();
        res.status(200).send({ message: "Website details updated successfully." });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

};


export default UserRoutes;
