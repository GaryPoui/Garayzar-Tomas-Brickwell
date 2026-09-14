import AppError from "../exceptions/AppError.js";
import ApiResponse from "../responses/ApiResponse.js";
import { Messages } from "../enums/Messages.js";

export const errorHandler = (error, req, res, next) => {
    if (error instanceof AppError) {
        return ApiResponse.error(res, error.message, error.statusCode);
    }

    console.error(error);

    return ApiResponse.error(
        res,
        Messages.INTERNAL_SERVER_ERROR,
        500
    );
};
