import AccountServices from "../services/Accounts.services.js";
import { Admin } from '../models/admin_user.js';
import { User } from "../models/user.model.js";
import { Authorize } from "../middleware/Authorize.js";

const AccountsRoute = (app) => {

  app.post("/admin/login", async (req, res) => {
    try {
      const { email, password, persist } = req.body;

      if (!email) {
        throw { code: 400, message: "Email ID is required" };
      }

      if (!password) {
        throw { code: 400, message: "Password is required" };
      }

      const user = await Admin.findOne({ email: email });
      console.log( "user", user);
      if (!user) {
        throw { code: 404, message: "User not found" };
      }

      const accessToken = await AccountServices.generateAdminAccessToken(
        email,
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

  app.post("/api/create/user-admin",Authorize(["superAdmin"]), async (req, res) => {
    try {
      await AccountServices.createAdmin(req.body);
      res
        .status(200)
        .send({ code: 200, message: "Admin registered successfully!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });
  
  app.post("/user/login", async (req, res) => {
    try {
      const { email, password, persist } = req.body;

      if (!email) {
        throw { code: 400, message: "Email ID is required" };
      }

      if (!password) {
        throw { code: 400, message: "Password is required" };
      }

      const user = await User.findOne({ email: email });
      console.log(user);
      if (!user) {
        throw { code: 404, message: "User not found" };
      }

      const accessToken = await AccountServices.generateAccessToken(
        email,
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

  app.post("/api/create/user", async (req, res) => {
    try {
      await AccountServices.createUser(req.body);
      res
        .status(200)
        .send({ code: 200, message: "User registered successfully!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });
  

  
};

export default AccountsRoute;
