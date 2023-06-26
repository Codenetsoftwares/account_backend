import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

export const generatePassword = async (password) => {
  const HashPass = await bcrypt
    .genSalt(12)
    .then((salt) => bcrypt.hash(password, salt))
    .then((hash) => hash);
  return HashPass;
};
