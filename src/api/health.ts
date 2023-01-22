import { Express } from "express";

export default class HealthRoutes {

    constructor(private _app: Express) {
        this._init();
    }

    private _init() {
        this._app.get("/", (_, res) => {
            res.sendStatus(200);
        });
    }
}