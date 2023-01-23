import passport from "passport";
import { IVerifyOptions, Strategy, VerifyFunction } from "passport-local";

import UserSchema from "@schemas/userSchema";
import AuthService from "@services/authService";

const successfullyAuthentificated: VerifyFunction = async (email: string, password: string, done: (error: Error | null, user?: Express.User, options?: IVerifyOptions) => void) => {
    const authService = new AuthService();
    const userSchema = new UserSchema();
    const user = await userSchema.findByEmail(email);

    if (!user?._id || !authService.isUserPasswordValid(user, password))
        return done(new Error("Invalid credentials"));

    done(null, {
        data: {
            userId: user._id
        }
    });
};

passport.use("local", new Strategy(
    {
        passReqToCallback: false
    },
    successfullyAuthentificated
));