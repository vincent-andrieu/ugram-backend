import { isObjectId, ObjectId, toObjectId } from "../utils";

export default abstract class TemplateObject {
    public _id?: ObjectId;

    constructor(obj: { _id?: ObjectId }) {
        if (obj._id)
            this._id = toObjectId(obj._id);

        this._objectValidation();
    }

    private _objectValidation() {
        if (this._id && !isObjectId(this._id))
            throw new Error("Invalid id");
    }

    protected abstract _validation(): void | never;
}