import jwt from "jsonwebtoken";
import AccountServices from "../services/Accounts.services.js";
import { Admin } from "../models/admin_user.js";
import { use } from "bcrypt/promises.js";

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

      const user = jwt.verify(tokenParts[1], process.env.TOKEN_SECRET);
      console.log(user.id)
      if (!user) {
        return res
          .status(401)
          .send({ code: 401, message: "Invalid login attempt (3)" });
      }

      let existingUser;
      if (roles.includes("superAdmin")) {
        existingUser = await Admin.findById(user.id).exec();
        if (!existingUser) {
          return res
            .status(401)
            .send({ code: 401, message: "Invalid login attempt for user (1)" });
        }
      }

      if (roles.includes("admin")) {
        existingUser = await Admin.findById(user.id).exec();
        if (!existingUser) {
          return res.status(401).send({
            code: 401,
            message: "Invalid login attempt for admin (2)",
          });
        }
      }
      
      if (roles.includes("deposit")) {
        existingUser = await Admin.findById(user.id).exec();
        if (!existingUser) {
          return res.status(401).send({
            code: 401,
            message: "Invalid login attempt for admin (3)",
          });
        }
      }

      if (roles.includes("withdraw")) {
        existingUser = await Admin.findById(user.id).exec();
        if (!existingUser) {
          return res.status(401).send({
            code: 401,
            message: "Invalid login attempt for admin (4)",
          });
        }
      }
      console.log(existingUser.roles)
      if (roles && roles.length > 0) {
        let userHasRequiredRole = false;
        roles.forEach((role) => {
          const rolesArray = existingUser.roles;
          for(const element of rolesArray) {
            if (role.toLowerCase() === element){
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
