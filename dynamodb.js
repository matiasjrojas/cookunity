const AWS = require('aws-sdk');
const { region } = require("./config.json");

AWS.config.update({ region: region });

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = 'statistics';

//insert or update a record in dynamoDB
async function upsert(id, data) {
    const params = {
        TableName: tableName,
        Key: { country: id },
        UpdateExpression: 'set #data = :data',
        ExpressionAttributeNames: { '#data': 'data' },
        ExpressionAttributeValues: { ':data': data },
        ReturnValues: 'UPDATED_NEW',
    };
    try {
        const result = await docClient.update(params).promise();
        console.log('Elemento insertado o actualizado:', result);
        return result;
    } catch (err) {
        console.error('Error al insertar o actualizar elemento:', err);
        throw err;
    }
}

//get a record from dynamoDB by its ID
async function getItemById(id) {
    const params = {
        TableName: tableName,
        Key: { country: id }
    };
    try {
        const result = await docClient.get(params).promise();
        console.log('Elemento obtenido:', result);
        return result.Item;
    } catch (err) {
        console.error('Error al obtener elemento:', err);
        throw err;
    }
}

//get longest distance from dynamoDB
async function getLongestDistance() {
    const params = {
        TableName: tableName
    };
    try {
        const data = await docClient.scan(params).promise();
        const result = data.Items.reduce((firstElement, currentElement) => {
            if (currentElement.data.distance > firstElement.data.distance) {
                return currentElement;
            } else {
                return firstElement;
            }
        });
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

//get most traced from dynamoDB
async function getMostTraced() {
    const params = {
        TableName: tableName
    };
    try {
        const data = await docClient.scan(params).promise();
        const result = data.Items.reduce((firstElement, currentElement) => {
            if (currentElement.data.traced > firstElement.data.traced) {
                return currentElement;
            } else {
                return firstElement;
            }
        });
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = { upsert, getItemById, getLongestDistance, getMostTraced } 