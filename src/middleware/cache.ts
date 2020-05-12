import { Request, Response, NextFunction } from 'express';
import mcache from 'memory-cache';

const cacheMiddleware = (ttl: number) => (req: Request, res: Response, next: NextFunction) => {
    let key = `__express__${req.originalUrl}` || req.url;
    let cachedBody = mcache.get(key);
    if(cachedBody) {
        return res.send(cachedBody);
    }

    // @ts-ignore
    res.sendResponse = res.send;
    // @ts-ignore
    res.send = (body) => {
        mcache.put(key, body, ttl * 1000);
        // @ts-ignore
        res.sendResponse(body);
    }
    next();
};

export default cacheMiddleware