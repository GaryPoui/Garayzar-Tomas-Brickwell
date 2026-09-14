import { Router } from "express";
import ReservaController from "../controllers/ReservaController.js";

const router = Router();

router.get("/", ReservaController.obtenerTodas.bind(ReservaController));
router.get("/:id", ReservaController.obtenerPorId.bind(ReservaController));
router.post("/", ReservaController.crear.bind(ReservaController));
router.put("/:id", ReservaController.modificar.bind(ReservaController));
router.delete("/:id", ReservaController.eliminar.bind(ReservaController));

export default router;
