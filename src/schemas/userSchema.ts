import mongoose, { FilterQuery } from "mongoose";

import User from "@classes/user";
import TemplateSchema from "./templateSchema";
import { ObjectId } from "../utils";

const userSchema = new mongoose.Schema({
    useName: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    avatar: { type: String },
    phone: { type: String },
    registrationDate: { type: Date, default: Date.now }
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

export default class UserSchema extends TemplateSchema<User> {

    constructor() {
        super(userSchema);
    }

    public async getPaginatedUsers(page: number, size: number, search?: string, userFilter: Array<ObjectId> = []) {
        const query: FilterQuery<User> = {
            $and: [
                { _id: { $nin: userFilter } }
            ]
        };
        if (search)
            query.$and?.push({
                $or: [
                    { firstName: { $regex: search, $options: "i" } },
                    { lastName: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } }
                ]
            });
        const users = await this._model.find(query, undefined, { skip: page * size, limit: size });

        return users.map((user) => new User(user.toObject()));
    }

}