import authenticateToken from '../middleware/AuthenticateToken.js';
import TransactionServices from '../services/Transaction.services.js';
import { Transaction } from '../models/transaction.js';

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
    authenticateToken('admin'),
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
    authenticateToken('withdraw'),
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
    authenticateToken('deposit'),
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
    authenticateToken('admin'),
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
    authenticateToken('admin'),
    async (req, res) => {
      try {
        await TransactionServices.withdrawView(req, res);
      } catch (error) {
        res.status(500).json({ status: false, message: error });
      }
    }
  );

  app.post("/api/deposit/filter-dates", authenticateToken("admin"), async (req, res) => {
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

  app.post("/api/withdraw/filter-dates", authenticateToken("admin"), async (req, res) => {
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
      res.status(e.code || 500).send({ message: e.message || "Internal server error" });
    }
  });

  app.post("/api/admin/edit-transaction/:id", authenticateToken("admin"), async (req, res) => {
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

};

export default TransactionRoutes;
