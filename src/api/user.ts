import { Express } from "express";

import User from "@classes/user";
import UserSchema from "@schemas/userSchema";
import TemplateRoutes from "./TemplateRoutes";

export default class UserRoutes extends TemplateRoutes {
    private _userSchema = new UserSchema();

    constructor(app: Express) {
        super(app);

        this._init();
    }

    private _init() {

        this._route("get", "/user", async (req, res) => {
            if (!req.user)
                throw new Error("Authenticated user not found");
            const result = await this._userSchema.get(req.user.data.userId);

            res.send(result);
        });

        this._route<User>("put", "/user", async (req, res) => {
            if (!req.user)
                throw new Error("Authenticated user not found");
            const result = await this._userSchema.updateById(req.user.data.userId, new User(req.body)); // Select fields to update

            res.send(result);
        });

    }
}