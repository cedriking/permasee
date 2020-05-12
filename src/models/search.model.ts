import { Typegoose, prop, Ref } from "@hasezoey/typegoose";
import { IDomain } from './domain.model';

export class ISearch extends Typegoose {
    @prop({required: true, trim: true, lowercase: true, index: true})
    name: string;

    @prop({required: true, ref: IDomain})
    domain: Ref<IDomain>;

    @prop({required: true, default: Date.now})
    createdAt: Date;
}