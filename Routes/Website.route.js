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
      const id = await Website.find({ websiteName });
      id.map((data) => {
        console.log(data.websiteName)
        if (newWebsiteName.websiteName.toLocaleLowerCase() === data.websiteName.toLocaleLowerCase()) {
          throw { code: 400, message: "Website name exists already!" };
        }
      })
      await newWebsiteName.save();
      res.status(200).send({ message: "Website name sent for approval!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  }
  );

  app.post("/api/approve-website/:id", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const { isApproved, subAdmins } = req.body;
      const bankId = req.params.id;
      const approvedWebisteRequest = await WebsiteRequest.findById(bankId);

      if (!approvedWebisteRequest) {
        throw { code: 404, message: "Website not found in the approval requests!" };
      }

      if (isApproved) { // Check if isApproved is true
        const approvedWebsite = new Website({
          websiteName: approvedWebisteRequest.websiteName,
          subAdminId: approvedWebisteRequest.subAdminId,
          subAdmins: subAdmins, // Assign the subAdmins array
          subAdminName: approvedWebisteRequest.subAdminName,
          isActive: true,
        });

        await approvedWebsite.save();

        await WebsiteRequest.deleteOne({ _id: approvedWebisteRequest._id });
      } else {
        throw { code: 400, message: "Website approval was not granted." };
      }

      res.status(200).send({ message: "Website approved successfully & Subadmin Assigned" });
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

  app.delete("/api/reject/:id", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const id = req.params.id;
      const result = await WebsiteRequest.deleteOne({ _id: id });
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


  app.delete("/api/reject-website-edit/:id", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const id = req.params.id;
      const result = await EditWebsiteRequest.deleteOne({ _id: id });
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

  app.post("/api/improve-website/:id", Authorize(["superAdmin"]), async (req, res) => {
    try {
      // console.log('req',subAdminId)
      const { subAdmins } = req.body;
      console.log('first', subAdmins)
      const bankId = req.params.id;

      const approvedBankRequest = await Website.findById(bankId);
      console.log('first', approvedBankRequest)
      if (!approvedBankRequest) {
        throw { code: 404, message: "website not found in the approval requests!" };
      }


      const approvedWebsite = new Website({
        websiteName: approvedBankRequest.websiteName,
        subAdmins: subAdmins,
        isActive: true,
      });
      await approvedWebsite.save();
      // await BankRequest.deleteOne({ _id: approvedBankRequest._id });
      res.status(200).send({ message: "Website Name approved successfully & Subadmin Assigned" });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal Server Error" });
    }
  });

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

  app.get(
    "/api/get-activeWebsite-name",
    Authorize(["superAdmin", "Bank-View", "Transaction-View", "Create-Transaction", "Create-Deposit-Transaction", "Create-Withdraw-Transaction"]),
    async (req, res) => {

      try {
        let dbBankData = await Website.find({isActive: true}).select('websiteName isActive').exec();
        return res.status(200).send(dbBankData);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  
  app.get(
    "/api/get-website-name",
    Authorize([
      "superAdmin",
      "Bank-View",
      "Transaction-View",
      "Create-Transaction",
      "Create-Deposit-Transaction",
      "Create-Withdraw-Transaction"
    ]),
    async (req, res) => {
      const { page, itemsPerPage } = req.query;

      try {
        let dbBankData = await Website.find().exec();
        let websiteData = JSON.parse(JSON.stringify(dbBankData));

        const userRole = req.user.roles;
        if (userRole.includes('superAdmin')) {
          for (var index = 0; index < websiteData.length; index++) {
            websiteData[index].balance = await AccountServices.getWebsiteBalance(
              websiteData[index]._id
            );
          }
        } else {
          // For subAdmins, filter banks based on user permissions
          const userSubAdminId = req.user.userName;

          // Update each bank individually
          websiteData = websiteData.map(async website => {
            const userSubAdmin = website.subAdmins.find(subAdmin => subAdmin.subAdminId === userSubAdminId);

            if (userSubAdmin) {
              // Update balance for the specific bank
              website.balance = await AccountServices.getWebsiteBalance(website._id);
              // Set permissions for the specific bank
              website.isDeposit = userSubAdmin.isDeposit;
              website.isWithdraw = userSubAdmin.isWithdraw;
              website.isRenew = userSubAdmin.isRenew;
              website.isEdit = userSubAdmin.isEdit;
              website.isDelete = userSubAdmin.isDelete;

              return website; // Include this bank in the result
            } else {
              return null; // Exclude this bank from the result
            }
          });

          // Filter out null values (banks not authorized for the subAdmin)
          websiteData = (await Promise.all(websiteData)).filter(website => website !== null);
        }

        // Now, sort the filtered bankData array
        websiteData.sort((a, b) => b.createdAt - a.createdAt);

        return res.status(200).send(websiteData);
      } catch (e) {
        console.error(e);
        res.status(e.code).send({ message: e.message });
      }
    }
  );

  app.delete("/api/website/delete-subadmin/:websiteId/:subAdminId", Authorize(["superAdmin", "RequstAdmin", "Bank-View"]), async (req, res) => {
    try {
      const { websiteId, subAdminId } = req.params;

      const website = await Website.findById(websiteId);
      if (!website) {
        throw { code: 404, message: "website not found!" };
      }

      // Remove the subAdmin with the specified subAdminId
      website.subAdmins = website.subAdmins.filter(sa => sa.subAdminId !== subAdminId);

      await website.save();

      res.status(200).send({ message: "SubAdmin removed successfully" });
    } catch (error) {
      res.status(error.code || 500).send({ message: error.message || "An error occurred" });
    }
  });

  


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

  app.post("/api/admin/manual-user-website-account-summary/:websiteId", Authorize(["superAdmin", "Bank-View", "Transaction-View", "Website-View"]),
    async (req, res) => {
      try {
        const websiteId = req.params.websiteId;
        let balances = 0;
        const accountSummary = await Transaction.find({ websiteId }).sort({ createdAt: -1 }).exec();
        const websiteSummary = await WebsiteTransaction.find({ websiteId }).sort({ createdAt: -1 }).exec();
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
      const websiteId = req.params.websiteId;
      const { isActive } = req.body;
      if (typeof isActive !== "boolean") {
        return res.status(400).send({ message: "isApproved field must be a boolean value" });
      }
      const website = await Website.findById(websiteId);
      console.log('website', website)
      if (!website) {
        return res.status(404).send({ message: "Website not found" });
      }

      website.isActive = isActive;
      await website.save();
      res.status(200).send({ message: "Bank status updated successfully" });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
  });

  // app.post("/api/admin/website/assign-subadmin/:websiteId", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
  //   try {
  //     const websiteId = req.params.bankId;
  //     const { subAdminId } = req.body;

  //     // First, check if the bank with the given ID exists
  //     const website = await Website.findById(websiteId);
  //     if (!website) {
  //       return res.status(404).send({ message: "Bank not found" });
  //     }

  //     website.subAdminId.push(subAdminId);
  //     website.isActive = true; // Set isActive to true for the assigned subadmin
  //     await website.save();

  //     res.status(200).send({ message: "Subadmin assigned successfully" });
  //   } catch (e) {
  //     console.error(e);
  //     res.status(e.code || 500).send({ message: e.message || "Internal server error" });
  //   }
  // });

  app.get("/api/admin/website/view-subadmin/:subadminId", Authorize(["superAdmin", "RequestAdmin"]), async (req, res) => {
    try {
      const subadminId = req.params.subadminId;
      // console.log('subadminId', subadminId)

      let dbWebsiteData = await Website.find({ 'subAdmins.subAdminId': subadminId }).exec();
      console.log('dweb', dbWebsiteData)
      let webisteData = JSON.parse(JSON.stringify(dbWebsiteData));

      for (var index = 0; index < webisteData.length; index++) {
        webisteData[index].balance = await AccountServices.getWebsiteBalance(
          webisteData[index]._id
        );
      }

      webisteData = webisteData.filter(website => website.isActive === true);
      console.log('bankdata', webisteData)

      if (webisteData.length === 0) {
        return res.status(404).send({ message: "No bank found" });
      }

      res.status(200).send(webisteData);

    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
  });



  app.put(
    "/api/website/edit-request/:id",
    Authorize(["superAdmin", "RequstAdmin", "website-view"]),
    async (req, res) => {
      try {
        const { subAdmins } = req.body;
        const bankId = req.params.id;

        const approvedBankRequest = await Website.findById(bankId);

        if (!approvedBankRequest) {
          throw { code: 404, message: "Bank not found!" };
        }

        for (const subAdminData of subAdmins) {
          const {
            subAdminId,
            isDeposit,
            isWithdraw,
            isDelete,
            isRenew,
            isEdit,
          } = subAdminData;
          const subAdmin = approvedBankRequest.subAdmins.find(
            (sa) => sa.subAdminId === subAdminId
          );

          if (subAdmin) {
            // If subAdmin exists, update its properties
            subAdmin.isDeposit = isDeposit;
            subAdmin.isWithdraw = isWithdraw;
            subAdmin.isDelete = isDelete;
            subAdmin.isRenew = isRenew;
            subAdmin.isEdit = isEdit;
          } else {
            // If subAdmin doesn't exist, add a new one
            approvedBankRequest.subAdmins.push({
              subAdminId,
              isDeposit,
              isWithdraw,
              isDelete,
              isRenew,
              isEdit,
            });
          }
        }

        await approvedBankRequest.save();

        res.status(200).send({ message: "Updated successfully" });
      } catch (error) {
        res
          .status(error.code || 500)
          .send({ message: error.message || "An error occurred" });
      }
    }
  );

};

export default WebisteRoutes;
