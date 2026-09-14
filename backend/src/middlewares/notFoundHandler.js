import { NotFoundError } from "../exceptions/AppError.js";
import { Messages } from "../enums/Messages.js";

export const notFoundHandler = (req, res, next) => {
    next(new NotFoundError(Messages.ROUTE_NOT_FOUND));
};
