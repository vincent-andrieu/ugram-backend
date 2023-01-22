import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "process";

import { ObjectId, toObjectId } from "../utils";

export type RouteWhitelister = (route: string) => void;

export interface JwtData {
    userId: ObjectId;
    token: string;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface User extends JwtPayload {
            data: JwtData;
        }
    }
}

function formatJwtData(data: JwtData, token: string): JwtData {
    return {
        userId: toObjectId(data.userId),
        token: token
    };
}

function decodeJwt(token: string): Express.User {
    const jwtSecret = env.JWT_SECRET;

    if (!token || token.length === 0)
        throw "Undefined JWT token";
    if (!jwtSecret)
        throw "Undefined JWT secret";
    const decoded = jwt.verify(token, jwtSecret);

    if (typeof decoded === "string" || !decoded.data)
        throw "Fail to decode access token";
    decoded.data = formatJwtData(decoded.data, token);
    return decoded as Express.User;
}

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
                request.user = decodeJwt(token);
            } catch (error) {
                return response.status(500).send(error);
            }
        } catch (err) {
            return response.status(401).send("Invalid Token");
        }
        return next();
    }

    private _isWhitelisted(request: Request): boolean {
        return this._whitelistRoutes.some(route => request.originalUrl.startsWith(route));
    }

}