import jwt from "jsonwebtoken";
import { userservice } from "../services/user.service.js";
import { introducerUser } from "../services/introducer.services.js"

export const AuthorizeRole = (roles) => {
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

      if (!user) {
        return res
          .status(401)
          .send({ code: 401, message: "Invalid login attempt (3)" });
      }

      let existingUser;
      if (roles.includes("user")) {
        existingUser = await userservice.findUserById(user.id);
        if (!existingUser) {
          return res
            .status(401)
            .send({ code: 401, message: "Invalid login attempt for user (4)" });
        }
      }

      if (roles.includes("introducer")) {
        existingUser = await introducerUser.findIntroducerUserById(user.id);
        if (!existingUser) {
          return res
            .status(401)
            .send({ code: 401, message: "Invalid login attempt for user (4)" });
        }
      }

      if (roles && roles.length > 0) {
        let userHasRequiredRole = false;
        roles.forEach((role) => {
          if (existingUser.role === role.toLowerCase())
            userHasRequiredRole = true;
        });
        if (!userHasRequiredRole)
          return res
            .status(401)
            .send({ code: 401, message: "Unauthorized access" });
      }

      req.user = existingUser;
    } catch (err) {
      console.log(err);
      return res
        .status(401)
        .send({ code: 401, message: "Invalid login attempt (5)" });
    }
    next();
  };
};
