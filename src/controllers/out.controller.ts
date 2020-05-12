import * as express from 'express';
import { Request, Response } from 'express';
import IControllerBase from '../interfaces/icontrollerbase.interface';
import moment from 'moment';
import fs from 'fs';
import TransactionService from '../services/transaction';
import { PoolService } from '../services/pool';
import { TransactionModel } from '../models/transaction.model';
import { GrabberStatsModel } from '../models/grabber.model';

moment.locale();

class OutController implements IControllerBase {
    public path = '/out';
    public router = express.Router();

    constructor() {
        this.initRoutes();
    }

    public initRoutes() {
        this.router.get('/', (req: Request, res: Response) => {
            this.index(req, res);
        });
    }

    async index(req: Request, res: Response) {
        const txid = req.query && req.query.id;
        const source = req.query && req.query.source;

        console.log(txid, source);
        if(source && source.length) {
            // TODO: count stats for permaweb
            res.redirect(source.toString());
        } else {
            // TODO: count stats for source
            res.redirect(`${process.env.ARWEAVE_NODE_URL}/${txid}`);
        }

        res.redirect('/');
    }
}

export default OutController;