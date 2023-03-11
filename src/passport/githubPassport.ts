import { MongooseError } from "mongoose";
import passport from "passport";
import { Profile, Strategy } from "passport-github2";
import { VerifyCallback, VerifyFunction } from "passport-oauth2";
import { env, nextTick } from "process";

import User from "@classes/user";
import UserSchema from "@schemas/userSchema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/naming-convention
const loginAuthentification: VerifyFunction = async (_accessToken: string, _refreshToken: string, profile: Profile & { _json: any }, done: VerifyCallback) => {
    if (!profile._json.email)
        return done(null, undefined, { message: "Github email not found" });
    const userSchema = new UserSchema();
    const user = await userSchema.findByEmail(profile._json.email);

    try {
        if (!user?._id)
            return done(null, undefined, { message: "Invalid user id" });
        if (!user.auth?.sources.github)
            userSchema.updateById(user._id, {
                auth: {
                    ...user.auth,
                    sources: {
                        ...user.auth?.sources,
                        github: true
                    }
                }
            });

        done(null, { _id: user._id });
    } catch (error) {
        done(error as Error);
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/naming-convention
const registerAuthentification: VerifyFunction = async (_accessToken: string, _refreshToken: string, profile: Profile & { _json: any }, done: VerifyCallback) => {
    if (!profile._json.email)
        return done(null, undefined, { message: "Github email not found" });

    try {
        const names = (profile._json.name as string).split(" ");
        const user = await new UserSchema().add(new User({
            useName: profile.displayName,
            firstName: names[0] || profile.name?.givenName,
            lastName: (names.length === 2 ? names[1] : names[3]) || profile.name?.familyName,
            email: profile._json.email || (profile.emails ? profile.emails[0].value : undefined),
            avatar: profile._json.avatar_url || (profile.photos ? profile.photos[0].value : undefined),
            auth: {
                sources: {
                    github: true
                }
            }
        }));

        done(null, { _id: user._id });
    } catch (error) {
        if ((error as MongooseError & { code?: number }).code === 11000)
            done(null, undefined, { message: "User already exists" });
        done(error as Error);
    }
};

nextTick(() => {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET)
        throw new Error("Invalid github config");

    passport.use("github-login", new Strategy({
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: "/auth/github/callback/login",
        scope: ["user:email"]
    }, loginAuthentification));
    passport.use("github-register", new Strategy({
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: "/auth/github/callback/register",
        scope: ["user:email"]
    }, registerAuthentification));
});