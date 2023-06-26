import Transaction from '../models/transaction.js';

const TransactionService = {
  adminTransaction: async (req, res) => {
    try {
      const data = await Transaction.findAll();
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
      await Transaction.create({
        transactionID: transactionID,
        transactionType: transactionType,
        depositAmount: depositAmount,
        status: status,
      })
        .then(() =>
          res.status(200).json({ message: 'Transaction saved successfully.' })
        )
        .catch((error) =>
          res.status(500).json({ status: false, message: error })
        );
    } catch (error) {
      return res.status(500).json({ status: false, message: error });
    }
  },
  withdrawTranscation: async (req, res) => {
    try {
      const { transactionID, transactionType, withdrawAmount, status } =
        req.body;
      await Transaction.create({
        transactionID: transactionID,
        transactionType: transactionType,
        withdrawAmount: withdrawAmount,
        status: status,
      })
        .then(() =>
          res.status(200).json({ message: 'Transaction saved successfully.' })
        )
        .catch((error) =>
          res.status(500).json({ status: false, message: error })
        );
    } catch (error) {
      return res.status(500).json({ status: false, message: error });
    }
  },
};

export default TransactionService;
