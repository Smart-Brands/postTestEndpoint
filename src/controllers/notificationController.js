'use strict';
const main = require('../main.js');

module.exports.testEndpoint = async event => {
  try {
    const { method, data, headers, url } = JSON.parse(event.body);

    if (!method) {
      throw new main.HttpError(`HTTP Method is a required field`, 400);
    }

    if (!url) {
      throw new main.HttpError(`Endpoint is a required field`, 400);
    }

    const response = await main.axios({
      url,
      method,
      headers,
      data,
    });

    return main.responseWrapper(response.data, response.status);
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};
