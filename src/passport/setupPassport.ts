import passport from "passport";

import UserSchema from "@schemas/userSchema";
import { ObjectId } from "../utils";

passport.serializeUser<ObjectId>((user: Express.User, done) => {
    done(null, user._id);
});

passport.deserializeUser<ObjectId>(async (userId, done) => {
    try {
        const user = await new UserSchema().get(userId);

        done(null, user);
    } catch(error) {
        done(error);
    }
});