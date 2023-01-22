import { Express } from "express";

import { RouteWhitelister } from "@middlewares/authentification";

export default class HealthRoutes {

    constructor(private _app: Express, routeWhitelister: RouteWhitelister) {
        this._init();

        routeWhitelister("/health");
    }

    private _init() {
        this._app.get("/", (_, res) => {
            res.status(200).send("OK");
        });

        this._app.get("/health", (_, res) => {
            res.sendStatus(200);
        });
    }
}