/**
 * @desc this file will define the schema for deposit user table
 * @author Alok Kaushik alokkaushik5953@gmail.com
 */
import Sequelize from 'sequelize';
import dbObj from '../config/db.config.js';

const Transaction = dbObj.define(
  'Transaction',
  {
    transactionID: {
      type: Sequelize.STRING(65),
      allowNull: false,
    },
    transactionType: {
      type: Sequelize.STRING(65),
      allowNull: true,
    },
    withdrawAmount: {
      type: Sequelize.INTEGER(11),
      allowNull: true,
    },
    depositAmount: {
      type: Sequelize.INTEGER(11),
      allowNull: true,
    },
    status: {
      type: Sequelize.STRING(65),
      allowNull: true,
    },
  },
  { timestamps: true, freezeTableName: true, tableName: 'transaction' }
);

export default Transaction;
