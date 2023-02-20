import { Express, NextFunction, Request, RequestHandler, Response } from "express";
import { RouteParameters } from "express-serve-static-core";
import mongoose from "mongoose";
import { env } from "process";

export default class TemplateRoutes {
    protected readonly _clientUrl: string;

    constructor(protected _app: Express, private _defaultHeader: Record<string, string> = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Content-Type": "application/json"
    }) {
        if (!env.CLIENT_URL)
            throw new Error("CLIENT_URL environment variable not found");
        this._clientUrl = env.CLIENT_URL;
        if (this._clientUrl.endsWith("/"))
            this._clientUrl = this._clientUrl.slice(0, -1);
    }

    protected _setHeader(response: Response, header: Record<string, string>) {
        Object.entries(header).forEach(([key, value]) =>
            response.setHeader(key, value)
        );
    }

    protected _route<ReqBody = unknown, ResBody = unknown, P = RouteParameters<string>>(method: "get" | "post" | "put" | "delete", route: string, ...handlers: Array<RequestHandler<P, ResBody, ReqBody>>) {
        return this._app[method](route, handlers
            .map((handler) => (req: Request<P, ResBody, ReqBody>, res: Response<ResBody>, next: NextFunction) =>
                this._wrapper<P, ResBody, ReqBody>(req, res, next, handler)
            )
        );
    }

    private async _wrapper<P, ResBody, ReqBody>(request: Request<P, ResBody, ReqBody>, response: Response<ResBody>, next: NextFunction, handler: RequestHandler<P, ResBody, ReqBody>): Promise<void> {
        if (mongoose.connection.readyState !== mongoose.ConnectionStates.connected) {
            response.sendStatus(503);
            console.log("Database not connected:", mongoose.connection.readyState);
            return;
        }

        this._setHeader(response, this._defaultHeader);

        try {
            // DO NOT REMOVE THIS AWAIT ! Otherwise the error won't be catched
            await handler(request, response, next) as Promise<void> | void;
        } catch (error) {
            this._errorHandler(error, request, response, next);
        }
    }

    private _errorHandler<P, ResBody, ReqBody, ReqQuery>(error: unknown, _req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response, next: NextFunction): void {
        if (typeof error === "string")
            res.status(400).send(error);
        else if (error instanceof Error)
            next(error);
        else
            next(new Error("Unknown error"));
    }

}