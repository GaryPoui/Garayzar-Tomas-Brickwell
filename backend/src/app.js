import express from "express";
import routes from "./routes/index.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            message: "API de Brickell's funcionando correctamente."
        }
    });
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
