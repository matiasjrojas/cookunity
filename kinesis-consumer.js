const AWS = require('aws-sdk');
const { fromIni } = require("@aws-sdk/credential-provider-ini");
const { Kinesis } = require("@aws-sdk/client-kinesis");
const { region } = require("./config.json");

const credentials = fromIni({ profile: "default" });
const kinesis = new Kinesis({ credentials, region: region });

const streamName = "cookunity";

async function consume() {
    const describeStreamResponse = await kinesis.describeStream({ StreamName: streamName });
    const shards = describeStreamResponse.StreamDescription.Shards;
    const shardThreads = [];

    // Crear un thread para cada shard
    for (const shard of shards) {
        const shardThread = {
            shardId: shard.ShardId,
            shardIterator: null,
            noNewRecordsCount: 0,
            isRunning: true,
        };
        shardThreads.push(shardThread);

        // Obtener el shardIterator para leer desde el último registro consumido
        const shardIteratorResponse = await kinesis.getShardIterator({
            ShardId: shardThread.shardId,
            ShardIteratorType: 'LATEST',
            StreamName: streamName,
        });
        shardThread.shardIterator = shardIteratorResponse.ShardIterator;

        // Iniciar un loop continuo para leer nuevos registros
        (async () => {
            while (shardThread.isRunning) {
                //console.log(`Leyendo desde shard ${shardThread.shardId}`);

                const getRecordsResponse = await kinesis.getRecords({ ShardIterator: shardThread.shardIterator });
                const records = getRecordsResponse.Records;

                if (records.length > 0) {
                    console.log(`Se recibieron ${records.length} nuevos registros en shard ${shardThread.shardId}:`);
                    shardThread.noNewRecordsCount = 0;
                    for (const record of records) {
                        console.log(JSON.parse(Buffer.from(record.Data).toString()));
                    }
                } else {
                    shardThread.noNewRecordsCount++;
                }

                shardThread.shardIterator = getRecordsResponse.NextShardIterator;

                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        })();
    }
}

module.exports = consume;