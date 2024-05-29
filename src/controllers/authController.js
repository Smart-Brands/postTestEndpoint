'use strict';
const main = require('../main');
const integrationFactory = require('../integrations/integrationFactory');

module.exports.authWindow = async event => {
  const { providerId } = event.pathParameters;
  const { state, redirectUri } = event.queryStringParameters;

  console.log('Event: ' + event);
  console.log('Event Parsed: ' + JSON.stringify(event));

  try {
    const integration = integrationFactory.createIntegration({
      type: providerId,
    });
    const client = integration.getOAuth2Client({
      state,
      redirectUri,
    });

    return main.responseWrapper(null, 302, {
      Location: client.code.getUri(),
    });
  } catch (e) {
    console.log(e);
    return main.responseWrapper(
      { code: e.statusCode, message: e.message },
      e.statusCode || 500,
    );
  }
};

module.exports.authCallback = async event => {
  const { providerId } = event.pathParameters;
  const { code, state, ...query } = event.queryStringParameters;

  console.log('Callback Event: ' + event);
  console.log('Callback Event Parsed: ' + JSON.stringify(event));
  
  var authData;
  if (providerId === 'hubspot') {
      authData = { client_id: process.env.OAUTH2_HUBSPOT_KEY, client_secret: process.env.OAUTH2_HUBSPOT_SECRET };
    } else {
      authData = {};
    }

  try {
    const [redirectPath, basePath] = Buffer.from(state, 'base64')
      .toString()
      .split('|');

    const integration = integrationFactory.createIntegration({
      type: providerId,
    });

    const redirectUri = `${basePath}${event.path}`;
    const client = integration.getOAuth2Client({ redirectUri, query, body: authData });

    console.log('RedirectUri: ' + redirectUri);
    console.log('Client: ' + client);

    const token = await client.code.getToken(`${redirectUri}?code=${code}`);
    
    console.log('Token: ' + token);
    
    const tokenId = await integration.setToken(token);

    console.log('Token ID: ' + tokenId);

    return main.responseWrapper(null, 302, {
      Location: redirectPath.replace('{{tokenId}}', tokenId),
    });
  } catch (e) {
    console.log(e);
    return main.responseWrapper(
      { code: e.statusCode, message: e.message },
      e.statusCode || 500,
    );
  }
};
