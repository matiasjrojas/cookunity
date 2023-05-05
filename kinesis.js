const { fromIni } = require("@aws-sdk/credential-provider-ini");
const { Kinesis } = require("@aws-sdk/client-kinesis");
const { region } = require("./config.json");

const credentials = fromIni({ profile: "default" });
const kinesis = new Kinesis({ credentials, region: region });
const streamName = "cookunity";

function putRecord(data) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));

    const record = {
        Data: encodedData,
        PartitionKey: '1'
    };

    kinesis.putRecord({
        Data: record.Data,
        PartitionKey: record.PartitionKey,
        StreamName: streamName
    }, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log(`Data sent to Kinesis: ${data.message}`);
        }
    });
}

async function getRecords() {
    const params = {
        ShardIteratorType: "TRIM_HORIZON",
        StreamName: streamName,
        ShardId: "shardId-000000000003", // ID del shard del stream
    };

    const iterator = await kinesis.getShardIterator(params).catch((err) => {
        console.error(err);
    });

    const shardIterator = iterator.ShardIterator;

    const records = await kinesis.getRecords({ ShardIterator: shardIterator });

    const messages = [];
    for (const key in records.Records) {
        messages.push(JSON.parse(Buffer.from(records.Records[key].Data).toString()));
    }

    return messages;
}

module.exports = { putRecord, getRecords };

