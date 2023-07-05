import { Transaction } from '../models/transaction.js';

const TransactionService = {
  adminTransaction: async (req, res) => {
    try {
      const data = await Transaction.find();
      if (data) {
        res.status(200).json({ status: true, result: data });
      } else {
        res.status(404).json({ status: false, message: 'No data found.' });
      }
    } catch (error) {
      res.status(500).json({ status: false, message: error });
    }
  },
  depositTransaction: async (req, res) => {
    try {
      const { transactionID, transactionType, depositAmount, status } =
        req.body;
      const existingTransaction = await Transaction.findOne({ transactionID: transactionID }).exec();
      if (existingTransaction) { throw { code: 400, message: "Transaction already exists" } }
      await Transaction.create({
        transactionID: transactionID,
        transactionType: transactionType,
        depositAmount: depositAmount,
        status: status,
        createdAt:new Date()
      })
        .then(() => {
          return res.send({
            status: 200,
            message: 'Transaction created successfully',
          });
        })
        .catch((err) => res.send({ status: 500, message: err }));
    } catch (error) {
      return res.status(500).json({ status: false, message: error });
    }
  },
  withdrawTranscation: async (req, res) => {
    try {
      const { transactionID, transactionType, withdrawAmount, status } =
        req.body;

      const existingTransaction = await Transaction.findOne({ transactionID: transactionID }).exec();
      if (existingTransaction) { throw { code: 400, message: "Transaction already exists" } }
      await Transaction.create({
        transactionID: transactionID,
        transactionType: transactionType,
        withdrawAmount: withdrawAmount,
        status: status,
        createdAt: new Date()
      })
        .then(() => {
          return res.send({
            status: 200,
            message: 'Transaction created successfully',
          });
        })
        .catch((err) => res.send({ status: 500, message: err }));
    } catch (error) {
      return res.status(500).json({ status: false, message: error });
    }
  },

  depositView: async (req, res) => {
    try {
      const deposits = await Transaction.find({ transactionType: "deposit" }).sort({ createdAt: -1 }).exec();
      let sum = 0;
      for (let i = 0; i < deposits.length; i++) {
        sum = sum + deposits[i].depositAmount;
      }
      res.send({ totalDeposits: sum, deposits: deposits });
    } catch (error) {
      return res.status(500).json({ status: false, message: error });
    }
  },

  withdrawView: async (req, res) => {
    try {
      const withdraws = await Transaction.find({ transactionType: "withdraw" }).sort({ createdAt: -1 }).exec();
      let sum = 0;
      for (let i = 0; i < withdraws.length; i++) {
        sum = sum + withdraws[i].withdrawAmount;
      }
      res.send({ totalWithdraws: sum, withdraws: withdraws });
    } catch (error) {
      return res.status(500).json({ status: false, message: error });
    }
  }
};

export default TransactionService;
