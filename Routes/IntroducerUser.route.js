import { introducerUser } from '../services/introducer.services.js';
import { IntroducerUser } from '../models/introducer.model.js';
import { AuthorizeRole } from '../middleware/auth.js';
import { User } from '../models/user.model.js';
import { IntroducerTransaction } from '../models/IntroducerTransaction.model.js';
import { validateIntroducerProfileUpdate, validateLogin, validateResetPassword } from '../utils/commonSchema.js';
import customErrorHandler from '../utils/customErrorHandler.js';
import { string } from '../constructor/string.js';
import { apiResponseErr, apiResponsePagination, apiResponseSuccess } from '../utils/response.js';
import { statusCode } from '../utils/statusCodes.js';

export const IntroducerRoutes = (app) => {
  app.post('/api/introducer/user/login',
    validateLogin, 
    customErrorHandler,
    introducerUser.introducerLogin
  );

  app.get(
    '/api/intoducer/profile',
    AuthorizeRole([string.introducer]),
    introducerUser.getInroducerProfile,
  );

  app.put(
    '/api/intoducer-profile-edit/:id',
    validateIntroducerProfileUpdate,
    customErrorHandler,
    AuthorizeRole([string.introducer]),
    introducerUser.updateIntroducerProfile,
  );
  app.get('/api/intoducer/user-data/:id', 
    AuthorizeRole([string.introducer]),
    introducerUser.getIntroducerUserData
  );

  app.get('/api/list-introducer-user/:id', 
    AuthorizeRole([string.introducer]), 
    introducerUser.getListIntroducerUser
   );

  app.get('/api/introducer-user-single-data/:id', 
    AuthorizeRole([string.introducer]),
    introducerUser.getIntroducerUserSingleData 
   );

  app.get('/api/introducer/introducer-live-balance/:id', 
    AuthorizeRole([string.introducer]), 
    introducerUser. getIntroducerLiveBalance 
   );

  app.get('/api/introducer-account-summary/:id', 
    AuthorizeRole([string.introducer]), 
    introducerUser.getIntroducerAccountSummary 
   );

  app.post('/api/introducer/reset-password',validateResetPassword,customErrorHandler,
    AuthorizeRole([string.introducer]), 
    introducerUser.introducerPasswordResetCode
    );

  // app.get("/api/introducer/data/:id",AuthorizeRole(["introducer"]),
  //   async (req, res) => {
  //     try {

  //       const {
  //         sdate,
  //         edate
  //       } = req.body;
  //       const filter = {};
  //       if (sdate && edate) {
  //         filter.createdAt = { $gte: new Date(sdate), $lte: new Date(edate) };
  //       } else if (sdate) {
  //         filter.createdAt = { $gte: new Date(sdate) };
  //       } else if (edate) {
  //         filter.createdAt = { $lte: new Date(edate) };
  //       }
  //       const id = req.params.id;
  //       console.log('id', id)
  //       const introducerUser = await IntroducerUser.findOne({ _id: id }, "userName").exec();
  //       console.log('introducerUser', introducerUser)
  //       if (!introducerUser) {
  //         return res.status(404).send({ message: "IntroducerUser not found" });
  //       }
  //       const users = await User.find({
  //         introducersUserName: introducerUser.userName,
  //       }).exec();
  //       console.log('first')

  //       res.send(users);

  //     } catch (e) {
  //       console.error(e);
  //       res.status(e.code).send({ message: e.message });
  //     }
  //   })

  app.get(
    '/api/introducer-user/accountsummary/:introducerUsername',
    AuthorizeRole(['introducer']),
    introducerUser.getIntroducerUserAccountSummary
  );
};

export default IntroducerRoutes;
