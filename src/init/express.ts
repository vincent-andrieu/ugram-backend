import express, { Express } from "express";
import cors from "cors";
import { env } from "process";

export default function initExpress(): Promise<Express> {
    const PORT = env.PORT ? Number(env.PORT) : undefined;

    if (!PORT) 
        throw new Error("PORT environment variable not found");
    return new Promise((resolve) => {
        const app = express();

        app.use(express.json());
        // app.use(bodyParser.urlencoded({ extended: true }));

        app.use(cors());
        app.use(function (_, result, next) {
            result.setHeader("Content-Type", "application/json");
            next();
        });

        app.listen(PORT, () => {
            console.info(`App listening on port ${PORT} !`);
            resolve(app);
        });
    });
}