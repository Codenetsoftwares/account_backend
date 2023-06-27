import authenticateToken from '../middleware/AuthenticateToken.js';
import TransactionServices from '../services/Transaction.services.js';

const TransactionRoutes = (app) => {
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
