# cookunity

## summary

This is a Node JS API with two endpoints:

- **traces**

This endpoint will receive, via HTTP POST, an IP address in the format 100.100.100.100, and
return the following information associated with that IP address:
- Country which issued the IP and its ISO code
- Coordinates for its location (latitude and longitude)
- An array of currencies for that country with:
    - ISO code (USD, CAD, ARS)
    - Symbol ($, £)
    - Conversion rate from currency to USD
- Distance between United States and country of origin (in Kilometers)

### Example request

```
POST --> /traces
body: {"ip":"167.62.158.169"}
```

### Example response
```
{
    "ip":"190.191.237.90",
    "name": "Argentina",
    "code": "AR",
    "lat": -34.6022,
    "lon": -58.3845,
    "currencies": [
        {
            "iso":"ARS",
            "symbol": "$",
            "conversion_rate": 0.023
        },
        {
            "iso": "USD",
            "symbol": "$",
            "conversion_rate": 1
        }
    ],
    "distance_to_usa": 8395.28
}
```

- **statistics**

A resource which, on an HTTP GET, returns:
- Longest distance from requested traces
- Most traced country

### Example request

```
GET --> /statistics
```

### Example response

```
{
    "longest_distance": {
        "country": "United States",
        "value": 0
    },
    "most_traced": {
        "country": "United States",
        "value": 1
    }
}
```

## Install and run

You need to install nodejs and npm to run this app locally.
This app uses AWS Kinesis Data Streams to handle high-concurrency and a DynamoDB for data persistance.

### Install dependencies

#### Node

```
npm install
```

#### Kinesis Data Streams

Create a **credentials** file in $HOME/.aws/ with the following data:

```
[default]
aws_access_key_id = YOUR_AWS_ACCESS_KEY_ID
aws_secret_access_key = YOUR_AWS_SECRET_ACCESS_KEY
```

### Run the app

```
npm start
```


## Cloud

This app is deployed in AWS cloud.
It has the following architecture:

- EC2 instance with an NGINX that forwards all requests to the Node JS app.
- Kinesis Data Stream for the messages produced for each call to the **/traces** endpoint. Another service consumes these messages, calculate statistics and persist the data in the DynamoDB.
- The **/statistics** endpoint make two calls to the DB to get the statistics data.
- DynamoDB to store the statistics information

### Example of the statistics table in the DynamoDb

country | data 
--- |------
Argentina | { "distance" : { "N" : "10548.42" }, "traced" : { "N" : "6" } }
China | { "distance" : { "N" : "10847.76" }, "traced" : { "N" : "1" } }
Mexico | { "distance" : { "N" : "1991.39" }, "traced" : { "N" : "4" } }
Australia | { "distance" : { "N" : "17080.11" }, "traced" : { "N" : "1" } }
India | { "distance" : { "N" : "14405.36" }, "traced" : { "N" : "1" } }

With this architecture the traces requests is decouple from the statistics calculation and Kinesis can scale up on demand to handle millon of requests.
Regarding the API, the architecture could change to scale up horizontally using a Load Balancer and the AWS autoscaling based on traffic. This configuration is not in place and needs to be setup if required.