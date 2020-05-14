import { Request, Response, NextFunction } from 'express';
import memored from 'memored';
import RedisCache from 'node-cache-redis';

export class Cache {
    private isRedis: boolean = false;
    private _client: any;
    private ttl: number;

    public get client() {
        return this._client;
    }

    constructor(ttl: number = (60*5)) {
        this.ttl = ttl;

        try {
            this._client = new RedisCache({
                redisOptions: {
                    url: process.env.REDIS_URL
                }
            });
            this._client.deleteAll();
            this.isRedis = true;
        } catch(e) {
            this._client = memored;
            //this._client.setup({ purgeInterval: (1000*60*60)});
            this.isRedis = false;
            console.log(e);
        }
    }

    async set(key: string, data: any, ttl: number = 0): Promise<boolean> {
        const tmpTtl = (ttl || this.ttl) * 1000;
        if(this.isRedis) {
            return await this._client.set(key, data, tmpTtl);
        } 
        
        return new Promise((resolve, reject) => {
            this._client.store(key, data, tmpTtl, (err) => {
                if(err) {
                    return reject(err);
                }

                return resolve(data);
            });
        });
    }

    async get(key: string): Promise<any> {
        if(this.isRedis) {
            return await this._client.get(key);
        }
        return new Promise((resolve, reject) => {
            this._client.read(key, (err, data) => {
                if(err || !data || !data.length) return reject(err);

                return data;
            });
        });
    }
}

const cache = new Cache(60 * 60);
const cacheMiddleware = (ttl: number) => async (req: Request, res: Response, next: NextFunction) => {
    let key = `__express__${req.originalUrl}` || req.url;
    try {
        return res.send(await cache.get(key));
    } catch(e) {
        console.log(e);
    }

    // @ts-ignore
    res.sendResponse = res.send;
    // @ts-ignore
    res.send = async (body) => {
        try {
            await cache.set(key, body);
        } catch(e) {
            console.log(e);
        }
        
        // @ts-ignore
        res.sendResponse(body);
    }
    next();
};

export default cacheMiddleware