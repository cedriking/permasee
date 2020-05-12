import { Typegoose, prop, Ref } from "@hasezoey/typegoose";

export class IDomain extends Typegoose {
    @prop({required: true, trim: true, lowercase: true, unique: true})
    name: string;

    @prop({required: true, default: Date.now})
    createdAt: Date;
}

export const DomainModel = new IDomain().getModelForClass(IDomain);