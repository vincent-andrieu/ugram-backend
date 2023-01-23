import UserSchema from "@schemas/userSchema";
import AuthService from "@services/authService";
import passport from "passport";

passport.serializeUser<string>((user: Express.User, done) => { // user is a User class
    try {
        const token = new AuthService().signToken(user.data);

        done(null, token);
    }  catch (error) {
        done(error);
    }
});

passport.deserializeUser<string>(async (token, done) => {
    try {
        const user = new AuthService().decodeJwt(token);
        const userSchema = new UserSchema();

        if (await userSchema.exist(user.data.userId))
            done(null, user);
    } catch(error) {
        done(error);
    }
});