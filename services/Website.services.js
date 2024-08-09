import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { IntroducerUser } from '../models/introducer.model.js';
import { Admin } from '../models/admin_user.js';
import { IntroducerTransaction } from '../models/IntroducerTransaction.model.js';
import dotenv from 'dotenv';
import CustomError from '../utils/extendError.js';
import { apiResponseErr, apiResponseSuccess } from '../utils/response.js';
import { statusCode } from '../utils/statusCodes.js';
import AccountServices from './Accounts.services.js';
import { WebsiteRequest } from '../models/WebsiteRequest.model.js';
import { Website } from '../models/website.model.js';
import { EditWebsiteRequest } from '../models/EditWebsiteRequest.model.js';

export const websiteService = { 

addWebsiteName : async (req, res) => {
    try {
          const userName = req.user;
          const websiteName = req.body.websiteName.toLocaleLowerCase();
      
          // Check if the website name exists in Website or WebsiteRequest collections
          const existingWebsite = await Website.findOne({
            websiteName: { $regex: new RegExp(`^${websiteName}$`, "i") },
          });
      
          const existingWebsiteRequest = await WebsiteRequest.findOne({
            websiteName: { $regex: new RegExp(`^${websiteName}$`, "i") },
          });
      
          if (existingWebsite || existingWebsiteRequest) {
            return apiResponseErr( null, false, statusCode.exist, "Website name exists already!", res);
          }
      
          // Create a new website request if no duplicates are found
          const newWebsiteName = new WebsiteRequest({
            websiteName: websiteName,
            subAdminId: userName.userName,
            subAdminName: userName.firstname,
            isApproved: false,
            isActive: false,
          });
      
          const websites = await newWebsiteName.save();
          return apiResponseSuccess( websites, true, statusCode.success, "Website name sent for approval!", res);
        } catch (error) {
          return apiResponseErr( null, false, statusCode.internalServerError, error.message, res);
        }
      },
      

approveWebsite :  async (req, res) => {
    try {
          const { isApproved, subAdmins } = req.body;
          const bankId = req.params.id;
          const approvedWebisteRequest = await WebsiteRequest.findById(bankId);
    
          if (!approvedWebisteRequest) {
             return apiResponseErr(null, false, statusCode.notFound, 'Website not found in the approval requests!', res)
          }
    
          if (isApproved) {
            // Check if isApproved is true
            const approvedWebsite = new Website({
              websiteName: approvedWebisteRequest.websiteName,
              subAdminId: approvedWebisteRequest.subAdminId,
              subAdmins: subAdmins, // Assign the subAdmins array
              subAdminName: approvedWebisteRequest.subAdminName,
              isActive: true,
            });
    
            await approvedWebsite.save();
    
            await WebsiteRequest.deleteOne({ _id: approvedWebisteRequest._id });
          } else {
            return apiResponseErr(null, false, statusCode.badRequest, 'Website approval was not granted.', res)

          }
    
          //res.status(200).send({ message: 'Website approved successfully & Subadmin Assigned' });
          return apiResponseSuccess(null, true, statusCode.success, 'Website approved successfully & Subadmin Assigned', res)
        } catch (error) {
          return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
        }
      },

getViewWebsiteRequest : async (req, res) => {
    try {
          const resultArray = await WebsiteRequest.find().exec();

          return apiResponseSuccess(resultArray, true, statusCode.success, 'Website requests retrieved successfully.', res)

        } catch (error) {
            return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
            
        }
      },

deleteWebsiteRequest : async (req, res) => {
    try {
          const id = req.params.id;
          console.log("testing :", id)
          const result = await WebsiteRequest.deleteOne({ _id: id });
            console.log("test :", result.deletedCount)
          if (result.deletedCount === 1) {
            return apiResponseSuccess(null, true, statusCode.success, 'Data deleted successfully', res)
          } else {
            return apiResponseErr(null, false, statusCode.notFound, 'Data not found', res)
          }
        } catch (error) {
            return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);

        }
      },
       
websiteReject : async (req, res) => {
    try {
          const id = req.params.id;
          const result = await WebsiteRequest.deleteOne({ _id: id });
          console.log('result', result);
          if (result.deletedCount === 1) {
            return apiResponseSuccess(null, true, statusCode.success, 'Data deleted successfully', res)
          } else {
            return apiResponseErr(null, false, statusCode.notFound, 'Data not found', res)
          }
        } catch (error) {
            return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);

        }
      },

deleteEditWebsiteRequest : async (req, res) => {
    try {
          const id = req.params.id;
          const result = await EditWebsiteRequest.deleteOne({ _id: id });
          if (result.deletedCount === 1) {
            return apiResponseSuccess(null, true, statusCode.success, 'Data deleted successfully', res)
          } else {
            return apiResponseErr(null, false, statusCode.notFound, 'Data not found', res)

          }
        } catch (error) {
            return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);

        }
      },
    
updateWebsite: async (req, res) => {
    try {
        const id = req.params.id

        const {websiteName} = req.body;
        const existing= await Website.findById(id);
    if (!existing) {
      return apiResponseErr(null, false, statusCode.notFound, `Website not found with id: ${id}`, res)
    }
    let changedFields = {};
    if (websiteName !== existing.websiteName) {
      changedFields.websiteName = websiteName;
    }
    const duplicateWebsite = await Website.findOne({
      websiteName: websiteName,
    });
    if (duplicateWebsite && duplicateWebsite._id.toString() !== id) {
      return apiResponseErr(null, false, statusCode.bad, `Website name already exists!`, res)

    }
    const updatedTransactionData = {
      id: id,
      websiteName: websiteName || existing.websiteName,
    };
    const backupTransaction = new EditWebsiteRequest({
      ...updatedTransactionData,
      changedFields,
      message: "Website Detail's has been edited",
      isApproved: false,
    });
   const backup = await backupTransaction.save();
   return apiResponseSuccess(backup, true, statusCode.success, 'Website details have been successfully updated', res)
   } catch (error) {
    return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);
   } 
  },

  improveWebsite : async (req, res) => {
    try {
      // console.log('req',subAdminId)
      const { subAdmins } = req.body;
      console.log('first', subAdmins);
      const bankId = req.params.id;

      const approvedBankRequest = await Website.findById(bankId);
      console.log('first', approvedBankRequest);
      if (!approvedBankRequest) {
        //throw { code: 404, message: 'website not found in the approval requests!' };
        return apiResponseErr(null, false, statusCode.notFound, "website not found in the approval requests!", res)

      }

      const approvedWebsite = new Website({
        websiteName: approvedBankRequest.websiteName,
        subAdmins: subAdmins,
        isActive: true,
      });
     const approveWeb= await approvedWebsite.save();
      // await BankRequest.deleteOne({ _id: approvedBankRequest._id });
      return apiResponseSuccess(approveWeb, true, statusCode.success, 'Website Name approved successfully & Subadmin Assigned', res)
    } catch (error) {
      return apiResponseErr(null, false, statusCode.internalServerError, error.message, res);

    }
  }
};