module.exports.shopify = {
  apiKey: '06636a56f6226cc663470ee0e58b0623',
  apiSecret: 'e6648b8d4cf98043e99fd8fde6559c22',
  shopifyVendor: 'MIS',
  apiConfig: {
    rate_limit_delay: 10000, // 10 seconds (in ms) => if Shopify returns 429 response code
    backoff: 5, // limit X of 40 API calls => default is 35 of 40 API calls
    backoff_delay: 2000 // 1 second (in ms) => wait 1 second if backoff option is exceeded
  }
};
