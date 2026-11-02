import { Router } from "express";
import CatalogoService from "../services/CatalogoService.js";
import ApiResponse from "../responses/ApiResponse.js";

const router = Router();

router.get("/", (req, res, next) => {
    try {
        return ApiResponse.success(
            res,
            CatalogoService.obtener(req.query.fecha, req.query.excluir),
            200,
        );
    } catch (error) {
        next(error);
    }
});

export default router;
