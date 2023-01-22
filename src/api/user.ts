import { Express } from "express";

import User from "@classes/user";
import UserSchema from "@schemas/userSchema";
import TemplateRoutes from "./TemplateRoutes";
import { toObjectId, isObjectId } from "../utils";

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

        this._route("get", "/user/:id", async (req, res) => {
            const result = await this._userSchema.get(toObjectId(req.params.id));

            res.send(result);
        });

        this._route("get", "/user/list", async (req, res) => {
            if (!req.user)
                throw new Error("Authenticated user not found");
            const page = Number(req.query.page) || 0;
            const size = Number(req.query.size) || 10;
            const search = req.query.search;
            const userFilter = (req.query.userFilter as Array<string>)?.map((userId: string) => toObjectId(userId)) || [];

            if (!page || !size || page < 0 || size < 0 ||
                (search && typeof search !== "string") ||
                !Array.isArray(userFilter) || userFilter.some((userId) => !isObjectId(userId))
            )
                return res.status(400).send("Invalid parameters");
            userFilter.push(req.user.data.userId);
            const result = await this._userSchema.getPaginatedUsers(page, size, search, userFilter);

            res.send(result);
        });

        this._route<User>("put", "/user", async (req, res) => {
            if (!req.user)
                throw new Error("Authenticated user not found");
            const user = new User(req.body);
            let fields = "";

            if (user.firstName)
                fields += " firstName";
            if (user.lastName)
                fields += " lastName";
            if (user.email)
                fields += " email";
            if (user.phone)
                fields += " phone";
            const result = await this._userSchema.updateById(req.user.data.userId, user, fields);

            res.send(result);
        });

    }
}