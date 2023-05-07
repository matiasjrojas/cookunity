const AWS = require('aws-sdk');
const { upsert, getItemById, getLongestDistance, getMostTraced } = require("./dynamodb");
const { region } = require("./config.json");
const dynamodb = new AWS.DynamoDB({ region: region });

async function trace(message) {
    let statistic = await getItemById(message.country);
    message.distance = parseFloat(message.distance);
    let data;
    if (statistic == null) {
        data = { distance: message.distance, traced: 1 };
    } else {
        data = statistic.data;
        if (data.distance < message.distance) {
            data.distance = message.distance;
        }
        data.traced += 1;
    }
    upsert(message.country, data);
}

async function statistics() {
    const longestDistance = await getLongestDistance();
    const mostTraced = await getMostTraced();

    const data = {
        "longest_distance": {
            "country": longestDistance ? longestDistance.country : null,
            "value": longestDistance ? longestDistance.data.distance : null
        },
        "most_traced": {
            "country": mostTraced ? mostTraced.country : null,
            "value": mostTraced ? mostTraced.data.traced : null
        }
    };

    console.log(data);

    return data;
}

module.exports = { trace, statistics }