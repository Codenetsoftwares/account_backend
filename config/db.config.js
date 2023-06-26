//! @desc Connect to the database and define the status
// @author Alok Kaushik alokkaushik5953@gmail.com
// db.config.js

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const dbObj = new Sequelize(
  process.env.DB_DBNAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

dbObj
  .authenticate()
  .then(() => {
    console.log(
      'Database connection has been established successfully with ' +
        process.env.DB_DBNAME
    );
  })
  .catch((err) => console.log(err));

export default dbObj;
