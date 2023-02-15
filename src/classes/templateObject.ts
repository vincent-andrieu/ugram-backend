import { isObjectId, ObjectId } from "../utils";

export default abstract class TemplateObject {
    public _id?: ObjectId;

    constructor(obj: { _id?: ObjectId }) {
        this._id = obj._id;

        this._objectValidation();
    }

    private _objectValidation() {
        if (this._id && !isObjectId(this._id))
            throw new Error("Invalid id");
    }

    protected abstract _validation(): void | never;
}