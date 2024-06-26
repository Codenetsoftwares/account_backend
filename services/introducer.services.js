import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { IntroducerUser } from "../models/introducer.model.js";
import { Admin } from "../models/admin_user.js";
import { IntroducerTransaction } from "../models/IntroducerTransaction.model.js"
import dotenv from "dotenv";
dotenv.config();

export const introducerUser = {
  createintroducerUser: async (data) => {
    if (!data.firstname) {
      throw { code: 400, message: "Firstname is required" };
    }
    if (!data.lastname) {
      throw { code: 400, message: "Lastname is required" };
    }
    if (!data.userName) {
      throw { code: 400, message: "Username is required" };
    }
    if (!data.password) {
      throw { code: 400, message: "Password is required" };
    }

    const existingUser = await IntroducerUser.findOne({ userName: data.userName }).exec();
    const existingOtherUser = await User.findOne({ userName: data.userName });
    const existingAdminUser = await Admin.findOne({ userName: data.userName });

    if (existingUser || existingOtherUser || existingAdminUser) {
      throw { code: 409, message: `User already exists: ${data.userName}` };
    }

    const passwordSalt = await bcrypt.genSalt();
    const encryptedPassword = await bcrypt.hash(data.password, passwordSalt);

    const newIntroducerUser = new IntroducerUser({
      firstname: data.firstname,
      lastname: data.lastname,
      userName: data.userName,
      password: encryptedPassword,
      role: data.role,
    });

    try {
      await newIntroducerUser.save();
      return true;
    } catch (err) {
      console.error(err);
      throw { code: 500, message: "Failed to Save New Introducer User" };
    }
  },


  intorducerPasswordResetCode: async (userName, password) => {
    const existingUser = await introducerUser.findIntroducerUser({ userName: userName });

    const passwordIsDuplicate = await bcrypt.compare(password, existingUser.password);

    if (passwordIsDuplicate) {
      throw {
        code: 409,
        message: "New Password cannot be the same as existing password",
      };
    }

    const passwordSalt = await bcrypt.genSalt();
    const encryptedPassword = await bcrypt.hash(password, passwordSalt);

    existingUser.password = encryptedPassword;
    existingUser.save().catch((err) => {
      console.error(err);
      throw { code: 500, message: "Failed to save new password" };
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

    const existingUser = await introducerUser.findIntroducerUser({
      userName: userName,
    });
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
      role: existingUser.role,
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

      const introducerId = await IntroducerUser.findOne({
        id: introducerUserId,
      }).exec();
      console.log("introducerUser", introducerId);
      const introducerid = introducerId.introducerId;
      console.log("introducerid", introducerid);

      // This is Introducer's User's Percentage
      const introducerpercent = user.introducerPercentage;

      const transDetails = user.transactionDetail;

      const selectedStartDate = new Date(startDate);
      const selectedEndDate = new Date(endDate);

      const transactionsWithin7Days = transDetails.filter((transaction) => {
        const transDate = new Date(transaction.createdAt);
        return transDate >= selectedStartDate && transDate <= selectedEndDate;
      });

      let totalDep = 0;
      let totalWith = 0;

      transactionsWithin7Days.map((res) => {
        if (res.transactionType === "Deposit") {
          totalDep += Number(res.amount);
        }
        if (res.transactionType === "Withdraw") {
          totalWith += Number(res.amount);
        }
      });

      if (totalDep <= totalWith) {
        throw { message: "Can't send amount to Introducer" };
      }
      const date = new Date();
      let amount = 0;
      const transactionType = "Credit";
      if (totalDep > totalWith) {
        let diff = totalDep - totalWith;
        amount = (introducerpercent / 100) * diff;
        introducerId.wallet += amount;
      }
      introducerId.creditTransaction.push({
        date,
        transactionType,
        amount,
        userId,
        userName,
      });
      introducerId.save();
    } catch (error) {
      console.error(error);
    }
  },

  updateIntroducerProfile: async (id, data) => {
    const existingUser = await IntroducerUser.findById(id);
    if (!existingUser) {
      throw {
        code: 404,
        message: `Existing Introducer User not found with id : ${id}`,
      };
    }

    existingUser.firstname = data.firstname || existingUser.firstname;
    existingUser.lastname = data.lastname || existingUser.lastname;

    await existingUser.save().catch((err) => {
      console.error(err);
      throw {
        code: 500,
        message: `Failed to update Introducer User Profile with id : ${id}`,
      };
    });

    return true;
  },

  introducerLiveBalance: async (id) => {
    try {
      const introId = await IntroducerUser.findById(id).exec();
      if (!introId) {
        throw {
          code: 404,
          message: `Introducer with ID ${id} not found`,
        };
      }

      const IntroducerId = introId.userName;

      // Check if IntroducerId exists in any of the introducer user names
      const userIntroId = await User.find({
        $or: [
          { introducersUserName: IntroducerId },
          { introducersUserName1: IntroducerId },
          { introducersUserName2: IntroducerId }
        ]
      }).exec();

      if (userIntroId.length === 0) {
        return 0;
      }

      let liveBalance = 0;
      for (const user of userIntroId) {
        let matchedIntroducersUserName, matchedIntroducerPercentage;

        if (user.introducersUserName === IntroducerId) {
          matchedIntroducersUserName = user.introducersUserName;
          matchedIntroducerPercentage = user.introducerPercentage;
        } else if (user.introducersUserName1 === IntroducerId) {
          matchedIntroducersUserName = user.introducersUserName1;
          matchedIntroducerPercentage = user.introducerPercentage1;
        } else if (user.introducersUserName2 === IntroducerId) {
          matchedIntroducersUserName = user.introducersUserName2;
          matchedIntroducerPercentage = user.introducerPercentage2;
        }

        const transDetails = user.transactionDetail;

        if (!transDetails || transDetails.length === 0) {
          continue;
      }

        let totalDep = 0;
        let totalWith = 0;

        transDetails?.forEach((res) => {
          if (res.transactionType === "Deposit") {
            totalDep += Number(res.amount);
          }
          if (res.transactionType === "Withdraw") {
            totalWith += Number(res.amount);
          }
        });

        let amount = 0;
        if (totalDep > totalWith) {
          let diff = totalDep - totalWith;
          amount = (matchedIntroducerPercentage / 100) * diff;
        } else {
          let diff = totalDep - totalWith;
          amount = (matchedIntroducerPercentage / 100) * diff;
        }

        liveBalance += amount;
      }

      return Math.round(liveBalance);
    } catch (error) {
      console.error(error);
      throw error;
    }
  },


  introducerPasswordResetCode: async (userName, oldPassword, password) => {
    const existingUser = await introducerUser.findIntroducerUser({
      userName: userName,
    });

    const oldPasswordIsCorrect = await bcrypt.compare(
      oldPassword,
      existingUser.password
    );

    if (!oldPasswordIsCorrect) {
      throw {
        code: 401,
        message: "Invalid old password",
      };
    }

    const passwordIsDuplicate = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (passwordIsDuplicate) {
      throw {
        code: 409,
        message: "New Password cannot be the same as existing password",
      };
    }

    const passwordSalt = await bcrypt.genSalt();
    const encryptedPassword = await bcrypt.hash(password, passwordSalt);

    existingUser.password = encryptedPassword;
    existingUser.save().catch((err) => {
      console.error(err);
      throw { code: 500, message: "Failed to save new password" };
    });

    return true;
  },
};
