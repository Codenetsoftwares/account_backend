import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const generateTokens = (data) => {
  try {
    const accessToken = jwt.sign(data, process.env.TOKEN_SECRET, {
      expiresIn: process.env.EXPIRETIME,
    });
    const refreshToken = jwt.sign(data, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRETIME,
    });
    const token = {
      accessToken,
      refreshToken,
    };
    return token;
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
};
