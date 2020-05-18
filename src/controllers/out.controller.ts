import express from 'express';
import { Request, Response } from 'express';
import IControllerBase from '../interfaces/icontrollerbase.interface';
import { arRequestService } from '../services/arRequest';
import TransactionService from '../services/transaction';

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

        if(source && source.length) {
            // TODO: count stats for permaweb
            const r = await TransactionService.search(source.toString(), 0, 1, ['txid']);
            console.log(r.hits[0]['_source'].tags['page:url']);
            return res.redirect(r.hits[0]['_source'].tags['page:url']);
        } else if(txid && txid.length) {
            // TODO: count stats for source
            return res.redirect(`${arRequestService.mainPeer}/${txid}`);
        }

        res.redirect('/');
    }
}

export default OutController;