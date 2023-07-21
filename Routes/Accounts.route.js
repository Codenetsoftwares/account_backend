import AccountServices from "../services/Accounts.services.js";
import { Admin } from '../models/admin_user.js';
import { Authorize } from "../middleware/Authorize.js";

const AccountsRoute = (app) => {
  /**
   * @swagger
   * /admin/login:
   *   post:
   *     tags: [Accounts]
   *     summary: Login and generate access token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             properties:
   *              email:
   *                type: string
   *                description: The email address of the user
   *                example: john.doe@example.com
   *              password:
   *                type: string
   *                description: The login password
   *                example: secret@123
   *              persist:
   *                type: boolean
   *                description: Use persistent token or short-term token
   *                example: true
   *     responses:
   *       200:
   *        description: The user was logged in successfully
   *       400:
   *        description: Bad Request
   *       500:
   *        description: Internal Server Error
   */

  app.post("/admin/login", async (req, res) => {
    try {
      const { email, password, persist } = req.body;

      if (!email) {
        throw { code: 400, message: "Email ID is required" };
      }

      if (!password) {
        throw { code: 400, message: "Password is required" };
      }

      const user = await Admin.findOne({ email: email });
      console.log(user);
      if (!user) {
        throw { code: 404, message: "User not found" };
      }

      const accessToken = await AccountServices.generateAccessToken(
        email,
        password,
        persist
      );

      if (!accessToken) {
        throw { code: 500, message: "Failed to generate access token" };
      }

      res.status(200).send({
        token: accessToken,
      });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  

  /**
   * @swagger
   * /create/admin:
   *   post:
   *     tags: [Accounts]
   *     summary: Register new user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             properties:
   *              Email:
   *                type: string
   *                description: The email address of the user
   *                example: john.doe@example.com
   *              Password:
   *                type: string
   *                description: The login password
   *                example: secret@123
   *              Username:
   *                type: string
   *                description: The User name  of the user
   *                example: john_doe10
   *              Role:
   *                type: string
   *                description: The Role of the User
   *                example: Admin
   *     responses:
   *       200:
   *        description: The user was registered successfully
   *       400:
   *        description: Bad Request
   *       500:
   *        description: Internal Server Error
   */

  app.post("/api/create/user-admin",Authorize(["superAdmin"]), async (req, res) => {
    try {
      await AccountServices.createUser(req.body);
      res
        .status(200)
        .send({ code: 200, message: "Admin registered successfully!" });
    } catch (e) {
      console.error(e);
      res.status(e.code).send({ message: e.message });
    }
  });

  /**
   * @swagger
   * /withdraw/login:
   *   post:
   *     tags: [Accounts]
   *     summary: Login and generate access token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             properties:
   *              email:
   *                type: string
   *                description: The email address of the user
   *                example: john.doe@example.com
   *              password:
   *                type: string
   *                description: The login password
   *                example: secret@123
   *              persist:
   *                type: boolean
   *                description: Use persistent token or short-term token
   *                example: true
   *     responses:
   *       200:
   *        description: The user was logged in successfully
   *       400:
   *        description: Bad Request
   *       500:
   *        description: Internal Server Error
   */

  
};

export default AccountsRoute;
