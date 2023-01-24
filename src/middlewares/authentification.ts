import { NextFunction, Request, Response } from "express";
import passport from "passport";

export type RouteWhitelister = (route: string) => void;

export default class AuthentificationMiddleware {
    private _whitelistRoutes: Array<string> = [];

    public whitelistRoute: RouteWhitelister = (route: string) => {
        if (!route.startsWith("/"))
            route = "/" + route;
        this._whitelistRoutes.push(route);
    };

    public handler(request: Request, response: Response, next: NextFunction) {
        if (this._isWhitelisted(request))
            return next();

        this._verification(request, response, next);
    }

    private _verification(request: Request, response: Response, next: NextFunction) {
        return passport.authenticate("session")(request, response, next);
    }

    private _isWhitelisted(request: Request): boolean {
        if (request.originalUrl === "/")
            return true;
        return this._whitelistRoutes.some(route => request.originalUrl.startsWith(route));
    }

}