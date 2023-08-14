import AccountServices from "../services/Accounts.services.js";
import { Admin } from '../models/admin_user.js';
import { Authorize } from "../middleware/Authorize.js";
import { Bank } from "../models/bank.model.js"
import { Website} from "../models/website.model.js"
import { User } from "../models/user.model.js";

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
      console.log("user", user);
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

  app.post("/api/create/user-admin", Authorize(["superAdmin"]), async (req, res) => {
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


  app.post("/api/add-bank-name", Authorize(["superAdmin"]), async (req, res) => {
    try {

      const bankName = req.body.name;
      if (!bankName) {
        throw { code: 400, message: "Please give a bank name to add" };
      }
      const newBankName = new Bank({
        name: bankName
      });
      newBankName.save();
      res
        .status(200)
        .send({ message: "Bank registered successfully!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.post("/api/delete-bank-name", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const { name } = req.body;
      console.log("req.body", name);
      
      const bankToDelete = await Bank.findOne({ name: name }).exec();
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
  });
  

  app.get("/api/get-bank-name", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const bankData = await Bank.find({}).exec();
      res.status(200).send(bankData);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  })

  app.post("/api/add-website-name", Authorize(["superAdmin"]), async (req, res) => {
    try {

      const websiteName = req.body.name;
      if (!websiteName) {
        throw { code: 400, message: "Please give a website name to add" };
      }
      const newWebsiteName = new Website({
        name: websiteName
      });
      newWebsiteName.save();
      res
        .status(200)
        .send({ message: "Website registered successfully!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });
  
  app.post("/api/delete-wesite-name", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const { name } = req.body;
      console.log("req.body", name);
      
      const WebsiteToDelete = await Website.findOne({ name: name }).exec();
      if (!WebsiteToDelete) {
        return res.status(404).send({ message: "Bank not found" });
      }
  
      console.log("WebsiteToDelete", WebsiteToDelete);
  
      const deleteData = await Website.deleteOne({ _id: WebsiteToDelete._id }).exec();
      console.log("deleteData", deleteData);
  
      res.status(200).send({ message: "Website name removed successfully!" });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message });
    }
  });
  
  app.get("/api/get-website-name", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const websiteData = await Website.find({}).exec();
      res.status(200).send(websiteData);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });
  
  app.get("/api/user-profile", Authorize(["user"]), async (req, res) => {
    try{
      const user = await User.find({}).exe
      res.send(user);
    }catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  })


};

export default AccountsRoute;
