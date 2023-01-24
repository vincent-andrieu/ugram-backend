import { Scope } from "@oauth-everything/passport-discord";
import passport from "passport";
import { Profile, Strategy } from "passport-discord";
import { VerifyCallback } from "passport-oauth2";
import { env } from "process";

import User from "@classes/user";
import UserSchema from "@schemas/userSchema";

async function checkAuthentification(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    if (!profile.email)
        return done(new Error("Discord email not found"));
    const userSchema = new UserSchema();
    const user = await userSchema.findByEmail(profile.email);

    if (user) {
        if (!user._id)
            return done(new Error("Invalid user id"));
        if (!user.auth?.sources.discord)
            userSchema.updateById(user._id, { auth: { sources: { discord: true } } }, "auth.sources.discord");

        done(null, { _id: user._id });
    } else {
        if (!profile.verified)
            return done (new Error("Discord account not verified"));
        const newUser = await userSchema.add(new User({
            useName: profile.displayName || profile.username,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            email: profile.email,
            avatar: profile.avatar || undefined,
            auth: {
                sources: {
                    discord: true
                }
            }
        }));

        done(null, { _id: newUser._id });
    }
}

if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET)
    throw new Error("Invalid discord config");

passport.use("discord", new Strategy({
    clientID: env.DISCORD_CLIENT_ID,
    clientSecret: env.DISCORD_CLIENT_SECRET,
    callbackURL: "/auth/discord/callback",
    scope: [Scope.IDENTIFY, Scope.EMAIL]
}, checkAuthentification));