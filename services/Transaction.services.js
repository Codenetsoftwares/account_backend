import { EditRequest } from "../models/EditRequest.model.js";
import { Transaction } from "../models/transaction.js";
import { Bank } from "../models/bank.model.js"
import { Website } from "../models/website.model.js"
import { User } from "../models/user.model.js";

const TransactionService = {
  createTransaction: async (req, res, subAdminName) => {
    try {
      const { transactionID, transactionType, amount, paymentMethod, userId, subAdminId, accountNumber, websiteName, bankName } = req.body;

      const existingTransaction = await Transaction.findOne({ transactionID: transactionID }).exec();
      if (existingTransaction) { return res.status(400).json({ status: false, message: "Transaction already exists" });}

      const wesiteId = await Website.findOne({ name: websiteName }).exec();
      console.log("wesiteId", wesiteId)
      const bankId = await Bank.findOne({ accountNumber:accountNumber }).exec();
      console.log("bankId", bankId)

      if (transactionType === "Deposit") {
        const websiteBalance = wesiteId.walletBalance;
        if (websiteBalance < amount) {
          throw new Error("Insufficient balance");
        }
        const newWebsiteBalance = websiteBalance - amount;
        console.log("newWebsiteBalance", newWebsiteBalance)
        wesiteId.walletBalance = newWebsiteBalance;
        await wesiteId.save();

        const bankBalance = bankId.walletBalance;
        const newBankBalance = parseInt(bankBalance) + parseInt(amount);
        console.log("newBankBalance", newBankBalance)
        bankId.walletBalance = newBankBalance;
        await bankId.save();
      }

      if (transactionType === "Withdraw") {
        const bankBalance = bankId.walletBalance;
        if (bankBalance < amount) {
          throw new Error("Insufficient balance");
        }
        const newbankBalance = bankBalance - amount;
        console.log("newbankBalance", newbankBalance)
        bankId.walletBalance = newbankBalance;
        await bankId.save();

        const websiteBalance = wesiteId.walletBalance;
        const newWebsiteBalance = Number(websiteBalance) + Number(amount);
        console.log("newWebsiteBalance", newWebsiteBalance)
        wesiteId.walletBalance = newWebsiteBalance;
        await wesiteId.save();
      }

      const newTransaction = new Transaction({
          transactionID: transactionID,
          transactionType: transactionType,
          amount: amount,
          paymentMethod: paymentMethod,
          subAdminId: subAdminId,
          subAdminName: subAdminName.firstname,
          userId: userId,
          accountNumber: accountNumber,
          bankName: bankName,
          websiteName: websiteName,
          createdAt: new Date(),
          });


  await newTransaction.save();

  const user = await User.findOne({ userId: userId });

  if (!user) {
    return res
      .status(404)
      .json({ status: false, message: "User not found" });
  }
  user.transactionDetail.push(newTransaction);
  await user.save();

  return res
    .status(200)
    .json({ status: true, message: "Transaction created successfully" });
} catch (e) {
  console.error(e);
  res
    .status(e.code || 500)
    .send({ message: e.message || "Internal server error" });
}
},

  withdrawView: async (req, res) => {
    try {
      const withdraws = await Transaction.find({ transactionType: "Withdraw" })
        .sort({ createdAt: -1 })
        .exec();
      let sum = 0;
      for (let i = 0; i < withdraws.length; i++) {
        sum = sum + withdraws[i].withdrawAmount;
      }
      res.send({ totalWithdraws: sum, withdraws: withdraws });
    } catch (error) {
      return res.status(500).json({ status: false, message: error });
    }
  },

  depositView: async (req, res) => {
    try {
      const deposits = await Transaction.find({ transactionType: "Deposit" })
        .sort({ createdAt: -1 })
        .exec();
      let sum = 0;
      for (let i = 0; i < deposits.length; i++) {
        sum = sum + deposits[i].depositAmount;
      }
      res.send({ totalDeposits: sum, deposits: deposits });
    } catch (error) {
      return res.status(500).json({ status: false, message: error });
    }
  },

  update: async (trans, data) => {
    if (
      !data.transactionID ||
      !data.transactionType ||
      !data.amount ||
      !data.paymentMethod ||
      !data.userId ||
      !data.bankName ||
      !data.websiteName
    ) {
      throw {
        code: 400,
        message:
          "Missing required fields. Please provide values for all fields.",
      };
    }
    const existingTransaction = await Transaction.findById(trans);
    if (!existingTransaction) {
      throw {
        code: 404,
        message: `Transaction not found with id: ${trans}`,
      };
    }
    const updatedTransactionData = {
      id: trans._id,
      transactionID: data.transactionID,
      transactionType: data.transactionType,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      userId: data.userId,
      subAdminId: data.subAdminId,
      bankName: data.bankName,
      websiteName: data.websiteName,
    };
    const backupTransaction = new EditRequest({
      ...updatedTransactionData,
      isApproved: false,
    });
    await backupTransaction.save();

    return true;
  },
};

export default TransactionService;
