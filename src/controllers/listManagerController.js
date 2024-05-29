'use strict';
const main = require('../main');
const { createPagination } = require('../pagination');
const crypto = require('crypto');

const checkPartnerNetworkIn = partner => {
  if (!partner.network_in) {
    throw new main.HttpError(`You don't have access to this resource`, 403);
  }
};

module.exports.getPartnerLists = async event => {
  try {
    const pagination = createPagination(event);
    const partner = await main.authenticateUser(event);

    checkPartnerNetworkIn(partner);

    const sql = `SELECT
    SQL_CALC_FOUND_ROWS
    pl.id,
    pl.name,
    pl.trigger_id,
    pl.description,
    FORMAT(pl.record_count, 0) AS list_count,
    pt.name as trigger_name,
    SUM(mus.total) AS total,
    SUM(mus.processed) AS processed,
    SUM(mus.failed) AS failed,
    SUM(mus.exist) AS exist
  FROM partner_lists AS pl
  LEFT JOIN partner_triggers AS pt ON pt.id = pl.trigger_id
  LEFT JOIN manager_upload_job AS muj ON muj.partner_list_id = pl.id
  LEFT JOIN manager_upload_stats AS mus ON muj.job_id = mus.job_id
  WHERE pl.partner_id = ? AND pl.status = 1
  GROUP BY pl.id, muj.partner_list_id
  ORDER BY pl.id DESC
  LIMIT ?`;

    const result = await main.sql
      .transaction()
      .query(sql, [partner.id, pagination.limit])
      .query(pagination.query)
      .commit();
    await main.sql.end();

    console.log('Result of List Manager Query: ', result);

    return main.responseWrapper(pagination.wrapResponse(result));
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.getPartnerList = async event => {
  try {
    const { listId } = event.pathParameters;
    const partner = await main.authenticateUser(event);

    checkPartnerNetworkIn(partner);

    const result = await main.sql.query(
      `SELECT name, description, trigger_id FROM partner_lists WHERE id = ? AND partner_id = ?`,
      [listId, partner.id],
    );
    await main.sql.end();

    if (!result.length) {
      throw new main.HttpError('Could not find List', 404);
    }

    return main.responseWrapper(result[0]);
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.createPartnerList = async event => {
  try {
    const { name, description, trigger_id } = event.body
      ? JSON.parse(event.body)
      : {};

    if (!name) {
      throw new main.HttpError('List Name is a required field', 400);
    }

    const partner = await main.authenticateUser(event);

    checkPartnerNetworkIn(partner);

    const result = await main.sql.query(`INSERT INTO partner_lists SET ?`, {
      name,
      description,
      trigger_id: trigger_id || null,
      status: 1,
      partner_id: partner.id,
    });
    await main.sql.end();

    return main.responseWrapper({ id: result.insertId });
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.updatePartnerList = async event => {
  try {
    const { listId } = event.pathParameters;
    const { name, description, trigger_id } = event.body
      ? JSON.parse(event.body)
      : {};

    if (!name) {
      throw new main.HttpError('List Name is a required field', 400);
    }

    const partner = await main.authenticateUser(event);

    checkPartnerNetworkIn(partner);

    await main.sql.query(
      `UPDATE partner_lists SET name = ?, description = ?, trigger_id = ? WHERE id = ? AND partner_id = ?`,
      [name, description, trigger_id || null, listId, partner.id],
    );
    await main.sql.end();

    return main.responseWrapper();
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.archiveList = async event => {
  try {
    const { listId } = event.pathParameters;
    const partner = await main.authenticateUser(event);

    checkPartnerNetworkIn(partner);

    await main.sql.query(
      `UPDATE partner_lists SET status = 2 WHERE id = ? AND partner_id = ?`,
      [listId, partner.id],
    );

    await main.sql.query(
      `UPDATE contact_partner_mapping SET active = 0 WHERE list_id = ? AND partner_id = ?`,
      [listId, partner.id],
    );

    await main.sql.end();

    return main.responseWrapper();
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};
