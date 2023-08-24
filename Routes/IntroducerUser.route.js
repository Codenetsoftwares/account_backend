import { introducerUser } from "../services/introducer.services.js";
import { IntroducerUser } from "../models/introducer.model.js"

export const IntroducerRoutes = (app) => {
  
    app.post("/api/introducer/user/login", async (req, res) => {
        try {
          const { email, password, persist } = req.body;
          if (!email) {
            throw { code: 400, message: "Email ID is required" };
          }
    
          if (!password) {
            throw { code: 400, message: "Password is required" };
          }
          const accessToken = await introducerUser.generateIntroducerAccessToken(
            email,
            password,
            persist
          );  
    
          if (!accessToken) {
            throw { code: 500, message: "Failed to generate access token" };
          }
          const user = await IntroducerUser.findOne({ email: email });
          if (!user) {
            throw { code: 404, message: "User not found" };
          }
          if (user && accessToken) {
            res.status(200).send({
              token: accessToken,
            });
          } else {
            res
              .status(404)
              .json({ error: "User not found or access token is invalid" });
          }
        } catch (e) {
          console.error(e);
          res.status(e.code).send({ message: e.message });
        }
      });

      
    
};


export default IntroducerRoutes;
