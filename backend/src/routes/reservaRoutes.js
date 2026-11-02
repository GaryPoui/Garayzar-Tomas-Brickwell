import { Router } from "express";
import ReservaController from "../controllers/ReservaController.js";
import { requireAuth, requireStaff } from "../services/AuthService.js";

const router = Router();
router.use(requireAuth);
router.use((req, res, next) => {
	res.set("Cache-Control", "no-store");
	next();
});

router.get("/", ReservaController.obtenerTodas.bind(ReservaController));
router.get("/:id", ReservaController.obtenerPorId.bind(ReservaController));
router.post("/", ReservaController.crear.bind(ReservaController));
router.put("/:id", requireStaff, ReservaController.modificar.bind(ReservaController));
router.delete("/:id", requireStaff, ReservaController.eliminar.bind(ReservaController));

export default router;
