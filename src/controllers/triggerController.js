'use strict';
const main = require('../main');
const { createPagination } = require('../pagination');

const checkTriggerInUse = async (triggerId, partnerId) => {
  const listUsage = await main.sql.query(
    `SELECT name FROM partner_lists WHERE trigger_id = ? AND partner_id = ? AND status IN (0, 1)`,
    [triggerId, partnerId],
  );

  if (listUsage.length) {
    const names = listUsage.map(row => row.name).join(', ');

    throw new main.HttpError(
      `You cannot remove a trigger that used in lists. You must first delete the lists (${names}) before you can remove this trigger.`,
      400,
    );
  }

  const pixelUsage = await main.sql.query(
    `SELECT pixel_name FROM pixels WHERE trigger_id = ? AND partner_id = ? AND status IN (0, 1)`,
    [triggerId, partnerId],
  );

  if (pixelUsage.length) {
    const names = pixelUsage.map(row => row.pixel_name).join(', ');

    throw new main.HttpError(
      `You cannot remove a trigger that used in pixels. You must first delete the pixels (${names}) before you can remove this trigger.`,
      400,
    );
  }
};

module.exports.getTriggers = async event => {
  try {
    const pagination = createPagination(event);
    const partner = await main.authenticateUser(event);

    const result = await main.sql
      .transaction()
      .query(
        `SELECT
          SQL_CALC_FOUND_ROWS
          pt.id,
          pt.name,
          pt.description,
          pt.daily_spend_cap,
          FORMAT(pt.daily_spend_total, 2) AS daily_spend_total,
          pt.status,
          pt.integration_id,
          i.name as integration_name
        FROM partner_triggers AS pt
        INNER JOIN integrations AS i ON i.id = pt.integration_id
        WHERE pt.partner_id = ? AND pt.status IN (0, 1)
        ORDER BY pt.id DESC
        LIMIT ?`,
        [partner.id, pagination.limit],
      )
      .query(pagination.query)
      .commit();
    await main.sql.end();

    return main.responseWrapper(pagination.wrapResponse(result));
  } catch (e) {
    console.log(e);

    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.getTrigger = async event => {
  console.log('Event: ' + JSON.stringify(event));

  const partner = await main.authenticateUser(event);
  console.log('Partner Data: ' + JSON.stringify(partner));
  const { id } = event.pathParameters;

  try {
    const result = await main.sql.query(
      `SELECT * FROM partner_triggers WHERE id = ? AND partner_id = ?`,
      [id, partner.id],
    );

    console.log('Query Result: ' + JSON.stringify(result));
    await main.sql.end();

    if (!result[0]) {
      throw new main.HttpError('Could not find Trigger', 404);
    }

    return main.responseWrapper(result[0]);
  } catch (e) {
    console.log(e);

    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.createTrigger = async event => {
  try {
    const partner = await main.authenticateUser(event);
    const body = JSON.parse(event.body);

    if (!body.name) {
      throw new main.HttpError('Trigger Name is a required field', 400);
    }

    if (!body.integration_id) {
      throw new main.HttpError('Integration is a required field', 400);
    }

    // ⭐ john dipilla 2021-09-15
    // if a user has a null value in the hour interval field then they use the old system.
    // new users will be initialized with zeros
    // legacy users will have null and can be converted to hourly interval 
    // - all at once (script or query)
    // - one at a time
    // - self serve (verbiage and design conversation)
    // - never?
    // ALTER TABLE `partner_triggers` ADD `subscriber_hour_interval` int(11) unsigned NULL DEFAULT '0' AFTER `subscriber_limit_time_period`;
    
    const triggerParams = {
      partner_id: partner.id,
      name: body.name,
      status: body.status,
      description: body.description,
      integration_id: body.integration_id,
      trigger_method: body.trigger_method,
      entity_id: body.entity_id,
      one_time_per_user: Number(body.one_time_per_user),
      daily_spend_cap: Number(body.daily_spend_cap),
      daily_spend_total: body.daily_spend_total,
    };
    
    if (body.subscriber_hour_interval === null) {
      triggerParams.subscriber_limit_count = body.subscriber_limit_count;
      triggerParams.subscriber_limit_time_period = body.subscriber_limit_time_period;
    } else {
      triggerParams.subscriber_hour_interval = body.subscriber_hour_interval;
    }
    
    const result = await main.sql.query(`INSERT INTO partner_triggers SET ?`, triggerParams);
    await main.sql.end();

    return main.responseWrapper({ id: result.insertId });
  } catch (e) {
    console.log(e);

    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.updateTrigger = async event => {
  console.log('Event: ' + JSON.stringify(event));

  try {
    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);
    console.log('Body Info Being Sent to Query: ' + JSON.stringify(event.body));
    const partner = await main.authenticateUser(event);
    console.log('Partner Data: ' + JSON.stringify(partner));

    if (!body.name) {
      throw new main.HttpError('Trigger Name is a required field', 400);
    }

    if (!body.integration_id) {
      throw new main.HttpError('Integration is a required field', 400);
    }
    
    const updateFields = [
      'name = ?',
      'description = ?',
      'integration_id = ?',
      'trigger_method = ?',
      'entity_id = ?',
      'one_time_per_user = ?',
      'daily_spend_cap = ?',
      'daily_spend_total = ?',
      'status = ?',
    ];
    
    const updateValues = [
      body.name,
      body.description,
      body.integration_id,
      body.trigger_method,
      body.entity_id,
      Number(body.one_time_per_user),
      Number(body.daily_spend_cap),
      body.daily_spend_total,
      body.status,
    ];
    
    if (body.subscriber_hour_interval === null) {
      updateFields.push('subscriber_limit_count = ?', 'subscriber_limit_time_period = ?');
      updateValues.push(body.subscriber_limit_count, body.subscriber_limit_time_period);
    } else {
      updateFields.push('subscriber_hour_interval = ?');
      updateValues.push(body.subscriber_hour_interval);
    }
    
    updateValues.push(id, partner.id);
    
    const updateQuery = `
      UPDATE partner_triggers SET
        ${updateFields.join(', ')}
      WHERE id = ? AND partner_id = ?`;
    
    await main.sql.query(updateQuery, updateValues);
    await main.sql.end();

    return main.responseWrapper();
  } catch (e) {
    console.log(e);

    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.archiveTrigger = async event => {
  try {
    const { id } = event.pathParameters;
    const partner = await main.authenticateUser(event);

    await checkTriggerInUse(id, partner.id);

    await main.sql.query(
      `UPDATE partner_triggers SET status = 2 WHERE id = ? AND partner_id = ?`,
      [id, partner.id],
    );
    await main.sql.end();

    return main.responseWrapper();
  } catch (e) {
    console.log(e);

    return main.responseWrapper(e, e.statusCode || 500);
  }
};
