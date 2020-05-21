import { Typegoose, prop, instanceMethod, InstanceType } from "@hasezoey/typegoose";

export class DBTerm extends Typegoose {
    @prop({required: true, trim: true, lowercase: true, index: true, unique: true})
    term: string;

    @prop({default: Date.now})
    createdAt: Date;
}

export const TermModel = new DBTerm().getModelForClass(DBTerm);