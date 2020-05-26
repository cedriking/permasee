import express from 'express';
import { Request, Response } from 'express';
import IControllerBase from '../interfaces/icontrollerbase.interface';
import moment from 'moment';
import TransactionService from '../services/transaction';
import { PoolService } from '../services/pool';
import { TransactionModel } from '../models/transaction.model';
import { GrabberStatsModel } from '../models/grabber.model';
import CacheService from '../services/cache';
import { SearchModel } from '../models/search.model';
import { TermModel, DBTerm } from '../models/term.model';

moment.locale();

class HomeController implements IControllerBase {
    public path = '/';
    public router = express.Router();
    private cache: CacheService;

    constructor() {
        this.initRoutes();
        this.cache = new CacheService(60*10);
    }

    public initRoutes() {
        this.router.get('/', (req: Request, res: Response) => {
            this.index(req, res);
        });
    }

    async index(req: Request, res: Response) {
        let render = await this.cache.get(req.url);
        let isCached = false;
        if(render) {
            isCached = true;
        } else {
            render = {};
        }

        const rendering = render;
        rendering['darkmodeCSS'] = await this.setTheme(req);
        if(rendering['darkmodeCSS']) {
            res.cookie('theme', 'dark');
        } else {
            res.clearCookie('theme');
        }

        if(isCached) {
            return res.render('home/index', rendering);
        }

        if(req.query && req.query.search) {
            const term = req.query.search.toString();
            rendering['searchTerm'] = term;

            // Save search term
            let searchTerm = await TermModel.findOne({ term });
            if(!searchTerm) {
                searchTerm = await TermModel.create({ term });
                await searchTerm.save();
            }
            rendering['searchTermId'] = searchTerm._id;

            // Do search and add to rendering
            const searchResult = await this.search(term, searchTerm);
            rendering['searchResult'] = searchResult;
        }

        const grabberStats = await GrabberStatsModel.findOne({});
        rendering['currentBlock'] = grabberStats.currentBlock;
        rendering['moment'] = moment;

        res.render('home/index', rendering);
    }

    async setTheme(req: Request) {
        const darkmodeCSS = `
        :root {
          --global-font-size: 15px;
          --global-line-height: 1.4em;
          --global-space: 10px;
          --font-stack: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace,
            serif;
          --mono-font-stack: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace,
            serif;
          --background-color: #222225;
          --page-width: 60em;
          --font-color: #e8e9ed;
          --invert-font-color: #222225;
          --secondary-color: #a3abba;
          --tertiary-color: #a3abba;
          --primary-color: #62c4ff;
          --error-color: #ff3c74;
          --progress-bar-background: #3f3f44;
          --progress-bar-fill: #62c4ff;
          --code-bg-color: #3f3f44;
          --input-style: solid;
          --display-h1-decoration: none;
        }
        `;
        let updatedTheme = false;

        if(req.query && req.query.theme) {
            updatedTheme = true;
            if(req.query.theme === 'dark'){
                return darkmodeCSS;
            }
        }

        if(!updatedTheme && req.cookies.theme) {
            if(req.cookies.theme === 'dark') {
                return darkmodeCSS;
            }
        }

        return false;
    }

    async search(term: string, searchTerm: DBTerm, page: number = 0) {
        const dbSearch = await SearchModel.create({ term: searchTerm });
        await dbSearch.save();

        const res = await TransactionService.search(term, page, 25);
        const pool = new PoolService();

        console.log(res, res.length);

        for(let i = 0, j = res.length; i < j; i++) {
            pool.add(async () => {
                res.tags = JSON.parse(res[i].tags);
                return { es: res[i], tx: res[i] };
            });
        }

        return pool.run(10);
    }
}

export default HomeController;