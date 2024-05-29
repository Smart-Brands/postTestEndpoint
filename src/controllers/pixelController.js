'use strict';

const uuid = require('uuid');
const main = require('../main');
const { createPagination } = require('../pagination');

module.exports.getPixels = async event => {
  try {
    const pagination = createPagination(event);
    const partner = await main.authenticateUser(event);
    console.log(partner);

    const response = await main.sql
      .transaction()
      .query(
        `SELECT
          SQL_CALC_FOUND_ROWS
          p.id,
          p.uuid,
          p.trigger_id,
          p.pixel_name,
          p.pixel_opens,
          p.description,
          FORMAT(p.fires_number, 0) AS fires_number,
          pt.name as trigger_name,
          prt.pixel_subdomain,
          group_concat(prtl.trigger_id) as dynamic_trigger_id
        FROM pixels p
        LEFT JOIN partners AS prt ON prt.id = p.partner_id
        LEFT JOIN partner_triggers AS pt ON pt.id = p.trigger_id
        LEFT JOIN partner_lists as prtl ON prtl.pixel_id= p.id
        WHERE p.partner_id = ? and p.status = 1 GROUP BY p.id
        ORDER BY p.id DESC
        LIMIT ?`,
        [partner.id, pagination.limit],
      )
      .query(pagination.query)
      .commit();
    await main.sql.end();

    return main.responseWrapper(pagination.wrapResponse(response));
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.getPixelById = async event => {
  try {
    const { id } = event.pathParameters;
    const partner = await main.authenticateUser(event);

    const result = await main.sql.query(
      `SELECT px.id, px.pixel_name, px.description, px.fires_number, px.trigger_id, px.uuid, prt.pixel_subdomain,px.pixel_opens,group_concat(prtl.trigger_id) as dynamic_trigger_id  
         FROM pixels AS px
           LEFT JOIN partners AS prt ON prt.id = px.partner_id
           LEFT JOIN partner_lists as prtl ON prtl.pixel_id= px.id
         WHERE px.id = ? AND px.partner_id = ?`,
      [id, partner.id],
    );
    await main.sql.end();

    if (!result.length) {
      throw new main.HttpError('Could not find Pixel', 404);
    }

    return main.responseWrapper(result[0]);
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.createPixel = async event => {
  try {
    const {
      pixel_name,
      description,
      trigger_id,
      pixel_opens,
      dynamic_trigger_id,
    } = event.body ? JSON.parse(event.body) : {};

    if (!pixel_name) {
      throw new main.HttpError('Pixel Name is a required field', 400);
    }

    const partner = await main.authenticateUser(event);

    const result = await main.sql.query(`INSERT INTO pixels SET ?`, {
      uuid: uuid.v4(),
      pixel_name,
      description,
      trigger_id: trigger_id || null,
      partner_id: partner.id,
      status: 1,
      pixel_opens: pixel_opens ? pixel_opens : 0,
    });

    const pixel_id = result.insertId;
    const pixel_fire_name = `${pixel_name} Pixel Fires`;
    if (pixel_opens == 1) {

      const result_1 = await main.sql.query(`INSERT INTO partner_lists SET ?`, {
        name: pixel_fire_name,
        description,
        trigger_id: dynamic_trigger_id || null,
        partner_id: partner.id,
        pixel_id: pixel_id,
        status: 1,
      });
      
      const opens_list_id = result_1.insertId;

      const result_2 = await main.sql.query(
        `UPDATE pixels SET opens_list = ? WHERE id = ?`,
        [opens_list_id, pixel_id],
      );
    }

    await main.sql.end();

    return main.responseWrapper({ id: result.insertId });
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.updatePixel = async event => {
  try {
    const { id } = event.pathParameters;
    const {
      pixel_name,
      description,
      trigger_id,
      pixel_opens,
      dynamic_trigger_id,
    } = event.body ? JSON.parse(event.body) : {};

    if (!pixel_name) {
      throw new main.HttpError('Pixel Name is a required field', 400);
    }

    const partner = await main.authenticateUser(event);

    await main.sql.query(
      `UPDATE pixels SET pixel_name = ?, description = ?, trigger_id = ?, pixel_opens = ?  WHERE id = ? AND partner_id = ?`,
      [
        pixel_name,
        description,
        trigger_id || null,
        pixel_opens,
        id,
        partner.id,
      ],
    );

    const pixel_id = id;
    const pixel_fire_name = `${pixel_name} Pixel Fires`;
    if (pixel_opens == 1) {
      const sel_result = await main.sql.query(
        `SELECT id from partner_lists WHERE pixel_id = ?`,
        [pixel_id],
      );
      
      if (!sel_result.length) {
        const result_1 = await main.sql.query(`INSERT INTO partner_lists SET ?`, {
          name: pixel_fire_name,
          description,
          trigger_id: dynamic_trigger_id || null,
          partner_id: partner.id,
          pixel_id: pixel_id,
          status: 1,
        });
        
        const opens_list_id = result_1.insertId;
        
        const result_2 = await main.sql.query(
          `UPDATE pixels SET opens_list = ? WHERE id = ?`,
          [opens_list_id, pixel_id],
        );
        const result_3 = await main.sql.query( 
          `UPDATE partner_lists SET trigger_id = ? WHERE id = ?`,
          [dynamic_trigger_id, opens_list_id],
        );
      }
    }
    await main.sql.end();

    return main.responseWrapper();
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.archivePixel = async event => {
  try {
    const { id } = event.pathParameters;
    const partner = await main.authenticateUser(event);

    await main.sql.query(
      `UPDATE pixels SET status = 2 WHERE id = ? AND partner_id = ?`,
      [id, partner.id],
    );
    await main.sql.end();

    return main.responseWrapper();
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};
