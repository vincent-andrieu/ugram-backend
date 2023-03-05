import passport from "passport";
import { Strategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { env, nextTick } from "process";

import User from "@classes/user";
import UserSchema from "@schemas/userSchema";

async function loginAuthentification(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    if (!profile._json.email)
        return done("Google email not found");
    const userSchema = new UserSchema();
    const user = await userSchema.findByEmail(profile._json.email);

    try {
        if (!user?._id)
            return done(null, undefined, { message: "Invalid user id" });
        if (!user.auth?.sources.google)
            userSchema.updateById(user._id, {
                auth: {
                    ...user.auth,
                    sources: {
                        ...user.auth?.sources,
                        google: true
                    }
                }
            });

        done(null, { _id: user._id });
    } catch (error) {
        done(error as Error);
    }
}

async function registerAuthentification(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    if (!profile._json.email)
        return done("Google email not found");

    try {
        if (!profile._json.email_verified || profile._json.email_verified === "false")
            return done(null, undefined, { message: "Google account not verified" });
        const user = await new UserSchema().add(new User({
            useName: profile.displayName,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            email: profile._json.email,
            avatar: profile._json.picture,
            auth: {
                sources: {
                    google: true
                }
            }
        }));

        done(null, { _id: user._id });
    } catch (error) {
        done(error as Error);
    }
}

nextTick(() => {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET)
        throw new Error("Invalid google config");

    passport.use("google-login", new Strategy({
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/login/callback",
        scope: ["email", "profile"]
    }, loginAuthentification));
    passport.use("google-register", new Strategy({
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/register/callback",
        scope: ["email", "profile"]
    }, registerAuthentification));
});