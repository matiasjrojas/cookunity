const AWS = require('aws-sdk');
const { fromIni } = require("@aws-sdk/credential-provider-ini");
const { Kinesis } = require("@aws-sdk/client-kinesis");
const { region } = require("./config.json");
const { trace } = require("./statistics");

const credentials = fromIni({ profile: "default" });
const kinesis = new Kinesis({ credentials, region: region });

const streamName = "cookunity";

//consume the latest message from kinesis data stream
//one thread for each shard
async function consume() {
    const describeStreamResponse = await kinesis.describeStream({ StreamName: streamName });
    const shards = describeStreamResponse.StreamDescription.Shards;
    const shardThreads = [];

    // Create a thread for each shard
    for (const shard of shards) {
        const shardThread = {
            shardId: shard.ShardId,
            shardIterator: null,
            noNewRecordsCount: 0,
            isRunning: true,
        };
        shardThreads.push(shardThread);

        //get the shardIterator for reading from the last consumed record
        const shardIteratorResponse = await kinesis.getShardIterator({
            ShardId: shardThread.shardId,
            ShardIteratorType: 'LATEST',
            StreamName: streamName,
        });
        shardThread.shardIterator = shardIteratorResponse.ShardIterator;

        // continuous loop for new records
        (async () => {
            while (shardThread.isRunning) {
                const getRecordsResponse = await kinesis.getRecords({ ShardIterator: shardThread.shardIterator });
                const records = getRecordsResponse.Records;

                if (records.length > 0) {
                    console.log(`Se recibieron ${records.length} nuevos registros en shard ${shardThread.shardId}:`);
                    shardThread.noNewRecordsCount = 0;
                    for (const record of records) {
                        const message = JSON.parse(Buffer.from(record.Data).toString());
                        trace(message);
                    }
                } else {
                    shardThread.noNewRecordsCount++;
                }

                shardThread.shardIterator = getRecordsResponse.NextShardIterator;

                //check new messages every 1 sec
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        })();
    }
}

module.exports = consume;