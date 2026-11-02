import ReservaService from "../services/ReservaService.js";
import ApiResponse from "../responses/ApiResponse.js";
import { isStaff } from "../services/AuthService.js";

class ReservaController {
    obtenerTodas(req, res, next) {
        try {
            const reservas = ReservaService.obtenerTodas().filter((reserva) => isStaff(req.user) || reserva.cliente === req.user.id);
            return ApiResponse.success(res, reservas, 200);
        } catch (error) {
            next(error);
        }
    }

    obtenerPorId(req, res, next) {
        try {
            const reserva = isStaff(req.user)
                ? ReservaService.obtenerPorId(req.params.id)
                : ReservaService.obtenerPropia(req.params.id, req.user.id);
            return ApiResponse.success(res, reserva, 200);
        } catch (error) {
            next(error);
        }
    }

    crear(req, res, next) {
        try {
            const nuevaReserva = ReservaService.crear({ ...req.body, cliente: req.user.id });
            return ApiResponse.success(res, nuevaReserva, 201);
        } catch (error) {
            next(error);
        }
    }

    modificar(req, res, next) {
        try {
            const reservaActualizada = ReservaService.modificar(
                req.params.id,
                req.body
            );

            return ApiResponse.success(res, reservaActualizada, 200);
        } catch (error) {
            next(error);
        }
    }

    eliminar(req, res, next) {
        try {
            const reservaEliminada = ReservaService.eliminar(req.params.id);
            return ApiResponse.success(res, reservaEliminada, 200);
        } catch (error) {
            next(error);
        }
    }
}

export default new ReservaController();
