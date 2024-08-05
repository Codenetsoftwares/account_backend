import { introducerUser } from '../services/introducer.services.js';
import { IntroducerUser } from '../models/introducer.model.js';
import { AuthorizeRole } from '../middleware/auth.js';
import { User } from '../models/user.model.js';
import AccountServices from '../services/Accounts.services.js';
import { IntroducerTransaction } from '../models/IntroducerTransaction.model.js';
import { validateLogin } from '../utils/commonSchema.js';
import customErrorHandler from '../utils/customErrorHandler.js';

export const IntroducerRoutes = (app) => {

  app.post('/api/introducer/user/login', 
    introducerUser.introducerLogin
  );

  app.get('/api/intoducer/profile', customErrorHandler,
    AuthorizeRole(['introducer']),
    introducerUser. getInroducerProfile
    
);

  app.put('/api/intoducer-profile-edit/:id',customErrorHandler,
    AuthorizeRole(['introducer']), 
      introducerUser.updateIntroducerProfile   
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

  app.get("/api/list-introducer-user/:id", AuthorizeRole(["introducer"]), async (req, res) => {
    try {
      const id = req.params.id;
      const introducerUser = await IntroducerUser.findOne(
        { _id: id },
        "userName"
      ).exec();
      console.log('introuser', introducerUser)
      if (!introducerUser) {
        return res.status(404).send({ message: "IntroducerUser not found" });
      }

      // Fetch users with introducer names matching any of the three fields
      const users = await User.find({
        $or: [
          { introducersUserName: introducerUser.userName },
          { introducersUserName1: introducerUser.userName },
          { introducersUserName2: introducerUser.userName }
        ]
      }).exec();
      

      res.send(users);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  app.get("/api/introducer-user-single-data/:id", AuthorizeRole(["introducer"]), async (req, res) => {
    try {
      const id = req.params.id;
      const user = req.user;
      const introUser = user.userName;
      const introducerUser = await User.findOne({ _id: id }).exec();
      console.log("ddd", introducerUser);
      // Check if introducerUser exists
      if (!introducerUser) {
        return res.status(404).send({ message: 'User not found' });
      }
      
      let filteredIntroducerUser = {
        _id: introducerUser._id,
        firstname: introducerUser.firstname,
        lastname: introducerUser.lastname,
        userName: introducerUser.userName,
        wallet: introducerUser.wallet,
        role: introducerUser.role,
        webSiteDetail: introducerUser.webSiteDetail,
        transactionDetail: introducerUser.transactionDetail
      };
      
      let matchedIntroducersUserName = null;
      let matchedIntroducerPercentage = null;
      
      // Check if req.user.UserName exists in introducerUser's introducersUserName, introducersUserName1, or introducersUserName2 fields
      if (introducerUser.introducersUserName === introUser) {
        matchedIntroducersUserName = introducerUser.introducersUserName;
        matchedIntroducerPercentage = introducerUser.introducerPercentage;
      } else if (introducerUser.introducersUserName1 === introUser) {
        matchedIntroducersUserName = introducerUser.introducersUserName1;
        matchedIntroducerPercentage = introducerUser.introducerPercentage1;
      } else if (introducerUser.introducersUserName2 === introUser) {
        matchedIntroducersUserName = introducerUser.introducersUserName2;
        matchedIntroducerPercentage = introducerUser.introducerPercentage2;
      }
      
      // If matched introducersUserName found, include it along with percentage in the response
      if (matchedIntroducersUserName) {
        filteredIntroducerUser.matchedIntroducersUserName = matchedIntroducersUserName;
        filteredIntroducerUser.introducerPercentage = matchedIntroducerPercentage;
        return res.send(filteredIntroducerUser);
      } else {
        return res.status(403).send({ message: 'Unauthorized' });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || 'Internal Server Error' });
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

  app.post(
    "/api/introducer/reset-password",
    AuthorizeRole(["introducer"]),
    async (req, res) => {
      try {
        const { userName, oldPassword, password } = req.body;
        await introducerUser.introducerPasswordResetCode(userName, oldPassword, password);
        res.status(200).send({ code: 200, message: "Password reset successful!" });
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  // app.get("/api/introducer/data/:id",AuthorizeRole(["introducer"]),
  //   async (req, res) => {
  //     try {

  //       const {  
  //         sdate,
  //         edate
  //       } = req.body;
  //       const filter = {};
  //       if (sdate && edate) {
  //         filter.createdAt = { $gte: new Date(sdate), $lte: new Date(edate) };
  //       } else if (sdate) {
  //         filter.createdAt = { $gte: new Date(sdate) };
  //       } else if (edate) {
  //         filter.createdAt = { $lte: new Date(edate) };
  //       }
  //       const id = req.params.id; 
  //       console.log('id', id)
  //       const introducerUser = await IntroducerUser.findOne({ _id: id }, "userName").exec();
  //       console.log('introducerUser', introducerUser)
  //       if (!introducerUser) {
  //         return res.status(404).send({ message: "IntroducerUser not found" });
  //       }
  //       const users = await User.find({
  //         introducersUserName: introducerUser.userName,
  //       }).exec();
  //       console.log('first')

  //       res.send(users);

  //     } catch (e) {
  //       console.error(e);
  //       res.status(e.code).send({ message: e.message });
  //     }
  //   })

  app.get("/api/introducer-user/accountsummary/:introducerUsername", AuthorizeRole(["introducer"]), async (req, res) => {
    try {
        const id = req.params.introducerUsername;
        const introSummary = await User.find({ introducersUserName: id }).sort({ createdAt: 1 }).exec();
        
        const formattedIntroSummary = {
            transaction: introSummary.flatMap(user => user.transactionDetail)
        };

        res.status(200).send(formattedIntroSummary);
    } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
    }
});


};


export default IntroducerRoutes;  
