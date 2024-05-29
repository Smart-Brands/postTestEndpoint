'use strict';
const main = require('../main');
const integrationFactory = require('../integrations/integrationFactory');

const checkIntegrationAccess = async (integrationId, partnerId) => {
  const result = await main.sql.query(
    `SELECT id FROM integrations WHERE id = ? AND partner_id = ? AND status IN (0, 1)`,
    [integrationId, partnerId],
  );

  if (!result.length) {
    throw new main.HttpError(`You don't have access to this resource`, 403);
  }
};

const checkIntegrationTriggerInUse = async (integrationId, partnerId) => {
  const result = await main.sql.query(
    `SELECT name FROM partner_triggers WHERE integration_id = ? AND partner_id = ? AND status IN (0, 1)`,
    [integrationId, partnerId],
  );

  if (result.length) {
    const names = result.map(row => row.name).join(', ');

    throw new main.HttpError(
      `You cannot remove an integration that used in triggers. You must first delete the triggers (${names}) before you can remove this integration.`,
      400,
    );
  }
};

module.exports.getIntegrations = async event => {
  try {
    const { status } = event.queryStringParameters || {};
    const partner = await main.authenticateUser(event);

    // 0 - Unknown
    // 1 - Connected
    // 2 - Archived
    if (
      typeof status !== 'undefined' &&
      [0, 1, 2].indexOf(Number(status)) === -1
    ) {
      throw new main.HttpError('Status is not allowed', 400);
    }

    const statusFilter = typeof status !== 'undefined' ? [status] : [0, 1];

    const result = await main.sql.query(
      `SELECT id, name, type, method, status FROM integrations WHERE partner_id = ? AND status IN (?) ORDER BY id DESC`,
      [partner.id, statusFilter],
    );
    await main.sql.end();

    return main.responseWrapper(result);
  } catch (e) {
    console.log(e);

    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.getIntegration = async event => {
  const AES_KEY = process.env.MYSQL_AES_KEY;

  try {
    const { id } = event.pathParameters;
    const partner = await main.authenticateUser(event);

    const result = await main.sql.query(
      `SELECT name, type, method, request_url, request_body, request_headers, CONVERT(AES_DECRYPT(api_key, ?), CHAR) as api_key, CONVERT(AES_DECRYPT(custom_properties, ?), CHAR) as custom_properties FROM integrations WHERE id = ? AND partner_id = ?`,
      [AES_KEY, AES_KEY, id, partner.id],
    );
    await main.sql.end();

    if (!result[0]) {
      throw new main.HttpError('Could not find Integration', 404);
    }

    return main.responseWrapper({
      ...result[0],
      request_body: result[0].request_body
        ? JSON.stringify(result[0].request_body, null, 2)
        : '',
      request_headers: result[0].request_headers
        ? JSON.stringify(result[0].request_headers, null, 2)
        : '',
      custom_properties: result[0].custom_properties
        ? JSON.parse(result[0].custom_properties)
        : {},
    });
  } catch (e) {
    console.log(e);

    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.createIntegration = async event => {
  const AES_KEY = process.env.MYSQL_AES_KEY;

  try {
    const partner = await main.authenticateUser(event);
    const body = JSON.parse(event.body);

    if (!body.name) {
      throw new main.HttpError('Integration Name is a required field', 400);
    }

    if (!body.type) {
      throw new main.HttpError('Integration Type is a required field', 400);
    }

    const result = await main.sql.query(
      `INSERT INTO integrations (partner_id, name, type, method, api_key, request_url, request_body, request_headers, status, failed_count, custom_properties) VALUES (?, ?, ?, ?, AES_ENCRYPT(?), ?, ?, ?, 1, 0, AES_ENCRYPT(?))`,
      [
        partner.id,
        body.name,
        body.type,
        body.method || 'API_KEY',
        [body.api_key, AES_KEY],
        body.request_url,
        body.request_body || null,
        body.request_headers || null,
        [JSON.stringify(body.custom_properties || {}), AES_KEY],
      ],
    );
    await main.sql.end();

    return main.responseWrapper({ id: result.insertId });
  } catch (e) {
    console.log(e);

    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.updateIntegration = async event => {
  const AES_KEY = process.env.MYSQL_AES_KEY;

  try {
    const { id } = event.pathParameters;
    const partner = await main.authenticateUser(event);
    const body = JSON.parse(event.body);

    if (!body.name) {
      throw new main.HttpError('Integration Name is a required field', 400);
    }

    if (!body.type) {
      throw new main.HttpError('Integration Type is a required field', 400);
    }

    await main.sql.query(
      `UPDATE integrations
       SET name = ?, method = ?, failed_count = 0, status = 1, api_key = AES_ENCRYPT(?), request_url = ?, request_body = ?, request_headers = ?, custom_properties = AES_ENCRYPT(?)
       WHERE id = ? AND partner_id = ?`,
      [
        body.name,
        body.method,
        [body.api_key, AES_KEY],
        body.request_url,
        body.request_body || null,
        body.request_headers || null,
        [JSON.stringify(body.custom_properties || {}), AES_KEY],
        id,
        partner.id,
      ],
    );
    await main.sql.end();

    return main.responseWrapper();
  } catch (e) {
    console.log(e);

    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.archiveIntegration = async event => {
  try {
    const { id } = event.pathParameters;
    const partner = await main.authenticateUser(event);

    await checkIntegrationAccess(id, partner.id);
    await checkIntegrationTriggerInUse(id, partner.id);

    // 0 - Unknown
    // 1 - Connected
    // 2 - Archived
    await main.sql.query(`UPDATE integrations SET status = 2 WHERE id = ?`, [
      id,
    ]);
    await main.sql.end();

    return main.responseWrapper();
  } catch (e) {
    console.log(e);

    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.getIntegrationEntities = async event => {
  const AES_KEY = process.env.MYSQL_AES_KEY;
  console.log('Event: ' + JSON.stringify(event));

  try {
    const { id } = event.pathParameters;
    const { fldfunc } = event.queryStringParameters;
    console.log('Function: ' + fldfunc);
    const partner = await main.authenticateUser(event);

    const result = await main.sql.query(
      `SELECT
        type,
        CONVERT(AES_DECRYPT(api_key, ?), CHAR) as api_key,
        CONVERT(AES_DECRYPT(custom_properties, ?), CHAR) as custom_properties
      FROM integrations
      WHERE id = ? AND partner_id = ? AND status IN (0, 1)`,
      [AES_KEY, AES_KEY, id, partner.id],
    );

    console.log('SQL Query: ' + result);
    await main.sql.end();

    const integration = integrationFactory.createIntegration({
      ...result[0],
      custom_properties: result[0].custom_properties
        ? JSON.parse(result[0].custom_properties)
        : {},
    });
    /*
    const response = `${await integration.fldfunc()}`;
    if (fldfunc === 'getContactLists'){
      response = await integration.getContactLists();
    } else if (fldfunc === 'getTags') {
      response = await integration.getTags();
    }
    */

    const response = await integration[fldfunc]();

    console.log('Get Contact Entities: ' + response);
    return main.responseWrapper(response || []);
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};
