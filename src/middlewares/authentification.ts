import { NextFunction, Request, Response } from "express";
import AuthService from "services/authService";

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
        try {
            const token: string = request.headers["x-access-token"] || request.headers["authorization"]?.substring(7) || request.body.token || request.query.token;

            if (!token || token.length === 0)
                return response.status(403).send("A token is required for authentication");

            try {
                request.user = new AuthService().decodeJwt(token);
            } catch (error) {
                return response.status(500).send(error);
            }
        } catch (err) {
            return response.status(401).send("Invalid Token");
        }
        return next();
    }

    private _isWhitelisted(request: Request): boolean {
        if (request.originalUrl === "/")
            return true;
        return this._whitelistRoutes.some(route => request.originalUrl.startsWith(route));
    }

}