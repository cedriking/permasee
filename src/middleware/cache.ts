import { Request, Response, NextFunction } from 'express';
import RedisCache from 'node-cache-redis';
import MemoryCache from 'memory-cache';

export class Cache {
    private isRedis: boolean = false;
    private _client: any;
    private ttl: number;

    public get client() {
        return this._client;
    }

    constructor(ttl: number = (60*5), purge: number = (60*30)) {
        this.ttl = ttl;

        this._client = new RedisCache({
            name: 'CacheService',
            redisOptions: {
                url: process.env.REDIS_URL
            },
            ttlInSeconds: ttl
        });

        this._client.store.ping().then(() => {
            // this._client.deleteAll(); // flush stored data, testing only
            this.isRedis = true;
        }).catch(e => {
            this._client = MemoryCache;
            // this._client.clear();
            this.isRedis = false;
        });
    }

    async set(key: string, data: any, ttl: number = 0): Promise<boolean> {
        const tmpTtl = ttl || this.ttl;
        if(this.isRedis) {
            return await this._client.set(key, data, tmpTtl);
        } 

        return this._client.put(key, data, tmpTtl * 1000);
    }

    async get(key: string): Promise<any> {
        if(this.isRedis) {
            return await this._client.get(key);
        }

        return this._client.get(key);
    }
}

const cache = new Cache(60 * 60);
const cacheMiddleware = (ttl: number) => async (req: Request, res: Response, next: NextFunction) => {
    let key = `__express__${req.originalUrl}` || req.url;
    try {
        const data = await cache.get(key);
        if(data && data.length) {
            return res.send(data);
        }
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