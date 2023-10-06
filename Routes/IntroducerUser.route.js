import { introducerUser } from "../services/introducer.services.js";
import { IntroducerUser } from "../models/introducer.model.js"
import { AuthorizeRole } from "../middleware/auth.js";
import { User } from "../models/user.model.js";
import AccountServices from "../services/Accounts.services.js"
import { IntroducerTransaction } from "../models/IntroducerTransaction.model.js";

export const IntroducerRoutes = (app) => {

  app.post("/api/introducer/user/login", async (req, res) => {
    try {
      const { userName, password, persist } = req.body;
      if (!userName) {
        throw { code: 400, message: "User Name is required" };
      }

      if (!password) {
        throw { code: 400, message: "Password is required" };
      }
      const accessToken = await introducerUser.generateIntroducerAccessToken(
        userName,
        password,
        persist
      );

      if (!accessToken) {
        throw { code: 500, message: "Failed to generate access token" };
      }
      const user = await IntroducerUser.findOne({ userName: userName });
      if (!user) {
        throw { code: 404, message: "User not found" };
      }
      if (user && accessToken) {
        res.status(200).send({
          token: accessToken,
        });
      } else {
        res
          .status(404)
          .json({ error: "User not found or access token is invalid" });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.get("/api/intoducer/profile", AuthorizeRole(["introducer"]), async (req, res) => {
    try {
      const userId = req.user;
      const user = await IntroducerUser.findById(userId).exec();
      const introUserId = user._id;
      const TPDLT = await AccountServices.IntroducerBalance(introUserId);
      const response = {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        userName: user.userName,
        balance: TPDLT,
      };
      const liveBalance = await introducerUser.introducerLiveBalance(introUserId);
      const currentDue = liveBalance - response.balance;
      response.currentDue = currentDue;
      res.status(201).send(response);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message })
    }
  })

  app.put(
    "/api/intoducer-profile-edit/:id",
    AuthorizeRole(["introducer"]),
    async (req, res) => {
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

  app.get("/api/intoducer/user-data/:id", AuthorizeRole(["introducer"]), async (req, res) => {
    try {
      const id = req.params.id;
      const intoducer = await IntroducerUser.findOne({ id }).exec();
      const intoducerId = intoducer.introducerId;
      const introducerUser = await User.find({ introducersUserId: intoducerId }).exec();
      res.send(introducerUser);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.get("/api/list-introducer-user", AuthorizeRole(["introducer"]), async (req, res) => {
    try {
      const introducerId = req.user.introducerId
      const intoducerUser = await User.find({ introducersUserId: introducerId }).exec();
      res.send(intoducerUser);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.get("/api/introducer-user-single-data/:id", AuthorizeRole(["introducer"]), async (req, res) => {
    try {
      const id = req.params.id;
      const introducerId = req.user.introducerId;
      const introducerUser = await User.find({ _id: id, introducersUserId: introducerId }).exec();
      res.send(introducerUser);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.get("/api/introducer/introducer-live-balance/:id", AuthorizeRole(["introducer"]), async (req, res) => {
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

  app.get("/api/introducer-account-summary/:id", AuthorizeRole(["introducer"]), async (req, res) => {
    try {
      const id = req.params.id;
      const introSummary = await IntroducerTransaction.find({ introUserId: id }).sort({ createdAt: 1 }).exec();
      // let balances = 0;
      // let accountData = JSON.parse(JSON.stringify(introSummary));
      //   accountData.slice(0).reverse().map((data) => {
      //       if (data.transactionType === "Deposit") {
      //         balances += data.amount;
      //         data.balance = balances;
      //       } else {
      //         balances -= data.amount;
      //         data.balance = balances;
      //       }
      //     });
      res.status(200).send(introSummary);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );
};


export default IntroducerRoutes;  
