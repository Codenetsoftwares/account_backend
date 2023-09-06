import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { User } from "../models/user.model.js";
import { IntroducerUser } from "../models/introducer.model.js"

import dotenv from "dotenv";
dotenv.config();

export const introducerUser = {

  createintroducerUser: async (data) => {
    const existingUser = await IntroducerUser.findOne({ email: data.email }).exec();
    if (existingUser) {
      throw { code: 409, message: `User already exists: ${data.email}` };
    }

    const passwordSalt = await bcrypt.genSalt();
    const encryptedPassword = await bcrypt.hash(data.password, passwordSalt);

    if (!data.firstname) {
      throw { code: 400, message: "Firstname is required" };
    }
    if (!data.lastname) {
      throw { code: 400, message: "Lastname is required" };
    }
    if (!data.userName) {
      throw { code: 400, message: "User Name is required" };
    }
    if (!data.password) {
      throw { code: 400, message: "Password is required" };
    }
    const newIntroducerUser = new IntroducerUser({
      firstname: data.firstname,
      lastname: data.lastname,
      userName: data.userName,
      password: encryptedPassword,
      role: data.role,
      introducerId: data.introducerId
    });

    newIntroducerUser.save().catch((err) => {
      console.error(err);
      throw { code: 500, message: "Failed to Save New Introducer User" };
    });

    return true;
  },


  findIntroducerUserById: async (id) => {
    if (!id) {
      throw { code: 409, message: "Required parameter: id" };
    }

    return IntroducerUser.findById(id).exec();
  },

  findIntroducerUser: async (filter) => {
    if (!filter) {
      throw { code: 409, message: "Required parameter: filter" };
    }
    return IntroducerUser.findOne(filter).exec();
  },

  generateIntroducerAccessToken: async (userName, password, persist) => {
    if (!userName) {
      throw { code: 400, message: "Invalid value for: User Name" };
    }
    if (!password) {
      throw { code: 400, message: "Invalid value for: password" };
    }

    const existingUser = await introducerUser.findIntroducerUser({ userName: userName });
    if (!existingUser) {
      throw { code: 401, message: "Invalid User Name or password" };
    }

    const passwordValid = await bcrypt.compare(password, existingUser.password);
    if (!passwordValid) {
      throw { code: 401, message: "Invalid User Name or password" };
    }

    const accessTokenResponse = {
      id: existingUser._id,
      name: existingUser.firstname,
      userName: existingUser.userName,
      role: existingUser.role
    };
    console.log(accessTokenResponse);
    const accessToken = jwt.sign(
      accessTokenResponse,
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: persist ? "1y" : "8h",
      }
    );

    return {
      userName: existingUser.userName,
      accessToken: accessToken,
    };
  },

  introducerPercentageCut: async (id, startDate, endDate) => {
    try {
      const user = await User.findOne({ id }).exec();
      const userName = user.userName;
      const userId = user.userId;
      const introducerUserId = user.introducersUserId;
      console.log("introducerUserId", introducerUserId);

      const introducerId = await IntroducerUser.findOne({ id: introducerUserId }).exec();
      console.log("introducerUser", introducerId);
      const introducerid = introducerId.introducerId;
      console.log("introducerid", introducerid)

      const introducerpercent = introducerId.introducerPercentage;

      const transDetails = user.transactionDetail;

      const selectedStartDate = new Date(startDate);
      const selectedEndDate = new Date(endDate);

      const transactionsWithin7Days = transDetails.filter(transaction => {
        const transDate = new Date(transaction.createdAt);
        return transDate >= selectedStartDate && transDate <= selectedEndDate;
      });


      let totalDep = 0;
      let totalWith = 0;

      transactionsWithin7Days.map((res) => {
        if (res.transactionType === "Deposit") {
          totalDep += Number(res.amount)
        }
        if (res.transactionType === "Withdraw") {
          totalWith += Number(res.amount)
        }
      })

      if (totalDep <= totalWith) {
        throw { message: "Can't send amount to Introducer" }
      }
      const date = new Date();
      let amount= 0;
      const transactionType = "Credit"
      if (totalDep > totalWith) {
        let diff = totalDep - totalWith;
        amount = ((introducerpercent / 100) * diff)
        introducerId.wallet += amount;
      }
      introducerId.creditTransaction.push({date,transactionType,amount,userId,userName});
      introducerId.save();

    } catch (error) {
      console.error(error);
    }
  },

  
  updateIntroducerProfile: async(id, data) => {
    const existingUser = await IntroducerUser.findById(id);
    if (!existingUser) { throw { code: 404, message: `Existing Introducer User not found with id : ${id}`, };}
        
    existingUser.firstname = data.firstname || existingUser.firstname;
    existingUser.lastname = data.lastname || existingUser.lastname;
    existingUser.userName = data.userName || existingUser.userName;
    existingUser.bankDetail = data.bankDetail || existingUser.bankDetail;
    existingUser.upiDetail = data.upiDetail || existingUser.upiDetail;
    existingUser.introducerId = data.introducerId || existingUser.introducerId;
    existingUser.webSiteDetail = data.webSiteDetail || existingUser.webSiteDetail;

    existingUser.save().catch((err) => {
      console.error(err);
      throw {
        code: 500,
        message: `Failed to update Introducer User Profile with id : ${id}`,
      };
    });
  
    return true;
  },

  introducerLiveBalance : async (id) => {
    try {
      const user = await User.findOne({ id }).exec();
      const introducerUserId = user.introducersUserId;
      console.log("introducerUserId", introducerUserId);

      const introducerId = await IntroducerUser.findOne({ id: introducerUserId }).exec();
      console.log("introducerUser", introducerId);
      const introducerid = introducerId.introducerId;
      console.log("introducerid", introducerid)

      const introducerpercent = introducerId.introducerPercentage;

      const transDetails = user.transactionDetail;
      console.log("transDetails", transDetails)
      let totalDep = 0;
      let totalWith = 0;

      transDetails.map((res) => {
        console.log("res", res)
        if (res.transactionType === "Deposit") {
          totalDep += Number(res.amount)
        }
        if (res.transactionType === "Withdraw") {
          totalWith += Number(res.amount)
        }
      })
    
      console.log("totalDep", totalDep)
      console.log("totalWith", totalWith)
      let amount= 0;
      if (totalDep > totalWith) {
        let diff = totalDep - totalWith;
        amount = ((introducerpercent / 100) * diff)
        introducerId.wallet += amount;
        return amount;
      } else {
        let diff = totalDep - totalWith;
        console.log("diff", diff)
        amount = ((introducerpercent / 100) * diff)
        console.log("amount", amount)
        introducerId.wallet += amount;
        return amount;
      }
      

    } catch (error) {
      console.error(error);
    }
  },

};
