import es from 'elasticsearch';

const esClient = new es.Client({
    host: process.env.ELASTICSEARCH_HOSTS,
    log: 'error'
});

esClient.ping({
    requestTimeout: 30000,
}, function(error) {
// at this point, eastic search is down, please check your Elasticsearch service
    if (error) {
        console.error('Elasticsearch cluster is down!');
    }
});

esClient.indices.create({
    index: 'transactions'
}, function(error, response, status) {
    if (!error) {
        console.log("created a new index", response);
    }
});

export default esClient;