import authenticateToken from '../middleware/AuthenticateToken.js';
import TransactionServices from '../services/Transaction.services.js';

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
        await TransactionServices.depositTransaction(req, res);
      } catch (error) {
        res.status(500).json({ status: false, message: error });
      }
    }
  );
};

export default TransactionRoutes;
