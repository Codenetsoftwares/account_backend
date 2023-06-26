/**
 * @desc this file will define the schema for admin user table
 * @author Alok Kaushik alokkaushik5953@gmail.com
 */

import Sequelize from 'sequelize';
import dbObj from '../config/db.config.js';

const WithdrawUser = dbObj.define(
  'WithdrawUser',
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
  { timestamps: false, freezeTableName: true, tableName: 'withdraw_user' }
);

export default WithdrawUser;
