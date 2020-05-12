import { Request, Response, NextFunction } from 'express';
import mcache from 'memory-cache';
import RedisCache from 'node-cache-redis';

let client = null;
try {
    client = new RedisCache({
        redisOptions: {
            url: process.env.REDIS_URL
        }
    });
    client.deleteAll();
} catch(e) {
    console.log(e);
}

const cacheMiddleware = (ttl: number) => async (req: Request, res: Response, next: NextFunction) => {
    let key = `__express__${req.originalUrl}` || req.url;
    let cachedBody = null;
    try {
        cachedBody = await client.get(key);
    } catch(e) {
        console.log(e);
        cachedBody = mcache.get(key);
    }

    if(cachedBody) {
        return res.send(cachedBody);
    }

    // @ts-ignore
    res.sendResponse = res.send;
    // @ts-ignore
    res.send = async (body) => {
        try {
            await client.set(key, body, ttl);
        } catch(e) {
            console.log(e);
            mcache.put(key, body, (ttl * 1000));
        }
        
        // @ts-ignore
        res.sendResponse(body);
    }
    next();
};

export default cacheMiddleware