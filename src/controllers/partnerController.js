'use strict';
const main = require('../main');
const chargebee = require('chargebee');

module.exports.info = async event => {
  try {
    const partner = await main.authenticateUser(event);
    const getsubscription = await main.sql.query(
      'SELECT b.processor_subscription_id FROM partners a INNER JOIN partner_subscriptions b ON b.internal_partner_id = a.id WHERE a.id=? AND b.status = "active"',
      [partner.id],
    );
    await main.sql.end();

    return main.responseWrapper({
      ...partner,
      processor_subscription_id: getsubscription[0]?.processor_subscription_id,
    });

    // return main.responseWrapper(getallprt);
  } catch (e) {
    console.log(e);
  }
};

module.exports.getAllPartners = async event => {
  try {
    const getallprt = await main.sql.query(
      'SELECT a.id, a.email_address, a.partner_name FROM partners a LEFT JOIN partner_subscriptions b ON b.internal_partner_id = a.id WHERE b.status = "active" GROUP BY a.id',
    );

    await main.sql.end();

    return main.responseWrapper(getallprt);
  } catch (e) {
    console.log(e);
  }
};

module.exports.updatePartnerDetails = async event => {
  try {
    const details = JSON.parse(event.body);
    const partner = await main.authenticateUser(event);
    
    console.log('Test');

    await main.sql.query(`UPDATE partners SET details = ? WHERE id = ?`, [
      JSON.stringify(details),
      partner.id,
    ]);
    await main.sql.end();

    return main.responseWrapper(details);
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.getApiKey = async event => {
  try {
    const partner = await main.authenticateUser(event);
    console.log('Get Partner: ' + partner);

    console.log('Start Get Api Keys');
    const apiKeys = await main.apigateway
      .getApiKeys({
        customerId: String(partner.id),
        includeValues: true,
        limit: 500,
      })
      .promise();

    console.log('Finsish Get API Keys: ' + apiKeys);

    const activeKeys = apiKeys.items.filter(item => item.enabled);

    console.log('Get Active Keys: ' + activeKeys);

    return main.responseWrapper(activeKeys.length ? activeKeys[0].value : '');
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.updatePartnerCreditReloadDetails = async event => {
  try {
    const body = JSON.parse(event.body);
    const credit_reload = body.credit_reload;
    const partner = await main.authenticateUser(event);

    await main.sql.query(`UPDATE partners SET credit_reload = ? WHERE id = ?`, [
      credit_reload,
      partner.id,
    ]);
    await main.sql.end();

    return main.responseWrapper(body);
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.updatePartnerBillingDetails = async event => {
  try {
    const body = JSON.parse(event.body);
    const { account_daily_spend_total, credit_reload } = body;
    const partner = await main.authenticateUser(event);

    await main.sql.query(
      `UPDATE partners SET credit_reload = ?, account_daily_spend_total= ? WHERE id = ?`,
      [credit_reload, account_daily_spend_total, partner.id],
    );
    await main.sql.end();

    return main.responseWrapper(body);
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.updatePartnerCredits = async event => {
  try {
    const partner = await main.authenticateUser(event);
    const body = JSON.parse(event.body);
    const { addon_id, addon_quantity, subscription_id, addon_credits } = body;
    let result;
    let inv;
    // ask for value from UI
    try {
      chargebee.configure({
        site: process.env.CHRG_BEE_SITE,
        api_key: process.env.CHRG_BEE_API_KEY,
      });
      inv = chargebee.invoice
        .charge_addon({
          subscription_id: subscription_id,
          addon_id: addon_id,
          addon_quantity: addon_quantity,
        })
        .request(async function (error, result) {
          if (error) {
            //handle error
            return true;
          }
        });
    } catch (err) {
      console.log(err);
    }

    const resps = await inv;
    console.log('Chargebee response: ', resps);
    const rsp = resps.invoice;
    const status = rsp.status;
    const invId = rsp.id;

    if (status === 'paid') {
      const existing_available_credits = partner.available_credits
        ? Number(partner.available_credits)
        : 0;
      const updated_credits =
        existing_available_credits + Number(addon_credits);

      await main.sql.query(
        `UPDATE partners SET available_credits = ? WHERE id = ?`,
        [updated_credits, partner.id],
      );
      await main.sql.end();
      result = { statusCode: 200, message: 'Purchase successful' };
    } else if (status === 'payment_due') {
      chargebee.configure({
        site: process.env.CHRG_BEE_SITE,
        api_key: process.env.CHRG_BEE_API_KEY,
      });
      const del = chargebee.invoice
        .delete(invId)
        .request(function (error, result) {
          if (error) {
            //handle error
            console.log(error);
          }
        });
      const resp = await del;
      result = { statusCode: 400, message: 'Purchase unsuccessful' };
    }
    return main.responseWrapper(result);
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};
