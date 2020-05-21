import { Typegoose, prop, Ref } from "@hasezoey/typegoose";
import { DBTerm } from "./term.model";

export class DBSearch extends Typegoose {
    @prop({ref: DBTerm, required: true})
    term!: Ref<DBTerm>;

    @prop({default: Date.now})
    createdAt: Date;
}

export const SearchModel = new DBSearch().getModelForClass(DBSearch);