import bcrypt from "bcryptjs";
import mongoose, { FilterQuery } from "mongoose";
import { env } from "process";

import User from "@classes/user";
import { ObjectId } from "../utils";
import TemplateSchema from "./templateSchema";

const userSchema = new mongoose.Schema<User>({
    useName: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String },
    email: { type: String, unique: true, required: true },
    avatar: { type: String },
    phone: { type: String },
    registrationDate: { type: Date, default: Date.now },
    auth: {
        password: { type: String, select: false },
        sources: {
            local: { type: Boolean, default: false, select: false },
            discord: { type: Boolean, default: false, select: false },
            github: { type: Boolean, default: false, select: false },
            google: { type: Boolean, default: false, select: false }
        }
    }
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

export default class UserSchema extends TemplateSchema<User> {
    private readonly _salt: string;

    constructor() {
        super(User, "users", userSchema);

        if (!env.PASSWORDS_SALT)
            throw new Error("PASSWORDS_SALT environment variable not found");
        this._salt = env.PASSWORDS_SALT;
    }

    public async add(obj: User): Promise<User> {
        if (obj.auth?.password)
            obj.auth.password = bcrypt.hashSync(obj.auth.password, this._salt);
        return super.add(obj);
    }

    public async update(obj: User): Promise<User> {
        if (obj.auth?.password)
            obj.auth.password = bcrypt.hashSync(obj.auth.password, this._salt);
        return super.update(obj);
    }

    public async updateById(id: mongoose.Types.ObjectId, obj: Omit<User, "_id">, fields?: string): Promise<User> {
        if (obj.auth?.password)
            obj.auth.password = bcrypt.hashSync(obj.auth.password, this._salt);
        return super.updateById(id, obj, fields);
    }

    public async findByEmail(email: string, fields = "auth"): Promise<User | null> {
        const result = await this._model.findOne({ email }, fields);

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
                    { useName: { $regex: search, $options: "i" } },
                    { firstName: { $regex: search, $options: "i" } },
                    { lastName: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } }
                ]
            });
        const users = await this._model.find(query, undefined, { skip: page * size, limit: size });

        return users.map((user) => new User(user.toObject()));
    }

    public async updateAvatar(userId: ObjectId, avatar: string): Promise<void> {
        await this._model.findByIdAndUpdate(userId, { avatar });
    }

}