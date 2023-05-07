const putRecord = require('./kinesis-producer')
const axios = require('axios');

const IP_API_URL = 'http://ip-api.com/json';
const FIXER_API_URL = 'https://api.apilayer.com/fixer/latest';
const CURRENCY_API_URL = 'https://api.apilayer.com/geo/country/currency';
const APIKEY = "JnuMIz1Civ9lYvotTl8Z9h7ABe2J6icB";
const FIELDS = "country,countryCode,currency,lat,lon"
//added some additional currencies for the example
const ADDITIONAL_CURRENCIES = ',GBP,EUR,CAD';
//default lat,lon for USA
const USA_LAT = '37.09024';
const USA_LON = '-95.712891';

async function getIpInformation(ip) {
  const ipInfoResponse = await axios.get(`${IP_API_URL}/${ip}?fields=${FIELDS}`);

  if (!ipInfoResponse.data || ipInfoResponse.data.status === 'fail') {
    throw new Error(`Unable to get IP information for IP address ${ip}`);
  }

  const { country, countryCode, currency, lat, lon } = ipInfoResponse.data;

  const options = {
    headers: {
      'apikey': `${APIKEY}`
    }
  };

  //this endpoint only retrieves one currency by country, even for countries that has more currencies like China or Cuba.
  //in order to get more currencies add them to the ADDITIONAL_CURRENCIES constant.
  return await axios.get(`${FIXER_API_URL}?base=USD&symbols=${currency}${ADDITIONAL_CURRENCIES}`, options)
    .then(async response => {
      if (!response.data || response.data.success === false) {
        throw new Error(`Unable to get currency conversion rate for ${currency}`);
      }

      const { rates } = response.data;

      return {
        ip,
        name: country,
        code: countryCode,
        lat,
        lon,
        currencies: await getCurrencies(rates, options),
        distance_to_usa: calculateDistance(lat, lon)
      };
    })
    .catch(error => {
      console.error(error.message);
      return error.message;
    });
}

async function getCurrencies(rates, options) {
  const arr = [];
  for (const rate in rates) {
    if (rate !== 'USD') {
      let sym = await getCurrencySymbol(rate, options);
      const conversion_rate = 1 / rates[rate];
      arr.push({ iso: rate, symbol: sym, conversion_rate: conversion_rate.toFixed(4) });
    }
  }
  
  arr.push({
    iso: 'USD',
    symbol: '$',
    conversion_rate: 1
  });

  return arr;
}

async function getCurrencySymbol(currency, options) {
  return await axios.get(`${CURRENCY_API_URL}/${currency}`, options)
    .then(response => {
      if (!response.data) {
        throw new Error(`Unable to get currency symbol for ${currency}`);
      }
      return response.data[0].currencies.filter(v => v.code === currency)[0].symbol;
    })
    .catch(error => {
      console.error(error);
      return "$";
    });
}

function calculateDistance(lat, lon) {
  // Calculate the distance between the two points using the Haversine formula
  const earthRadius = 6371; // in km
  const dLat = toRadians(lat - USA_LAT);
  const dLon = toRadians(lon - USA_LON);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat)) * Math.cos(toRadians(USA_LAT)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;

  return distance.toFixed(2);
}

// Helper function to convert degrees to radians
function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

async function getTrace(req, res) {
  const { ip } = req.body;

  try {
    const ipInformation = await getIpInformation(ip);
    const { name, distance_to_usa } = ipInformation;
    putRecord({ country: `${name}`, distance: `${distance_to_usa}`});
    res.json(ipInformation);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing your request.');
  }
}

module.exports = getTrace;
