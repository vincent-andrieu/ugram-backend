import passport from "passport";
import { Profile, Strategy } from "passport-github2";
import { VerifyCallback, VerifyFunction } from "passport-oauth2";
import { env, nextTick } from "process";

import User from "@classes/user";
import UserSchema from "@schemas/userSchema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/naming-convention
const checkAuthentification: VerifyFunction = async (_accessToken: string, _refreshToken: string, profile: Profile & { _json: any }, done: VerifyCallback) => {
    if (!profile._json.email)
        return done(new Error("Github email not found"));
    const userSchema = new UserSchema();
    const user = await userSchema.findByEmail(profile._json.email);

    if (user) {
        if (!user._id)
            return done(new Error("Invalid user id"));
        if (!user.auth?.sources.github)
            userSchema.updateById(user._id, { auth: { sources: { github: true } } }, "auth.sources.github");

        done(null, { _id: user._id });
    } else {
        const newUser = await userSchema.add(new User({
            useName: profile.displayName || profile.username || profile._json.login,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            email: profile._json.email || (profile.emails ? profile.emails[0].value : undefined),
            avatar: profile.photos ? profile.photos[0].value : undefined,
            auth: {
                sources: {
                    github: true
                }
            }
        }));

        done(null, { _id: newUser._id });
    }
};

nextTick(() => {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET)
        throw new Error("Invalid github config");

    passport.use("github", new Strategy({
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: "/auth/github/callback",
        scope: ["user:email"]
    }, checkAuthentification));
});