import jwt from "jsonwebtoken";
import AccountServices from "../services/Accounts.services.js";

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

      if (!user) {
        return res
          .status(401)
          .send({ code: 401, message: "Invalid login attempt (3)" });
      }

      if (!roles || roles.length === 0) {
        return res.status(400).send({ code: 400, message: "No roles provided" });
      }

      const roleServiceMap = {
        superadmin: AccountServices.findAdminById,
        admin: AccountServices.findAdminById,
        deposit: AccountServices.findAdminById,
        withdrawal: AccountServices.findAdminById,
      };      

      let existingUser;
      for (const role of roles) {
        const serviceMethod = roleServiceMap[role.toLowerCase()];

        if (!serviceMethod) {
          return res.status(400).send({
            code: 400,
            message: `Invalid role provided: ${role}`,
          });
        }

        existingUser = await serviceMethod(user.id);

        if (existingUser) {
          break;
        }
      }

      if (!existingUser) {
        return res.status(401).send({
          code: 401,
          message: "Invalid login attempt for the specified role",
        });
      }

      req.user = existingUser;
      next();
    } catch (err) {
      console.error("Authorization Error:", err.message);
      return res.status(401).send({ code: 401, message: "Unauthorized access" });
    }
  };
};
