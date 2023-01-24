import { NonFunctionProperties } from "../utils";
import TemplateObject from "./templateObject";

export default class User extends TemplateObject {
    useName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string; // Base64 image or url
    phone?: string;
    registrationDate?: Date;
    auth?: {
        password?: string;
        sources: {
            local?: boolean;
            discord?: boolean;
            github?: boolean;
        };
    };

    constructor(user: NonFunctionProperties<User>) {
        super(user);

        this.useName = user.useName;
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.email = user.email;
        this.avatar = user.avatar;
        this.phone = user.phone;
        this.registrationDate = user.registrationDate;

        // Auth
        if (user.auth) {
            this.auth = {
                sources: {
                    local: user.auth.sources.local || false,
                    discord: user.auth.sources.discord || false,
                    github: user.auth.sources.github || false
                }
            };
            this.auth.password = user.auth.password;
        }

        this._validation();
    }

    protected _validation() {
        if (this.useName && typeof this.useName !== "string")
            throw new Error("Invalid useName");
        if (this.firstName && (typeof this.firstName !== "string" || this.firstName.length === 0))
            throw new Error("Invalid firstName");
        if (this.lastName && (typeof this.lastName !== "string" || this.lastName.length === 0))
            throw new Error("Invalid lastName");
        if (this.email && (typeof this.email !== "string" || !RegExp(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/).test(this.email)))
            throw new Error("Invalid email");
        if (this.avatar && (typeof this.avatar !== "string" || (!RegExp(/^data:image\/(png|jpg|jpeg);base64,/).test(this.avatar) && !this.avatar.startsWith("https://"))))
            throw new Error("Invalid avatar");
        if (this.phone && (typeof this.phone !== "string" || !RegExp(/^\+?[0-9]+$/).test(this.phone)))
            throw new Error("Invalid phone");
        if (this.registrationDate && (!(this.registrationDate instanceof Date) || this.registrationDate.getTime() > Date.now()))
            throw new Error("Invalid registrationDate");

        // Auth
        if (this.auth)
            if (this.auth.password && (typeof this.auth.password !== "string" || this.auth.password.length < 5))
                throw new Error("Invalid password");
    }

}