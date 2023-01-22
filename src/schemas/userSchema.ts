import mongoose from "mongoose";

import User from "@classes/user";
import TemplateSchema from "./templateSchema";

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

}