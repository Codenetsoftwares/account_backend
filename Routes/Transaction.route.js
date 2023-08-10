import { Authorize } from '../middleware/Authorize.js';
import TransactionServices from '../services/Transaction.services.js';
import { Transaction } from '../models/transaction.js';
import { EditRequest } from '../models/EditRequest.model.js';

const TransactionRoutes = (app) => {

  /**
   * @swagger
   * /admin/transaction:
   *   get:
   *     tags: [Transaction]
   *     summary: Transaction of the Admin
   *     responses:
   *       200:
   *        description: Transaction Displayed successfully
   *       400:
   *        description: Bad Request
   *       500:
   *        description: Internal Server Error
   */

  app.get(
    '/admin/transaction',
    Authorize(['superAdmin']),
    async (req, res) => {
      try {
        await TransactionServices.adminTransaction(req, res);
      } catch (error) {
        res.status(500).json({ status: false, message: error });
      }
    }
  );

  /**
   * @swagger
   * /withdraw/transaction:
   *   post:
   *     tags: [Transaction]
   *     summary: Entry of Withdrawls
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             properties:
   *              transactionID:
   *                type: string
   *                description: The Transaction ID  of the transaction
   *                example: 45498421246435
   *              transactionType:
   *                type: string
   *                description: The transactionType of the transaction
   *                example: Deposit/withdraw
   *              withdrawAmount:
   *                type: Number
   *                description: The withdrawAmount of the transaction
   *                example: true
   *              status:
   *                type: boolean
   *                description: Status of the transaction
   *                example: true
   *     responses:
   *       200:
   *        description: The user was logged in successfully
   *       400:
   *        description: Bad Request
   *       500:
   *        description: Internal Server Error
   */

  app.post(
    '/withdraw/transaction',
    Authorize(['withdraw']),
    async (req, res) => {
      try {
        await TransactionServices.withdrawTranscation(req, res);
      } catch (error) {
        res.status(500).json({ status: false, message: error });
      }
    }
  );

  /**
  * @swagger
  * /deposit/transaction:
  *   post:
  *     tags: [Transaction]
  *     summary: Entry of Deposit
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             properties:
  *              transactionID:
  *                type: string
  *                description: The Transaction ID  of the transaction
  *                example: 45498421246435
  *              transactionType:
  *                type: string
  *                description: The transactionType of the transaction
  *                example: Deposit/withdraw
  *              withdrawAmount:
  *                type: Number
  *                description: The withdrawAmount of the transaction
  *                example: true
  *              status:
  *                type: boolean
  *                description: Status of the transaction
  *                example: true
  *     responses:
  *       200:
  *        description: The user was logged in successfully
  *       400:
  *        description: Bad Request
  *       500:
  *        description: Internal Server Error
  */

  app.post(
    '/deposit/transaction',
    Authorize(['deposit']),
    async (req, res) => {
      try {
        await TransactionServices.depositTransaction(req, res);
      } catch (error) {
        res.status(500).json({ status: false, message: error });
      }
    }
  );

  /**
   * @swagger
   * /api/deposit/view:
   *   get:
   *     tags: [Transaction]
   *     summary: To view all the Deposit Transaction
   *     responses:
   *       200:
   *        description: Deposit Transaction Displayed successfully
   *       400:
   *        description: Bad Request
   *       500:
   *        description: Internal Server Error
   */

  app.get(
    '/api/deposit/view',
    Authorize(['admin', 'superAdmin']),
    async (req, res) => {
      try {
        await TransactionServices.depositView(req, res);
      } catch (error) {
        res.status(500).json({ status: false, message: error });
      }
    }
  );

  app.get(
    '/api/withdraw/view',
    Authorize(['admin', 'superAdmin']),
    async (req, res) => {
      try {
        await TransactionServices.withdrawView(req, res);
      } catch (error) {
        res.status(500).json({ status: false, message: error });
      }
    }
  );

  app.post("/api/deposit/filter-dates", Authorize(["admin", 'superAdmin']), async (req, res) => {
    try {
      const { startDate, endDate } = req.body;

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);

      const depositView = await Transaction.find({
        transactionType: "deposit",
        createdAt: { $gte: start, $lt: end }
      }).exec();
      let sum = 0;
      for (let i = 0; i < depositView.length; i++) {
        sum = sum + depositView[i].depositAmount;
      }
      res.send({ totalDeposits: sum, depositView: depositView });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
  });

  app.post("/api/withdraw/filter-dates", Authorize(["admin", "superAdmin"]), async (req, res) => {
    try {
      const { startDate, endDate } = req.body;

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);

      const withdrawView = await Transaction.find({
        transactionType: "withdraw",
        createdAt: { $gte: start, $lt: end }
      }).exec();
      let sum = 0;
      for (let i = 0; i < withdrawView.length; i++) {
        sum = sum + withdrawView[i].withdrawAmount;
      }
      res.send({ totalWithdraws: sum, withdrawView: withdrawView });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Inte rnal server error" });
    }
  });

  app.post("/api/superAdmin/edit-transaction/:id", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const trans = await Transaction.findById(req.params.id);
      const { amount, id, paymentMethod } = req.body;
      if (amount) {
        trans.transactionType === "withdraw" ? trans.withdrawAmount = amount : trans.depositAmount = amount;
      }
      if (id) {
        trans.transactionID = id;
      }
      if (paymentMethod) {
        trans.paymentMethod = paymentMethod;
      }
      trans.save();
      res.status(200).send({ message: "transaction edited" });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
  });   

  app.post("/api/admin/edit-transaction/:id", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const trans = await Transaction.findById(req.params.id);
      if (!trans) {
        return res.status(404).send({ message: "Transaction not found" });
      }

      const { amount, id, paymentMethod } = req.body;
      let changes = [];

      if (amount) {
        changes.push({
          field: "amount",
          oldValue: trans.transactionType === "withdraw" ? trans.withdrawAmount : trans.depositAmount,
          newValue: amount,
        });
      }

      if (id) {
        changes.push({ field: "id", oldValue: trans.transactionID, newValue: id });
      }

      if (paymentMethod) {
        changes.push({ field: "paymentMethod", oldValue: trans.paymentMethod, newValue: paymentMethod });
      }

      const editRequest = new EditRequest({
        transaction: trans._id,
        changes,
        isApproved: false,
      });

      await editRequest.save();

      res.status(200).send({ message: "edit request submitted for approval" });
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
  });

  

  app.post("/api/admin/approve-edit-request/:requestId", Authorize(["superAdmin"]), async (req, res) => {
    try {
      const editRequest = await EditRequest.findById(req.params.requestId);
      if (!editRequest) {
        return res.status(404).send({ message: "Edit request not found" });
      }

      const { isApproved } = req.body;

      if (typeof isApproved !== "boolean") {
        return res.status(400).send({ message: "isApproved field must be a boolean value" });
      }

      if (!editRequest.isApproved) {
        const transaction = await Transaction.findById(editRequest.transaction);
        if (!transaction) {
          return res.status(404).send({ message: "Transaction not found" });
        }

        for (const change of editRequest.changes) {
          switch (change.field) {
            case "amount":
              if (transaction.transactionType === "withdraw") {
                transaction.withdrawAmount = change.newValue;
              } else if (transaction.transactionType === "deposit") {
                transaction.depositAmount = change.newValue;
              }
              break;
            case "id":
              transaction.transactionID = change.newValue;
              break;
            case "paymentMethod":
              transaction.paymentMethod = change.newValue;
              break;
          }
        }

        await transaction.save();

        editRequest.isApproved = isApproved;
        await editRequest.save();

        return res.status(200).send({ message: "Edit request approved and data updated" });
      } else {
        return res.status(400).send({ message: "Edit request has already been approved" });
      }
    } catch (e) {
      console.error(e);
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
  });

  app.get('/api/superadmin/view-edit-requests', Authorize(["superAdmin"]), async (req, res) => {
    try {
      const resultArray = await EditRequest.find().exec();
      res.status(200).send(resultArray);
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server error");
    }
  });


};

export default TransactionRoutes;
