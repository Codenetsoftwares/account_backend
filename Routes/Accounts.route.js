import authenticateToken from "../middleware/AuthenticateToken.js";
import AccountServices from "../services/Accounts.services.js";
import AccountsServices from "../services/Accounts.services.js";

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

  app.post("/admin/login", authenticateToken("admin"),  async (req, res) => {
    try {
      await AccountsServices.adminLogin(req, res);
    } catch (error) {
      res.send({ status: 500, message: error });
    }
  });

  /**
   * @swagger
   * /deposit/login:
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

  app.post("/deposit/login", authenticateToken("deposit"), async (req, res) => {
    try {
      await AccountsServices.depositLogin(req, res);
    } catch (error) {
      res.send({ status: 500, message: error });
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

  app.post("/create/admin", async (req, res) => {
    try {
      await AccountServices.createUser(req, res);
    } catch (error) {
      res.send({ status: 500, message: error });
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

  app.post("/withdraw/login", async (req, res) => {
    try {
      await AccountsServices.withdrawLogin(req, res);
    } catch (error) {
      res.send({ status: 500, message: error });
    }
  });
};

export default AccountsRoute;
