const http = require('http');
const express = require('express');
const getTrace = require('./traces');
const { statistics } = require("./statistics")
const consume = require('./kinesis-consumer')
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.post('/traces', (req, res) => {
    const { ip } = req.body;

    if (!ip) {
        res.status(400).send('Invalid request body: IP address is missing');
        return;
    }

    return getTrace(req, res);
});

app.get('/statistics', async (req, res) => {
    res.send(await statistics());
});

if (require.main === module) {
    var server = http.createServer(app);
    server.listen(process.env.PORT || 3000, () => {
        console.log("Listening on %j", server.address());
    });

    function startConsumer(attempts = 1) {
        consume().catch((err) => {
            console.error(`Failed to consume messages from Kinesis: ${err}`);
            if (attempts < 10) {
                console.error(`Retrying in 5 seconds... (attempt ${attempts + 1})`);
                setTimeout(() => startConsumer(attempts + 1), 5000);
            } else {
                console.error('Maximum number of attempts reached. Exiting...');
                process.exit(1);
            }
        });
    }
    startConsumer();
}
