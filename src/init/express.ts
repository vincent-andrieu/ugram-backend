import express, { Express } from "express";
import cors from "cors";
import { env } from "process";
import passport from "passport";
import session from "express-session";

import MyUser from "@classes/user";

import "@passport/setupPassport";
import "@passport/localPassport";
import "@passport/discordPassport";
import "@passport/githubPassport";
import "@passport/googlePassport";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface User extends Omit<MyUser, "auth"> {}
    }
}

export default function initExpress(): Promise<Express> {
    const PORT = env.PORT ? Number(env.PORT) : undefined;

    if (!PORT)
        throw new Error("PORT environment variable not found");
    return new Promise((resolve) => {
        const app = express();

        app.use(express.json());
        // app.use(bodyParser.urlencoded({ extended: true }));

        // Passport middlewares
        const passportSessionSecret = env.PASSPORT_SESSION_SECRET;

        if (!passportSessionSecret)
            throw new Error("PASSPORT_SESSION_SECRET environment variable not found");
        app.use(session({
            secret: passportSessionSecret,
            resave: false,
            saveUninitialized: false,
            cookie: { secure: true }
        }));
        app.use(passport.initialize());
        app.use(passport.session());

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