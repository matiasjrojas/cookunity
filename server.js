const getTrace = require ('./traces');
const http = require('http');
const express = require('express');
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


if (require.main === module) {
    var server = http.createServer(app);
    server.listen(process.env.PORT || 3000, () => {
        console.log("Listening on %j", server.address());
    });
}
