const axios = require('axios');

const IP_API_URL = 'http://ip-api.com/json';
const FIXER_API_URL = 'https://api.apilayer.com/fixer/latest';
const APIKEY = "Hf0LEJqeLWefxwOr2yfas07pwZf7ZPeq";
const FIELDS = "country,countryCode,currency,lat,lon"

async function getIpInformation(ip) {
  const ipInfoResponse = await axios.get(`${IP_API_URL}/${ip}?fields=${FIELDS}`);

  if (!ipInfoResponse.data || ipInfoResponse.data.status === 'fail') {
    throw new Error(`Unable to get IP information for IP address ${ip}`);
  }

  //console.log(ipInfoResponse.data);

  const { country, countryCode, currency, lat, lon } = ipInfoResponse.data;

  const options = {
    headers: {
      'apikey': `${APIKEY}`
    }
  };

  return await axios.get(`${FIXER_API_URL}?base=USD&symbols=${currency},GBP,EUR`, options)
    .then(response => {
      if (!response.data || response.data.success === false) {
        throw new Error(`Unable to get currency conversion rate for ${currency}`);
      }

      const { rates } = response.data;

      /*
      for (const rate in rates) {
        console.log(`${rate} : ${rates[rate]}`)
      }
      */

      return {
        ip,
        name: country,
        code: countryCode,
        lat,
        lon,
        currencies: getCurrencies(rates),
        distance_to_usa: calculateDistance(lat, lon)
      };
    })
    .catch(error => {
      console.error(error);
      return null;
    });
}

function getCurrencies(rates) {
  const arr = [];
  for (const rate in rates) {
    //console.log(`${rate} : ${rates[rate]}`)
    arr.push({ iso: rate, symbol: '$', conversion_rate: 1 / rates[rate] });
  }
  arr.push({
    iso: 'USD',
    symbol: '$',
    conversion_rate: 1
  });
  return arr;
}

function calculateDistance(lat, lon) {
  // Use a distance calculation library or formula to calculate the distance from the provided coordinates to the USA
  // For example: https://www.npmjs.com/package/geolib
  return '';
}

async function getTrace(req, res) {
  const { ip } = req.body;

  try {
    const ipInformation = await getIpInformation(ip);
    res.json(ipInformation);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing your request.');
  }
}

module.exports = getTrace;
