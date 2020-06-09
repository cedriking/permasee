# PermaSee
[PermaSee](https://permasee.com) is a [permaweb](https://arweave.org) search engine. Search for all the decentralized and permanent data storage for either archived or deployed webpages to Arweave!

To run your own instance of PermaSee you need to have Node.JS, Mongo, and Redis installed on your server.

### Environment variables
```env
MONGO_URL=<mongodb url>
ARWEAVE_NODE_URL=<arweave node url>
REDIS_URL=<redis caching, optional, fallback to memory cache>
POOL_THREADS=<number, amount of threads to run to get blocks and transactions>
SENTRY_URL=<optional, Node.JS sentry errors>
ACKEE_DOMAIN=<optional, ackee stats domain>
ACKEE_DOMAIN_ID=<optional, domain ID from ackee settings>
```