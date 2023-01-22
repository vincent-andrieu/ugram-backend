import "module-alias/register.js";
import dotenv from "dotenv";

import initExpress from "./init/express";
import initDatabase from "./init/database";
import HealthRoutes from "@api/health";
import UserRoutes from "@api/user";
import { loggerMiddleware, errorLoggerMiddleware} from "@middlewares/logger";
import AuthentificationMiddleware from "@middlewares/authentification";

dotenv.config({ path: ".env.local" });

async function main() {
    console.log("Server starting...");
    initDatabase();
    const app = await initExpress();
    const authentificationMiddleware = new AuthentificationMiddleware();

    // Middlewares
    app.use(loggerMiddleware);
    app.use(authentificationMiddleware.handler.bind(authentificationMiddleware));

    // Routes
    new HealthRoutes(app, authentificationMiddleware.whitelistRoute);
    new UserRoutes(app);

    // Error middlewares
    app.use(errorLoggerMiddleware);
}

main();