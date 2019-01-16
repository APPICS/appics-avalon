logr = require('./logger.js');
http = require('./http.js')
p2p = require('./p2p.js')
mongo = require('./mongo.js')
chain = require('./chain.js')
transaction = require('./transaction.js')

// Suggested prefixing:
// 1st char: 0 = testnet, 1= production
// 2nd char: network id. 0= generic avalon, D= dtube, A= appics
originHash = "0A00000000000000000000000000000000000000000000000000000000000000"

// init the database and load most recent blocks in memory directly
mongo.init(function() {
    mongo.fillInMemoryBlocks(function() {
        logr.info('#' + chain.getLatestBlock()._id + ' is the latest block in our db')
        
        // start miner schedule
        db.collection('blocks').findOne({_id: chain.getLatestBlock()._id - (chain.getLatestBlock()._id%20)}, function(err, block) {
            if (err) throw err;
            chain.minerSchedule(block, function(minerSchedule) {
                chain.schedule = minerSchedule
            })
        })

        // start the http server
        http.init()
        // start the websocket server
        p2p.init()
        // and connect to peers
        p2p.connect(process.env.PEERS ? process.env.PEERS.split(',') : [])
    })
});

process.on('SIGINT', function() {
    if (typeof closing !== 'undefined') return
    closing = true
    logr.warn('Waiting 3 secs before shut down...')
    chain.shuttingDown = true
    setTimeout(function() {
        logr.trace('Avalon exitted safely')
        process.exit(0)
    }, 3000);
});