'use strict';
const main = require('../main.js');
const crypto = require('crypto');

module.exports.signUrl = async event => {
  const { email_address } = await main.authenticateUser(event);

  return await main.getSignedURL(
    'imp-record-manager-contact-uploader',
    email_address,
  );
};

module.exports.getUploadedFilesByListId = async event => {
  try {
    const { email_address } = await main.authenticateUser(event);
    const { listId } = event.pathParameters;

    const result = await main.sql.query(
      `SELECT mus.job_id as jobId, started, finished, status, email_address as email, file_name as fileName, origin_file_name as originFileName, TIMESTAMPDIFF(SECOND, started, finished)/total as timeToImportItem, total, processed, failed, exist, send_notification as sendNotification FROM manager_upload_job left join manager_upload_stats mus on manager_upload_job.job_id = mus.job_id where email_address = ? AND partner_list_id = ? order by started DESC, finished DESC`,
      [email_address, listId],
    );
    await main.sql.end();

    return main.responseWrapper(result);
  } catch (e) {
    console.log(e);

    return {
      statusCode: e.statusCode || 500,
      body: 'Could not get uploaded files: ' + e,
    };
  }
};

module.exports.sendNotificationAfterImport = async event => {
  try {
    const { importId, shouldSendNotificationAfterImport } =
      event.queryStringParameters;

    const sendNotification = /^\s*(true|1|on)\s*$/i.test(
      shouldSendNotificationAfterImport,
    )
      ? 1
      : 0;
    const result = await main.sql.query(
      `UPDATE manager_upload_job SET send_notification=? where job_id=?`,
      [sendNotification, importId],
    );
    await main.sql.end();

    return main.responseWrapper(result.affectedRows === result.changedRows);
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.startImport = async event => {
  try {
    const { id: partnerId, email_address } = await main.authenticateUser(event);
    const {
      fileName,
      listId,
      originFileName,
      sendNotification,
      encoding,
      emailMapping,
      fileType,
      custom_fields,
    } = event.queryStringParameters;

    const url = {
      uri: process.env.IMPORTER_URI,
      host: 'api/import/start',
      params: `partnerId=${partnerId}&partnerEmail=${email_address}&listId=${listId}&fileName=${fileName}&originFileName=${originFileName}&emailMapping=${emailMapping}&fileType=${fileType}&sendNotification=${sendNotification}&encoding=${encoding}&customFields=${custom_fields}`,
    };

    console.log('API Start URL: ' + JSON.stringify(url));
    console.log('Custom Fields: ' + custom_fields);

    const response = await main.axios.get(
      `${url.uri}/${url.host}?${url.params}`,
    );

    console.log('Axios Start Import Response: ' + response);

    return main.responseWrapper(response.data);
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.checkImportStatus = async event => {
  try {
    const results = await main.sql
      .query(`SELECT started, finished, status, processed, failed, total, exist
            FROM manager_upload_job as muj
                LEFT JOIN manager_upload_stats mus on muj.job_id = mus.job_id
            WHERE muj.job_id = '${event.queryStringParameters.importId}'`);
    await main.sql.end();
    return main.responseWrapper(
      results && results.length > 0 ? results[0] : {},
    );
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.uploadTos3 = async (event, req) => {};
