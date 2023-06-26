/**
 * @desc this file will define the schema for admin user table
 * @author Alok Kaushik alokkaushik5953@gmail.com
 */

import { Sequelize } from 'sequelize';
import dbObj from '../config/db.config.js';

const AdminUser = dbObj.define(
  'AdminUser',
  {
    adminID: {
      type: Sequelize.INTEGER(11),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    adminEmail: {
      type: Sequelize.STRING(65),
      allowNull: false,
    },
    adminName: {
      type: Sequelize.STRING(65),
      allowNull: false,
    },
    adminPassword: {
      type: Sequelize.STRING(65),
      allowNull: false,
    },
  },
  { timestamps: false, freezeTableName: true, tableName: 'admin_user' }
);

export default AdminUser;
