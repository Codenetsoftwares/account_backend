/**
 * @desc this file will define the schema for deposit user table
 * @author Alok Kaushik alokkaushik5953@gmail.com
 */
import Sequelize from 'sequelize';
import dbObj from '../config/db.config.js';

const DepositUser = dbObj.define(
  'DepositUser',
  {
    userID: {
      type: Sequelize.INTEGER(11),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    userEmail: {
      type: Sequelize.STRING(65),
      allowNull: false,
    },
    userName: {
      type: Sequelize.STRING(65),
      allowNull: false,
    },
    userPassword: {
      type: Sequelize.STRING(65),
      allowNull: false,
    },
  },
  { timestamps: false, freezeTableName: true, tableName: 'deposit_user' }
);

export default DepositUser;
