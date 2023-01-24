import bcrypt from "bcryptjs";
import { Request } from "express";
import passport from "passport";
import { IVerifyOptions, Strategy, VerifyFunctionWithRequest } from "passport-local";

import User from "@classes/user";
import UserSchema from "@schemas/userSchema";

const checkAuthentification: VerifyFunctionWithRequest = async (request: Request, email: string, password: string, done: (error: Error | null, user?: Express.User, options?: IVerifyOptions) => void) => {
    const userSchema = new UserSchema();

    if (!request.body.firstName || !request.body.lastName) {
        const user = await userSchema.findByEmail(email);

        if (!user?._id || !user.auth?.password || !bcrypt.compareSync(password, user.auth.password))
            return done(new Error("Invalid credentials"));

        done(null, { _id: user._id });
    } else {
        const user = await userSchema.add(new User({
            firstName: request.body.firstName,
            lastName: request.body.lastName,
            email: email,
            auth: {
                password: password,
                sources: {
                    local: true
                }
            }
        }));

        done(null, { _id: user._id });
    }
};

passport.use("local", new Strategy({
    usernameField: "email",
    passwordField: "password",
    session: true,
    passReqToCallback: true
}, checkAuthentification));