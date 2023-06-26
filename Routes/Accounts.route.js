import authenticateToken from '../middleware/AuthenticateToken.js';
import AccountServices from '../services/Accounts.services.js';
import AccountsServices from '../services/Accounts.services.js';

const AccountsRoute = (app) => {
  
  app.post('/admin/login', async (req, res) => {
    try {
      await AccountsServices.adminLogin(req, res);
    } catch (error) {
      res.send({ status: 500, message: error });
    }
  });

  app.post('/deposit/login', async (req, res) => {
    try {
      await AccountsServices.depositLogin(req, res);
    } catch (error) {
      res.send({ status: 500, message: error });
    }
  });

  app.post('/create/admin', authenticateToken('admin'), async (req, res) => {
    try {
      await AccountServices.createUser(req, res);
    } catch (error) {
      res.send({ status: 500, message: error });
    }
  });

  app.post('/withdraw/login', async (req, res) => {
    try {
      await AccountsServices.withdrawLogin(req, res);
    } catch (error) {
      res.send({ status: 500, message: error });
    }
  });
  
};

export default AccountsRoute;
