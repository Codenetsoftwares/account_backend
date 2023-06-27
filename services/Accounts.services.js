import { generatePassword } from '../helpers/encryptPassword.js';
import { generateTokens } from '../helpers/generateToken.js';
import { Admin } from '../models/admin_user.js';
import { DepositUser } from '../models/deposit_user.js';
import bcrypt from 'bcrypt';
import { WithdrawUser } from '../models/withdraw_user.js';

const AccountServices = {
  adminLogin: async (req, res) => {
    try {
      const email = req.body.email;
      const password = req.body.password;
      const persist = req.body.persist;
      let data;
      data = await Admin.find({ adminEmail: email }).exec();
      if (data) {
        const checkPassword = await bcrypt.compare(password, data[0].adminPassword);
        if (checkPassword) {
          const token = await generateTokens({
            email: data.adminEmail,
            username: data.adminName,
            role: 'admin',
          });
          return res.send({ status: 200, message: 'success', result: token });
        } else {
          return res.status(404).json({
            status: false,
            message: 'Username or Password is incorrect',
          });
        }
      } else {
        return res.send({
          status: 404,
          message: 'Username or Password is incorrect',
        });
      }
    } catch (error) {
      return res.send({ status: 500, message: error });
    }
  },

  createUser: async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
    const role = req.body.role;
    if (role === 'admin') {
      const data = await Admin.find({ adminEmail: email }).exec();
      if (data.length != 0) {
        res.send({ status: 409, message: 'User already exists.' });
      } else {
        const hassPass = await generatePassword(password);
        await Admin.create({
          adminEmail: email.toLowerCase(),
          adminName: username,
          adminPassword: hassPass,
        })
          .then(() => {
            return res.send({
              status: 200,
              message: 'Admin created successfully',
            });
          })
          .catch((err) => res.send({ status: 500, message: err }));
      }
    } else if (role === 'deposit') {
      const data = await DepositUser.findOne({ adminEmail: email });
      if (data) {
        res.send({ status: 409, message: 'User already exists.' });
      } else {
        const hassPass = await generatePassword(password);
        await DepositUser.create({
          userEmail: email.toLowerCase(),
          userName: username,
          userPassword: hassPass,
        })
          .then(() => {
            return res.send({
              status: 200,
              message: 'Depositor created successfully',
            });
          })
          .catch((err) => res.send({ status: 500, message: err }));
      }
    } else if (role === 'withdraw') {
      const data = await WithdrawUser.findOne({ adminEmail: email });
      if (data) {
        res.send({ status: 409, message: 'User already exists.' });
      } else {
        const hassPass = await generatePassword(password);
        await WithdrawUser.create({
          userEmail: email.toLowerCase(),
          userName: username,
          userPassword: hassPass,
        })
          .then(() => {
            return res.send({
              status: 200,
              message: 'Withdraw user saved successfully',
            });
          })
          .catch((err) => res.send({ status: 500, message: err }));
      }
    } else {
      res.send({ status: 500, message: 'Invalid role' });
    }
  },

  depositLogin: async (req, res) => {
    try {
      const email = req.body.email;
      const password = req.body.password;
      const persist = req.body.persist;
      let data;
      data = await DepositUser.findOne({ adminEmail: email });
      if (data) {
        const matchResult = await bcrypt.compare(password, data.userPassword);
        if (matchResult) {
          const accessToken = generateTokens({
            id: data.userID,
            email: data.userEmail,
            username: data.userName,
            role: 'deposit',
          });
          return res.send({
            status: 200,
            message: 'success',
            result: accessToken,
          });
        } else {
          res
            .status(404)
            .json({ message: 'Invalid Username or Password', status: true });
        }
      } else {
        return res.send({
          status: 404,
          message: 'Username or Password is incorrect',
        });
      }
    } catch (error) {
      return res.send({ status: 500, message: error });
    }
  },

  withdrawLogin: async (req, res) => {
    try {
      const email = req.body.email;
      const password = req.body.password;
      const persist = req.body.persist;

      let data;
      data = await WithdrawUser.findOne({ adminEmail: email });

      if (data) {
        const matchResult = await bcrypt.compare(password, data.userPassword);
        if (matchResult) {
          const token = generateTokens({
            id: data.userID,
            email: data.userEmail,
            username: data.userName,
            role: 'withdraw',
          });
          return res.send({ status: 200, message: 'success', result: token });
        }
      } else {
        return res.send({
          status: 404,
          message: 'Username or Password is incorrect',
        });
      }
    } catch (error) {
      return res.send({ status: 500, message: error });
    }
  },
};

export default AccountServices;
