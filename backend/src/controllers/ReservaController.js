import ReservaService from "../services/ReservaService.js";
import ApiResponse from "../responses/ApiResponse.js";

class ReservaController {
    obtenerTodas(req, res, next) {
        try {
            const reservas = ReservaService.obtenerTodas();
            return ApiResponse.success(res, reservas, 200);
        } catch (error) {
            next(error);
        }
    }

    obtenerPorId(req, res, next) {
        try {
            const reserva = ReservaService.obtenerPorId(req.params.id);
            return ApiResponse.success(res, reserva, 200);
        } catch (error) {
            next(error);
        }
    }

    crear(req, res, next) {
        try {
            const nuevaReserva = ReservaService.crear(req.body);
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
