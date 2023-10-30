import AccountServices from "../services/Accounts.services.js";
import { Authorize } from "../middleware/Authorize.js";
import { Website } from "../models/website.model.js";
import { WebsiteTransaction } from "../models/WebsiteTransaction.model.js";
import { Transaction } from "../models/transaction.js";
import lodash from "lodash";
import { EditWebsiteRequest } from "../models/EditWebsiteRequest.model.js";
import { WebsiteRequest } from "../models/WebsiteRequest.model.js"

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
      const newWebsiteName = new WebsiteRequest({
        websiteName: websiteName,
        subAdminId: userName.userName,
        subAdminName: userName.firstname,
        isApproved: false,
        isActive: false
      });
      console.log("newWebsiteName", newWebsiteName)
      const id = await WebsiteRequest.find(req.params.id);
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

  app.post("/api/approve-website/:id", Authorize(["superAdmin"]), async (req, res) => {
    try {
        const { isApproved } = req.body;
        const bankId = req.params.id;
        const approvedWebisteRequest = await WebsiteRequest.findById(bankId);
        
        if (!approvedBankRequest) {
            throw { code: 404, message: "Website not found in the approval requests!" };
        }
        
        if (isApproved) { // Check if isApproved is true
            const approvedWebsite = new Website({
              websiteName: approvedWebisteRequest.websiteName,
              subAdminId: approvedWebisteRequest.subAdminId,
              subAdminName: approvedWebisteRequest.subAdminName,
              isActive: false,
            });
            
            // Save the approved Website details
            await approvedWebsite.save();
            
            // Delete the Website details from WebisteRequest
            await WebsiteRequest.deleteOne({ _id: approvedWebisteRequest._id });
        } else {
            throw { code: 400, message: "Website approval was not granted." };
        }
        
        res.status(200).send({ message: "Website approved successfully!" });
    } catch (e) {
        console.error(e);
        res.status(e.code || 500).send({ message: e.message || "Internal Server Error" });
    }
});

app.get(
  "/api/superadmin/view-website-requests",
  Authorize(["superAdmin"]),
  async (req, res) => {
    try {
      const resultArray = await WebsiteRequest.find().exec();
      res.status(200).send(resultArray);
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server error");
    }
  }
);

app.delete("/api/website/reject/:id", Authorize(["superAdmin"]), async (req, res) => {
  try {
    const id = req.params.id;
    const result = await WebsiteRequest.deleteOne({ _id: id });
    console.log("result", result);
    if (result.deletedCount === 1) {
      res.status(200).send({ message: "Data deleted successfully" });
    } else {
      res.status(404).send({ message: "Data not found" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: e.message });
  }
});


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

  app.get("/api/get-website-name", Authorize(["superAdmin", "Dashboard-View", "Transaction-View", "Transaction-Edit-Request", "Transaction-Delete-Request", "Create-Transaction", "Create-Deposit-Transaction", "Create-Withdraw-Transaction", "Website-View",
    "Profile-View", "Bank-View"]),
    async (req, res) => {
      try {
        const dbWebiteData = await Website.find({}).exec();
        let websiteData = JSON.parse(JSON.stringify(dbWebiteData));
        for (var index = 0; index < websiteData.length; index++) {
          websiteData[index].balance = await AccountServices.getWebsiteBalance(websiteData[index]._id);
        }
        websiteData = websiteData.filter(website => website.isActive === true);
        if(websiteData.length === 0){
          return res.status(404).send({ message: 'No Website Active' });
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
      if ((await AccountServices.getWebsiteBalance(id)) < Number(amount)) {
        return res.status(400).send({ message: "Insufficient Balance" });
      }
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
        let balances = 0;
          const accountSummary = await Transaction.find({ websiteName }).sort({ createdAt: -1 }).exec();
          const websiteSummary = await WebsiteTransaction.find({ websiteName }).sort({ createdAt: -1 }).exec();
          const allTransactions = [...accountSummary, ...websiteSummary]
          allTransactions.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB - dateA;
          });
          let allData = JSON.parse(JSON.stringify(allTransactions));
          allData.slice(0).reverse().map((data) => {
            if (data.transactionType === "Manual-Website-Deposit") {
              balances += data.depositAmount;
              data.balance = balances;
            }
            if (data.transactionType === "Manual-Website-Withdraw") {
              balances -= data.withdrawAmount;
              data.balance = balances;
            }
            if (data.transactionType === "Deposit") {
              const netAmount = balances - data.bonus - data.amount;
              balances = netAmount;
              data.balance = balances;
            }
            if (data.transactionType === "Withdraw") {
              let totalamount = 0;
              totalamount += data.amount;
              balances += totalamount;
              data.balance = balances;
            }
          });
          return res.status(200).send(allData);
        
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

  app.post("/api/admin/website/isactive/:websiteId", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      // console.log('req', req.params.bankId)
      const websiteId = req.params.bankId;
      const { isActive } = req.body;
      if (typeof isActive !== "boolean") {
        return res.status(400).send({ message: "isApproved field must be a boolean value" });
      }
      const website = await Website.findById(websiteId);
      if (!website) {
        return res.status(404).send({ message: "Bank not found" });
      }
      // Check if the user has permission to access this bank based on their role
      // You can implement your own logic here, including checking the subAdminId if needed

      // Update the isActive field
      website.isActive = isActive;

      await website.save();

      res.status(200).send({ message: "Bank status updated successfully" });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
  });

  app.post("/api/admin/website/assign-subadmin/:websiteId", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      const websiteId = req.params.bankId;
      const { subAdminId } = req.body;

      // First, check if the bank with the given ID exists
      const website = await Website.findById(websiteId);
      if (!website) {
        return res.status(404).send({ message: "Bank not found" });
      }

      website.subAdminId.push(subAdminId);
      website.isActive = true; // Set isActive to true for the assigned subadmin
      await website.save();

      res.status(200).send({ message: "Subadmin assigned successfully" });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
  });

  app.get("/api/admin/website/view-subadmin/:subadminId", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      const subadminId = req.params.subadminId;
      // console.log('subadminId', subadminId)
      let ans = []
      const accessSubadmin = userHasAccessToSubAdmin(req.user, subadminId)
      if (!accessSubadmin) {
        return res.status(403).send({ message: "You don't have access to view data for this subadmin" });
      }

      let dbWebsiteData = await Website.find().exec();
      let webisteData = JSON.parse(JSON.stringify(dbWebsiteData));

      for (var index = 0; index < webisteData.length; index++) {
        webisteData[index].balance = await AccountServices.getWebsiteBalance(
          webisteData[index]._id
        );
      }

      webisteData = webisteData.filter(bank => bank.isActive === true);
      webisteData.map((data) => {
        if (data.subAdminId) {
          for (let i = 0; i < data.subAdminId.length; i++) {
            if (data.subAdminId[i] === subadminId) {
              ans.push(data)
            }
          }
        }
      })

      if (ans.length === 0) {
        return res.status(404).send({ message: "No website found" });
      }

      console.log('bankd', ans)

      res.status(200).send(ans);

    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
  });

  function userHasAccessToSubAdmin(user, subAdminId) {
    if (user.roles.includes("superAdmin")) {

      return true;
    } else if (user.roles.includes("RequestAdmin")) {
      const authorizedSubadmins = getAuthorizedSubadminsForRequestAdmin(user);
      return authorizedSubadmins.includes(subAdminId);
    }

    return false;
  }

  async function getAuthorizedSubadminsForRequestAdmin(user) {

    try {
      let dbBankData = await Bank.find().exec();

      dbBankData = dbBankData.filter(bank => bank.isActive === true);
      console.log('bankd', dbBankData)

      res.status(200).send(dbBankData.subAdminId);
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }

};

export default WebisteRoutes;
