import { Trash } from "../models/Trash.model.js";
import { apiResponsePagination } from "../utils/response.js";
import { statusCode } from "../utils/statusCodes.js";

export const DeleteService = {

    trashView: async (req, res) => {
        try {
            const { page = 1, pageSize = 10 } = req.query;
            const skip = (page - 1) * pageSize;
            const limit = parseInt(pageSize);

            const trashData = await Trash.find()
                .skip(skip)
                .limit(limit)
                .exec();

            const totalItems = await Trash.countDocuments().exec();
            const totalPages = Math.ceil(totalItems / limit);

            return apiResponsePagination(trashData, true, statusCode.success, 'Trash data fetched successfully', {
                page: parseInt(page),
                limit,
                totalPages,
                totalItems
            },
                res
            );

        } catch (error) {
            return apiResponseErr(null, false, error.responseCode ?? statusCode.internalServerError, error.message, res);

        }
    },
    
}