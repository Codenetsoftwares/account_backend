import { Authorize } from "../middleware/Authorize.js";
import { User } from "../models/user.model.js";
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
      const accessToken = await userservice.generateAccessToken(email, password, persist);

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
          token: accessToken
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
    Authorize(["player"]),
    async (req, res) => {
      try {
        const user = req.user;
        const response = {
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          emailVerified: user.emailVerified,
          kycVerified: user.kycVerified,
          wallet: user.wallet.amount,
          role: user.role,
          lichess_username: user.lichess.username,

          account_name: user.bankDetail.accountName
            ? user.bankDetail.accountName
            : null,
          ifsc_code: user.bankDetail.ifscCode ? user.bankDetail.ifscCode : null,
          account_number: user.bankDetail.accountNumber
            ? user.bankDetail.accountNumber
            : null,
          profileUrl: user.profilePicture,
          id: user.id
        };
        res.status(200).send(response);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );
};

export default UserRoutes;