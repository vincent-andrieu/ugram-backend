import bcrypt from "bcryptjs";
import { Request } from "express";
import { MongooseError } from "mongoose";
import passport from "passport";
import { IVerifyOptions, Strategy, VerifyFunction, VerifyFunctionWithRequest } from "passport-local";

import User from "@classes/user";
import UserSchema from "@schemas/userSchema";

const loginAuthentification: VerifyFunction = async (email: string, password: string, done: (error: Error | null, user?: Express.User, options?: IVerifyOptions) => void) => {
    const user = await new UserSchema().findByEmail(email, "auth firstName lastName");

    if (!user?._id || !user.auth?.password || !bcrypt.compareSync(password, user.auth.password))
        return done(null, undefined, { message: "Invalid credentials" });
    done(null, { _id: user._id });
};

const registerAuthentification: VerifyFunctionWithRequest = async (request: Request, email: string, password: string, done: (error: Error | null, user?: Express.User, options?: IVerifyOptions) => void) => {
    try {
        if ((!request.body.firstName && !request.query.firstName) || (!request.body.lastName && !request.query.lastName) || !password)
            return done(null, undefined, { message: "Invalid parameters" });
        const user = await new UserSchema().add(new User({
            firstName: request.body.firstName || request.query.firstName,
            lastName: request.body.lastName || request.query.lastName,
            email: email,
            auth: {
                password: password,
                sources: {
                    local: true
                }
            }
        }));

        done(null, { _id: user._id });
    } catch (error) {
        if ((error as MongooseError & { code?: number }).code === 11000)
            done(null, undefined, { message: "User already exists" });
        else
            done(error as Error);
    }
};

passport.use("local-login", new Strategy({
    usernameField: "email",
    passwordField: "password",
    session: true,
    passReqToCallback: false
}, loginAuthentification));
passport.use("local-register", new Strategy({
    usernameField: "email",
    passwordField: "password",
    session: true,
    passReqToCallback: true
}, registerAuthentification));