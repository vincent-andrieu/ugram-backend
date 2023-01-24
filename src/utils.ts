import * as mongoose from "mongoose";

export type NonFunctionPropertyNames<T> = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export type ObjectId = mongoose.Types.ObjectId;
// export const ObjectId = mongoose.Types.ObjectId;

export function toObjectId(id: ObjectId | string) {
    if (typeof id === "string")
        return new mongoose.Types.ObjectId(id);
    return id;
}

export function isObjectId(id: Parameters<typeof mongoose.Types.ObjectId.isValid>[0]) {
    return mongoose.Types.ObjectId.isValid(id);
}