import AccountServices from "../services/Accounts.services.js";
import { Authorize } from "../middleware/Authorize.js";
import { Website } from "../models/website.model.js";
import { WebsiteTransaction } from "../models/WebsiteTransaction.model.js";
import { Transaction } from "../models/transaction.js";
import lodash from "lodash";
import { EditWebsiteRequest } from "../models/EditWebsiteRequest.model.js";

const WebisteRoutes = (app) => {

  // API To Add Website Name

  app.post("/api/add-website-name", Authorize(["superAdmin", "Transaction-View", "Website-View"]), async (req, res) => {
    try {
      const userName = req.user;
      console.log("userName", userName)
      const websiteName = req.body.websiteName;
      if (!websiteName) {
        throw { code: 400, message: "Please give a website name to add" };
      }
      const newWebsiteName = new Website({
        websiteName: websiteName,
        subAdminId: userName.userName,
        subAdminName : userName.firstname
      });
      console.log("newWebsiteName", newWebsiteName)
      const id = await Website.find(req.params.id);
      id.map((data) => {
        console.log(data.websiteName)
        if (newWebsiteName.websiteName.toLocaleLowerCase() === data.websiteName.toLocaleLowerCase()) {
          throw { code: 400, message: "Website name exists already!" };
        }
      })
      await newWebsiteName.save();
      res.status(200).send({ message: "Website registered successfully!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  // API To Edit Website Name

  app.put("/api/website-edit/:id", Authorize(["superAdmin", "Transaction-View", "Website-View"]), async (req, res) => {
    try {
      const id = await Website.findById(req.params.id);
      console.log("id", id);
      const updateResult = await AccountServices.updateWebsite(id, req.body);
      console.log(updateResult);
      if (updateResult) {
        res.status(201).send("Website Detail's Sent to Super Admin For Approval");
      }
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  // API To Delete Website Name

  app.post(
    "/api/delete-wesite-name",
    Authorize(["superAdmin", "Transaction-View", "Website-View"]),
    async (req, res) => {
      try {
        const { websiteName } = req.body;
        console.log("req.body", websiteName);

        const WebsiteToDelete = await Website.findOne({
          websiteName: websiteName,
        }).exec();
        if (!WebsiteToDelete) {
          return res.status(404).send({ message: "Website not found" });
        }

        console.log("WebsiteToDelete", WebsiteToDelete);

        const deleteData = await Website.deleteOne({
          _id: WebsiteToDelete._id,
        }).exec();
        console.log("deleteData", deleteData);

        res.status(200).send({ message: "Website name removed successfully!" });
      } catch (e) {
        console.error(e);
        res.status(e.code || 500).send({ message: e.message });
      }
    }
  );

  // API To View Website Name

  app.get("/api/get-website-name", Authorize(["superAdmin", "Dashboard-View", "Transaction-View", "Transaction-Edit-Request", "Transaction-Delete-Request", "Create-Transaction","Create-Deposit-Transaction","Create-Withdraw-Transaction","Website-View",
  "Profile-View", "Bank-View"]),
    async (req, res) => {
      try {
        const dbWebiteData = await Website.find({}).exec();
        let websiteData = JSON.parse(JSON.stringify(dbWebiteData));
        for (var index = 0; index < websiteData.length; index++) {
            websiteData[index].balance = await AccountServices.getWebsiteBalance(websiteData[index]._id);
          }
        res.status(200).send(websiteData);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.get("/api/get-single-webiste-name/:id", Authorize(["superAdmin", "Transaction-View", "Bank-View"]), async (req, res) => {
    try {
      const id = req.params.id;
      const dbWebsiteData = await Website.findOne({ _id: id }).exec();     
      if (!dbWebsiteData) {
        return res.status(404).send({ message: 'Website not found' });
      }
      const websiteId = dbWebsiteData._id;
      const bankBalance = await AccountServices.getWebsiteBalance(websiteId);
      const response = {
        _id: dbWebsiteData._id,
        websiteName: dbWebsiteData.websiteName,
        subAdminId: dbWebsiteData.subAdminId,
        subAdminName: dbWebsiteData.subAdminName,
        balance: bankBalance,
      };
  
      res.status(200).send(response);
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: 'Internal server error' });
    }
  });

  app.post("/api/admin/add-website-balance/:id", Authorize(["superAdmin", "Website-View", "Transaction-View"]), async (req, res) => {
    try {
      const id = req.params.id;
      const userName = req.user;
      const { amount, transactionType, remarks } = req.body;
      if (transactionType !== "Manual-Website-Deposit") {
        return res.status(500).send({ message: "Invalid transaction type" });
      }
      if (!amount || typeof amount !== "number") {
        return res.status(400).send({ message: "Invalid amount" });
      }
      if (!remarks) {
        throw { code: 400, message: "Remark is required" };
      }
      const website = await Website.findOne({ _id: id }).exec();
      if (!website) {
          return res.status(404).send({ message: "Website  not found" });
        }
        console.log("website.id", website._id)
      const websiteTransaction = new WebsiteTransaction({
        websiteId: website._id,
        websiteName: website.websiteName,
        transactionType: transactionType,
        depositAmount: amount,
        subAdminId: userName.userName,
        subAdminName: userName.firstname,
        remarks: remarks,
        createdAt: new Date(),
      });
      console.log("websiteTransaction", websiteTransaction)
      await websiteTransaction.save();
      res.status(200).send({ message: "Wallet Balance Added to Your Website" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.post("/api/admin/withdraw-website-balance/:id", Authorize(["superAdmin", "Website-View", "Transaction-View"]), async (req, res) => {
    try {
      const id = req.params.id;
      const userName = req.user;
      const { amount, transactionType, remarks } = req.body;
      if (!amount || typeof amount !== "number") {
        return res.status(400).send({ message: "Invalid amount" });
      }
      if (transactionType !== "Manual-Website-Withdraw") {
        return res.status(500).send({ message: "Invalid transaction type" });
      }
      if (!remarks) {
        throw { code: 400, message: "Remark is required" };
      }
      const website = await Website.findOne({ _id: id }).exec();
      if (!website) {
        return res.status(404).send({ message: "Websitet not found" });
      }
      if (website.balance < Number(amount)) {
        return res.status(400).send({ message: "Insufficient Balance " });
      };
      const websiteTransaction = new WebsiteTransaction({
        websiteId: website._id,
        websiteName: website.websiteName,
        transactionType: transactionType,
        withdrawAmount: amount,
        subAdminId: userName.userName,
        subAdminName: userName.firstname,
        remarks: remarks,
        createdAt: new Date(),
      });
      await websiteTransaction.save();
      res.status(200).send({ message: "Wallet Balance Deducted from your Website" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.get("/api/admin/website-name", Authorize(["superAdmin", "Dashboard-View", "Transaction-View", "Transaction-Edit-Request", "Transaction-Delete-Request"]), async (req, res) => {
    try {
      const websiteName = await Website.find({}, "websiteName").exec();
      res.status(200).send(websiteName);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.get("/api/admin/website-account-summary/:websiteName", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const websiteName = req.params.websiteName;
      const websiteSummary = await WebsiteTransaction.find({ websiteName }).exec();
      res.status(200).send(websiteSummary);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.get("/api/admin/user-website-account-summary/:websiteName", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const websiteName = req.params.websiteName;
      const transaction = await Transaction.findOne({ websiteName }).exec();
      console.log("transaction", transaction);
      if (!transaction) {
        return res.status(404).send({ message: "Website Name not found" });
      }
      const userId = transaction.userName;
      if (!userId) {
        return res.status(404).send({ message: "User Id not found" });
      }
      const accountSummary = await Transaction.find({ websiteName, userId }).exec();
      res.status(200).send(accountSummary);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.post("/api/admin/manual-user-website-account-summary/:websiteName", Authorize(["superAdmin", "Bank-View", "Transaction-View", "Website-View"]),
    async (req, res) => {
      try {
        const websiteName = req.params.websiteName;
        const {page,itemsPerPage} = req.query;
        const {
          transactionType,
          introducerList,
          subAdminList,
          websiteList,
          sdate,
          edate,
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
        if (websiteList) {
          filter.websiteName = websiteList;
        }
        const startDate = sdate ? new Date(sdate).toISOString() : null;
        const endDate = edate ? new Date(edate).toISOString() : null;
  
        if (startDate && endDate) {
          filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else if (startDate) {
          filter.createdAt = { $gte: new Date(startDate) };
        } else if (endDate) {
          filter.createdAt = { $lte: new Date(endDate) };
        }
        // const websiteName = req.params.websiteName;
        // const page = req.params.page;
        const transaction = await Transaction.findOne({ websiteName }).exec();
        let balances = 0;
        if (!transaction) {
          const websiteSummary = await WebsiteTransaction.find({ websiteName }).sort({ createdAt: -1 }).exec();
          let websiteData = JSON.parse(JSON.stringify(websiteSummary));
          websiteData.slice(0).reverse().map((data) => {
            if (data.withdrawAmount) {
              balances -= data.withdrawAmount;
              data.balance = balances;
            } else {
              balances += data.depositAmount;
              data.balance = balances;
            }
          });
          if (websiteData.length > 0) {
            res.status(200).send(websiteData);
          } else {
            return res.status(404).send({ message: "Website Name not found" });
          }
        } else {
          const userId = transaction.userName;
          if (!userId) {
            return res.status(404).send({ message: "User Id not found" });
          }
          const accountSummary = await Transaction.find({ websiteName, userId, }).sort({ createdAt: -1 }).exec();
          const websiteSummary = await WebsiteTransaction.find({ websiteName }).sort({ createdAt: -1 }).exec();

          let websiteData = JSON.parse(JSON.stringify(websiteSummary));
          websiteData.slice(0).reverse().map((data) => {
            if (data.withdrawAmount) {
              balances -= data.withdrawAmount;
              data.balance = balances;
            } else {
              balances += data.depositAmount;
              data.balance = balances;
            }
          });
          let accountData = JSON.parse(JSON.stringify(accountSummary));
          accountData.slice(0).reverse().map((data) => {
            if (data.transactionType === "Deposit") {
              const netAmount = balances - data.bonus - data.amount;
              console.log("netAmount", netAmount);
              balances = netAmount;
              data.balance = balances;
            } else {
              let totalamount = 0;
              totalamount += data.amount;
              balances += totalamount;
              data.balance = balances;
            }
          });
          const filteredTrans = [...accountData, ...websiteData].filter((data) => {
            // Your filtering conditions here
            const dataCreatedAt = new Date(data.createdAt);
            return (
              (!filter.transactionType || data.transactionType === filter.transactionType) &&
              (!filter.introducerUserName || data.introducerUserName === filter.introducerUserName) &&
              (!filter.subAdminName || data.subAdminName === filter.subAdminName) &&
              (!filter.bankName || data.bankName === filter.bankName) &&
              (!filter.createdAt ||
                (dataCreatedAt >= new Date(filter.createdAt.$gte) && dataCreatedAt <= new Date(filter.createdAt.$lte)))
        );
          });
    
          const allIntroDataLength = filteredTrans.length;
          let pageNumber = Math.floor(allIntroDataLength / 10 + 1);
          const skip = (page - 1) * itemsPerPage;
          const limit = parseInt(itemsPerPage);
          const paginatedResults = filteredTrans.slice(skip, skip + limit);
    
          if (paginatedResults.length !== 0) {
            console.log('afe')
            return res.status(200).json({ paginatedResults, pageNumber, allIntroDataLength });
          } else {
            console.log('ded',filteredTrans)
            const itemsPerPage = 10; // Specify the number of items per page

            const totalItems = filteredTrans.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
  
            let page = parseInt(req.query.page) || 1; // Get the page number from the request, default to 1 if not provided
            page = Math.min(Math.max(1, page), totalPages); // Ensure page is within valid range
  
            const skip = (page - 1) * itemsPerPage;
            const limit = Math.min(itemsPerPage, totalItems - skip); // Ensure limit doesn't exceed the number of remaining items
            const paginatedResults = filteredTrans.slice(skip, skip + limit);
  
            const pageNumber = page;
            const allIntroDataLength = totalItems;
  
            return res.status(200).json({ paginatedResults, pageNumber, totalPages, allIntroDataLength });
  
          }
      }
      } catch (e) {
        console.error(e);
        res.status(e.code || 500).send({ message: e.message });
      }
    }
  );

  app.get('/api/superadmin/view-website-edit-requests', Authorize(["superAdmin"]), async (req, res) => {
    try {
      const resultArray = await EditWebsiteRequest.find().exec();
      res.status(200).send(resultArray);
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server error");
    }
  });
};

export default WebisteRoutes;
