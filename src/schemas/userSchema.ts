import mongoose, { FilterQuery } from "mongoose";
import bcrypt from "bcryptjs";

import User from "@classes/user";
import TemplateSchema from "./templateSchema";
import { ObjectId } from "../utils";

const userSchema = new mongoose.Schema({
    useName: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    avatar: { type: String },
    phone: { type: String, unique: true },
    registrationDate: { type: Date, default: Date.now },
    auth: {
        password: { type: String, select: false }
    }
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

export default class UserSchema extends TemplateSchema<User> {

    constructor() {
        super(userSchema);
    }

    public async add(obj: User): Promise<User> {
        if (obj.auth?.password)
            obj.auth.password = await bcrypt.hash(obj.auth.password, 10);
        return super.add(obj);
    }

    public async findByEmail(email: string): Promise<User | null> {
        const result = await this._model.findOne({ email }, { password: 1 });

        return result ? new User(result.toObject()) : null;
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