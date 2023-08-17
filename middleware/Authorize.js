import jwt from "jsonwebtoken";
import AccountServices from "../services/Accounts.services.js";
import { Admin } from "../models/admin_user.js";
import { use } from "bcrypt/promises.js";
import { User } from "../models/user.model.js";

export const Authorize = (roles) => {
  return async (req, res, next) => {
    try {
      const authToken = req.headers.authorization;

      if (!authToken) {  
        return res
          .status(401)
          .send({ code: 401, message: "Invalid login attempt (1)" });
      }

      const tokenParts = authToken.split(" ");
      if (
        tokenParts.length !== 2 ||
        !(tokenParts[0] === "Bearer" && tokenParts[1])
      ) {
        return res
          .status(401)
          .send({ code: 401, message: "Invalid login attempt (2)" });
      }

      const user = jwt.verify(tokenParts[1], process.env.JWT_SECRET_KEY);
      console.log('user from jwt',user.id)
      if (!user) {
        return res
          .status(401)
          .send({ code: 401, message: "Invalid login attempt (3)" });
      }

      let existingUser;
      if (roles.includes("superAdmin")) {
        existingUser = await Admin.findById(user.id).exec();
        console.log('existing user',existingUser.roles)
        if (!existingUser) {
          return res
            .status(401)
            .send({ code: 401, message: "Invalid login attempt for user (1)" });
        }
      }

      if (roles.includes("Dashboard")) {
        existingUser = await Admin.findById(user.id).exec();
        if (!existingUser) {
          return res.status(401).send({
            code: 401,
            message: "Invalid login attempt for admin (2)",
          });
        }
      }
      
      if (roles.includes("BankView")) {
        existingUser = await Admin.findById(user.id).exec();
        if (!existingUser) {
          return res.status(401).send({
            code: 401,
            message: "Invalid login attempt for admin (3)",
          });
        }
      }

      if (roles.includes("CreateSubAdmin")) {
        existingUser = await Admin.findById(user.id).exec();
        if (!existingUser) {
          return res.status(401).send({
            code: 401,
            message: "Invalid login attempt for admin (4)",
          });
        }
      }

      if (roles.includes("WebsiteView")) {
        existingUser = await Admin.findById(user.id).exec();
        if (!existingUser) {
          return res.status(401).send({
            code: 401,
            message: "Invalid login attempt for admin (4)",
          });
        }
      }

      if (roles.includes("Profile")) {
        existingUser = await Admin.findById(user.id).exec();
        if (!existingUser) {
          return res.status(401).send({
            code: 401,
            message: "Invalid login attempt for admin (4)",
          });
        }
      }

      if (roles.includes("EditRequest")) {
        existingUser = await Admin.findById(user.id).exec();
        if (!existingUser) {
          return res.status(401).send({
            code: 401,
            message: "Invalid login attempt for admin (4)",
          });
        }
      }

      if (roles.includes("user")) {
        existingUser = await User.findById(user.id).exec();
        if (!existingUser) {
          return res.status(401).send({
            code: 401,
            message: "Invalid login attempt for admin (4)",
          });
        }
      }
      if (roles && roles.length > 0) {
        let userHasRequiredRole = false;
        roles.forEach((role) => {
          const rolesArray = existingUser.roles;
          for(const element of rolesArray) {
            console.log(element,role)
            if (role === element){
              userHasRequiredRole = true;
            }
          }
        });
        if (!userHasRequiredRole)
          return res
            .status(401)
            .send({ code: 401, message: "Unauthorized access" });
      }

      req.user = existingUser;
      next();
    } catch (err) {
      console.error("Authorization Error:", err.message);
      return res.status(401).send({ code: 401, message: "Unauthorized access" });
    }
  };
};
