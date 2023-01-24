import { RouteWhitelister } from "@middlewares/authentification";
import { Express } from "express";
import passport, { AuthenticateOptions } from "passport";

import TemplateRoutes from "./templateRoutes";

export default class AuthRoutes extends TemplateRoutes {
    private readonly _defaultAuthenticateOptions: Readonly<AuthenticateOptions> = {
        failureRedirect: this._clientUrl + "/auth/login",
        successRedirect: this._clientUrl + "/auth/success"
    };

    constructor(app: Express, routeWhitelister: RouteWhitelister) {
        super(app);

        this._init();

        routeWhitelister("/auth/local");
        routeWhitelister("/auth/discord");
        routeWhitelister("/auth/github");
        routeWhitelister("/auth/google");
    }

    private _init() {

        this._route("post", "/auth/logout", (req, res, next) =>
            req.logout((error) => {
                if (error)
                    return next(error);
                res.sendStatus(200);
            })
        );

        this._route("get", "/auth/local", passport.authenticate("local", this._defaultAuthenticateOptions));

        this._route("get", "/auth/discord", passport.authenticate("discord"));
        this._route("get", "/auth/discord/callback", passport.authenticate("discord", this._defaultAuthenticateOptions));

        this._route("get", "/auth/github", passport.authenticate("github"));
        this._route("get", "/auth/github/callback", passport.authenticate("github", this._defaultAuthenticateOptions));

        this._route("get", "/auth/google", passport.authenticate("google"));
        this._route("get", "/auth/google/callback", passport.authenticate("google", this._defaultAuthenticateOptions));

    }
}