import { AuthorizeRole } from "../middleware/auth.js";
import { User } from "../models/user.model.js";
import { userservice } from "../services/user.service.js";

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
      res.status(500).send({ message: "Internal Server Error" });
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

};


export default UserRoutes;
