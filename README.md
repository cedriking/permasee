# PermaSE
PermaSE is a [permaweb](https://arweave.org) search engine. Search for all the decentralized and permanent data storage for either archived or deployed webpages to Arweave!

### Environment variables
```env
MONGO_URL=<mongodb url>
ELASTICSEARCH_HOSTS=<elasticsearch url>
ARWEAVE_NODE_URL=<arweave node url>
REDIS_URL=<redis caching, optional, fallback to memory cache>
POOL_THREADS=<number, amount of threads to run to get blocks and transactions>
```