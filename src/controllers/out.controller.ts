import express from 'express';
import { Request, Response } from 'express';
import IControllerBase from '../interfaces/icontrollerbase.interface';
import { arRequestService } from '../services/arRequest';
import TransactionService from '../services/transaction';
import { TermModel } from '../models/term.model';
import { TransactionModel } from '../models/transaction.model';
import { ExternalModel, DBExternalType } from '../models/external.model';

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

        let external;

        if(req.query.t) {
            const term = await TermModel.findOne({_id: req.query.t});
            if(term) {
                const transaction = await TransactionModel.findOne({id: (txid || source)});
                if(transaction) {
                    external = await ExternalModel.create({
                        term,
                        transaction
                    });
                }
            }
        }

        if(source && source.length) {
            const r = await TransactionService.search(source.toString(), 0, 1, ['txid']);
            
            // Count stats for permaweb
            if(external) {
                external.linkType = DBExternalType.SOURCEWEB;
                await external.save();
            }

            return res.redirect(r.hits[0]['_source'].tags['page:url']);
        } else if(txid && txid.length) {
            // Count stats for source
            if(external) {
                external.linkType = DBExternalType.PERMAWEB;
                await external.save();
            }

            return res.redirect(`${arRequestService.mainPeer}/${txid}`);
        }

        res.redirect('/');
    }
}

export default OutController;