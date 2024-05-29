'use strict';
const main = require('../main');
const qs = require('qs');
const axios = require('axios');
const { createPagination } = require('../pagination');

module.exports.getIncomingPayments = async event => {
  const pagination = createPagination(event);

  try {
    const partner = await main.authenticateUser(event);

    const response = await main.sql
      .transaction()
      .query(
        `SELECT SQL_CALC_FOUND_ROWS ip.id, ip.type, ip.amount, ip.transaction_date, ip.processor_payment_status, ip.processor_transaction_id
          FROM incoming_payments ip
          INNER JOIN partner_subscriptions ps ON ps.processor_customer_id = ip.processor_customer_id
          WHERE ps.internal_partner_id = ?
          ORDER BY ip.id DESC
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

module.exports.chargebeeSSO = async event => {
  try {
    const partner = await main.authenticateUser(event);
    const body = JSON.parse(event.body);

    const customerId = await main.sql.query(
      `SELECT processor_customer_id FROM partner_subscriptions 
        WHERE internal_partner_id = ? 
        AND status = 'active'
        AND processor_plan_id <> 'network-plan' 
        ORDER BY created_at DESC LIMIT 1`,
      [partner.id],
    );
    await main.sql.end();

    if (!customerId[0]) {
      throw new main.HttpError(
        'You are not integrated with Chargebee. Please contact support',
        400,
      );
    }

    const { data: response } = await axios({
      method: 'post',
      url: `${process.env.CHARGEBEE_URL}/api/v2/portal_sessions`,
      auth: {
        username: process.env.CHARGBEE_API_KEY,
        password: '',
      },
      data: qs.stringify({
        'customer[id]': customerId[0].processor_customer_id,
        redirect_url: body.redirectUrl,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return main.responseWrapper(response.portal_session.access_url, 200);
  } catch (e) {
    console.log(e);
    return main.responseWrapper(
      { code: e.statusCode, message: e.message },
      e.statusCode || 500,
    );
  }
};
