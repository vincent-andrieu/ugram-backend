import User from "@classes/user";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "process";
import bcrypt from "bcryptjs";

import { ObjectId, toObjectId } from "../utils";

export interface JwtData {
    userId: ObjectId;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface User extends JwtPayload {
            data: JwtData;
        }
    }
}

export default class AuthService {
    private readonly _jwtSecret: string;

    constructor() {
        if (!env.JWT_SECRET)
            throw "Undefined JWT secret";
        this._jwtSecret = env.JWT_SECRET;
    }

    public signToken(data: JwtData): string {
        if (!data.userId)
            throw new Error("Undefined user id");
        return jwt.sign(
            { data },
            this._jwtSecret,
            {
                expiresIn: "7d"
            }
        );
    }

    public isUserPasswordValid(user: User, password: string): boolean {
        return !!user.auth?.password && bcrypt.compareSync(password, user.auth.password);
    }

    public decodeJwt(token: string): Express.User {
        if (!token || token.length === 0)
            throw "Undefined JWT token";
        const decoded = jwt.verify(token, this._jwtSecret);

        if (typeof decoded === "string" || !decoded.data)
            throw "Fail to decode access token";
        decoded.data.userId = toObjectId(decoded.data.userId);
        return decoded as Express.User;
    }

}