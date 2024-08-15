'use strict';
const main = require('../main');
const redshift = require('../redshift');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const uuid = require('uuid');
const axios = require('axios');
const Readable = require('stream').Readable;
const sftp = require('./sftp');
const { log } = require('console');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { RedshiftDataClient, ExecuteStatementCommand, DescribeStatementCommand, GetStatementResultCommand } = require('@aws-sdk/client-redshift-data');

const checkPartnerNetworkIn = partner => {
  if (!partner.network_in) {
    throw new main.HttpError(`You don't have access to this resource`, 403);
  }
};

const checkPartnerPublisher = partner => {
  if (!partner.publisher) {
    throw new main.HttpError(`You don't have access to this resource`, 403);
  }
};

const dateTime = (date, dateType) => {
  const time = dateType === 'from' ? '05:00:00' : '23:00:00';
  var retrnrsp;

  const testDate = new Date(date + ' ' + time);
  console.log('Test Date Before Modification: ' + testDate);
  const newDate = testDate.toLocaleString('en-US', {
    timeZone: 'America/New_York',
  });
  console.log('Test Date AFTER Modification: ' + newDate);

  // if (dateType === 'from') {
  //   retrnrsp = newDate.indexOf('1:00:00') > -1 ? ' 04:00:00' : ' 05:00:00';
  // } else {
  //   retrnrsp = newDate.indexOf('7:00:00') > -1 ? ' 03:59:59' : ' 04:59:59';
  // }
  retrnrsp = ' 00:00:00'

  return retrnrsp;
};

const getFromDateInfo = frminterval => {
  const dttyp = 'from';

  var testnew = new Date();
  const testnewnew = testnew
    .toLocaleString('fr-CA', { timeZone: 'America/New_York' })
    .slice(0, 10);
  console.log('New Local Date: ' + testnewnew);

  var curfrmdt = new Date(testnewnew + 'T02:00:00');
  console.log('Current New Date: ' + curfrmdt);

  curfrmdt.setDate(curfrmdt.getDate() - frminterval);
  console.log('New Date With Interval: ' + curfrmdt);
  const newFrmDt = curfrmdt.toJSON().slice(0, 10);
  console.log('New From Date: ' + newFrmDt);

  const dtfrmtme = dateTime(newFrmDt, dttyp);

  const frmDtObj = newFrmDt + dtfrmtme;

  return frmDtObj;
};

const getToDateInfo = tointerval => {
  const dttyp = 'to';

  var testnew = new Date();
  const testnewnew = testnew
    .toLocaleString('fr-CA', { timeZone: 'America/New_York' })
    .slice(0, 10);
  console.log('New Local Date: ' + testnewnew);

  var curtodt = new Date(testnewnew + 'T02:00:00');
  console.log('Current New Date: ' + curtodt);

  curtodt.setDate(curtodt.getDate() + tointerval);
  const newToDt = curtodt.toJSON().slice(0, 10);
  console.log('New To Date: ' + newToDt);

  const dttotme = dateTime(newToDt, dttyp);

  const toDtObj = newToDt + dttotme;

  return toDtObj;
};

const getCustomDateInfo = (fromdt, todt) => {
  const frmdttyp = 'from';
  const todttyp = 'to';

  const custdtfrmtme = dateTime(fromdt, frmdttyp);

  var comptodt = new Date(todt + 'T06:00:00');
  console.log('New Date Custom To: ' + comptodt);
  comptodt.setDate(comptodt.getDate() + 1);
  console.log('New Date Custom To With Interval: ' + comptodt);
  const newToDt = comptodt.toJSON().slice(0, 10);
  console.log('Custom To Date: ' + newToDt);

  const custdttotme = dateTime(newToDt, todttyp);

  const custDtObj = {
    custFromDate: fromdt + custdtfrmtme,
    custToDate: newToDt + custdttotme,
  };

  return custDtObj;
};

const setDateFilters = filterType => {
  switch (filterType.fltrDate && filterType.fltrDate.toLowerCase()) {
    case 'today':
      var frminterval = 0;
      var tointerval = 1;
      var newfrmdt = getFromDateInfo(frminterval);
      var newtodt = getToDateInfo(tointerval);
      return `and ${filterType.field} >= '${newfrmdt}' and ${filterType.field} <= '${newtodt}'`;
    case 'yesterday':
      var frminterval = 1;
      var tointerval = 0;
      var newfrmdt = getFromDateInfo(frminterval);
      var newtodt = getToDateInfo(tointerval);
      return `and ${filterType.field} >= '${newfrmdt}' and ${filterType.field} <= '${newtodt}'`;
    case 'last 3 days':
      var frminterval = 2;
      var tointerval = 1;
      var newfrmdt = getFromDateInfo(frminterval);
      var newtodt = getToDateInfo(tointerval);
      return `and ${filterType.field} >= '${newfrmdt}' and ${filterType.field} <= '${newtodt}'`;
    case 'last 7 days':
      var frminterval = 6;
      var tointerval = 1;
      var newfrmdt = getFromDateInfo(frminterval);
      var newtodt = getToDateInfo(tointerval);
      return `and ${filterType.field} >= '${newfrmdt}' and ${filterType.field} <= '${newtodt}'`;
    case 'last 30 days':
      var frminterval = 29;
      var tointerval = 1;
      var newfrmdt = getFromDateInfo(frminterval);
      var newtodt = getToDateInfo(tointerval);
      return `and ${filterType.field} >= '${newfrmdt}' and ${filterType.field} <= '${newtodt}'`;
    case 'custom':
      const newcustdt = getCustomDateInfo(
        filterType.fromDate,
        filterType.toDate,
      );
      return `and ${filterType.field} >= '${newcustdt.custFromDate}' and ${filterType.field} <= '${newcustdt.custToDate}'`;
    default:
      return '';
  }
};

const setDateFiltersSql = filterType => {
  switch (filterType.fltrDate && filterType.fltrDate.toLowerCase()) {
    case 'today':
      var frminterval = 0;
      var tointerval = 1;
      var newfrmdt = getFromDateInfo(frminterval);
      var newtodt = getToDateInfo(tointerval);
      return `and ${filterType.field} >= '${newfrmdt}' and ${filterType.field} <= '${newtodt}'`;
    case 'yesterday':
      var frminterval = 1;
      var tointerval = 0;
      var newfrmdt = getFromDateInfo(frminterval);
      var newtodt = getToDateInfo(tointerval);
      return `and ${filterType.field} >= '${newfrmdt}' and ${filterType.field} <= '${newtodt}'`;
    case 'last 3 days':
      var frminterval = 2;
      var tointerval = 1;
      var newfrmdt = getFromDateInfo(frminterval);
      var newtodt = getToDateInfo(tointerval);
      return `and ${filterType.field} >= '${newfrmdt}' and ${filterType.field} <= '${newtodt}'`;
    case 'last 7 days':
      var frminterval = 6;
      var tointerval = 1;
      var newfrmdt = getFromDateInfo(frminterval);
      var newtodt = getToDateInfo(tointerval);
      return `and ${filterType.field} >= '${newfrmdt}' and ${filterType.field} <= '${newtodt}'`;
    case 'last 30 days':
      var frminterval = 29;
      var tointerval = 1;
      var newfrmdt = getFromDateInfo(frminterval);
      var newtodt = getToDateInfo(tointerval);
      return `and ${filterType.field} >= '${newfrmdt}' and ${filterType.field} <= '${newtodt}'`;
    case 'custom':
      const tointvrl = 1;
      const newcustdt = getCustomDateInfo(
        filterType.fromDate,
        filterType.toDate,
        tointvrl,
      );
      return `and ${filterType.field} >= '${newcustdt.custFromDate}' and ${filterType.field} <= '${newcustdt.custToDate}'`;
    default:
      return '';
  }
};

const setPixelOwnerFilters = filterType => {
  switch (filterType && filterType.toLowerCase()) {
    case 'my pixels':
      return 'and p.uuid is not null';
    case 'network pixels':
      return 'and p.uuid is null';
    default:
      return '';
  }
};

const formateRedshiftReturn = (result, emailField) => {
  let eml_Field;
  if (emailField === 'c.email_hash') {
    eml_Field = 'email_hash';
  } else {
    eml_Field = 'email_address';
  }
  const columns = [
    eml_Field, 'uuid', 'pixel_name', 'pixel_description',
    'trigger_name', 'list_name', 'integration_name',
    'status_code', 'response_text', 'date_sent'
  ];

  return result.map(row => {
    const obj = {};
    row.forEach((item, index) => {
        if (item.stringValue !== undefined) {
          obj[columns[index]] = item.stringValue;
        } else if (item.longValue !== undefined) {
          obj[columns[index]] = item.longValue;
        } else if (item.isNull) {
          obj[columns[index]] = null;
        }
      });
      return obj;
  });
}

module.exports.getOutgoingNotificationsForPartner = async event => {
  console.log(
    'Get Outgoing Notifications For Partner Event: ' + JSON.stringify(event),
  );

  const redshiftClient = new RedshiftDataClient({
    region: process.env.MY_AWS_REGION,
  });

  const {
    take,
    offset,
    filterDate = null,
    fDate = null,
    tDate = null,
    filterPixelOwner,
    triggerName = null,
  } = event.queryStringParameters;
  const lmt = parseInt(take);
  const offst = parseInt(offset);
  const dtObj = {
    fltrDate: filterDate,
    fromDate: fDate,
    toDate: tDate,
    field: 'otn.date_sent',
  };
  const dateFilterPart = setDateFilters(dtObj);
  const dateFiltersSql = !!dateFilterPart ? dateFilterPart : '';
  //const pixelOwnerFiltersSql = setPixelOwnerFilters(filterPixelOwner);

  try {
    const partner = await main.authenticateUser(event);

    checkPartnerNetworkIn(partner);
    var emlField;

    if (partner.hash_access) {
      emlField = 'c.email_hash';
    } else {
      emlField = 'c.email_address';
    }
    console.log("PARAMS: ID = ", partner.id, " | LIMIT = ", lmt, " | OFFSET = ", offst, " | TRIGGER NAME = ", triggerName)
    let result;

    if(triggerName) {
      console.log('*** IN TRIGGERNAME CONDITION ***')

      const executeStatement = async (sql) => {
      console.log('*** IN EXECUTESTATMENT FUNC: ', sql)

        const command = new ExecuteStatementCommand({
          ClusterIdentifier: process.env.REDSHIFT_CLUSTER_IDENTIFIER,
          Database: process.env.REDSHIFT_DATABASE,
          DbUser: process.env.REDSHIFT_USER,
          DbPassword: process.env.REDSHIFT_DB_PASSWORD,
          Sql: sql
      });

      console.log('*** BEFORE THE TRY ***')

      try {

      console.log('*** INSIDE TRY: ', command)

        // Send the execute statement command
        const rsResult = await redshiftClient.send(command);
        console.log("EXECUTE STATEMENT RESP: ", rsResult);

        // Wait until the query is complete by polling the statement status
        const statementId = rsResult.Id;
        let queryStatus = "STARTED";

        console.log("*** START WHILE LOOP ***")
        while (queryStatus === "STARTED" || queryStatus === "SUBMITTED") {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before polling again

            const describeCommand = new DescribeStatementCommand({ Id: statementId });
            const describeResult = await redshiftClient.send(describeCommand);
            queryStatus = describeResult.Status;

            console.log(`Query status: ${queryStatus}`);
        }

        if (queryStatus === "FINISHED") {
          const getResultCommand = new GetStatementResultCommand({ Id: statementId });
          const queryResult = await redshiftClient.send(getResultCommand);
          console.log("QUERY RESULT: ", queryResult);

          return queryResult.Records;
        } else {
          console.error("Query failed or was aborted.");
          throw new Error("Query failed or was aborted.");
        }

      } catch (err) {
        console.error("Error executing statement: ", err);
        throw err;
      }
    }

    const sqlQuery = (`select ${emlField}, i.name as integration_name, p.uuid as uuid, p.pixel_name as pixel_name, p.description as pixel_description, l.name as list_name, t.name as trigger_name, otn.*
        FROM
        "imp"."public"."outgoing_notifications" otn
      INNER JOIN
        "imp"."public"."contacts" c ON otn.contact_id = c.id
      LEFT JOIN
        "imp"."public"."integrations" i ON otn.integration_id = i.id
      LEFT JOIN
        "imp"."public"."pixels" p ON otn.pixel_id IS NOT NULL AND otn.pixel_id = p.id AND otn.partner_id = p.partner_id
      LEFT JOIN
        "imp"."public"."partner_lists" l ON otn.partner_list_id IS NOT NULL AND otn.partner_list_id = l.id AND otn.partner_id = l.partner_id
      LEFT JOIN
        "imp"."public"."partner_triggers" t ON otn.integration_id = t.integration_id AND l.trigger_id = t.id
        WHERE otn.partner_id = '${partner.id}'
          AND t.name = '${triggerName}'
          ${dateFiltersSql}
          order by otn.date_sent desc
          limit ${lmt} offset ${offst};`);

    console.log("SQL QUERY: ", sqlQuery);

      try {
        const resultArr = await executeStatement(sqlQuery)
        result = formateRedshiftReturn(resultArr, emlField);
        console.log('*** EXECUTE STATEMENT: ', result)
      } catch (err) {
        console.error('EXECUTION FAILED: ', err)
        return main.responseWrapper(err, 500)
      }

    } else {
      result = await main.sql.query(
        `select ${emlField}, i.name as integration_name, ifnull(p.uuid, 'Network') as uuid, ifnull(p.pixel_name, 'Network') as pixel_name, ifnull(p.description, 'Network') as pixel_description, ifnull(l.name, 'Pixel') as list_name, t.name as trigger_name, otn.*
         from outgoing_notifications otn
         inner join contacts c on otn.contact_id = c.id
         left join integrations i on otn.integration_id = i.id
         left join pixels p on otn.pixel_id IS NOT NULL AND otn.pixel_id = p.id and otn.partner_id = p.partner_id
         left join partner_lists l on otn.partner_list_id IS NOT NULL AND otn.partner_list_id = l.id and otn.partner_id = l.partner_id
         left join partner_triggers t on otn.integration_id = t.integration_id and l.trigger_id = t.id
         where otn.partner_id = ?
         ${dateFiltersSql}
         order by otn.date_sent desc
         limit ? offset ?`,
        [partner.id, lmt, offst],
      );

      console.log("RESULT ARRAY: ", result)
      await main.sql.end();
    }

    console.log(" HERE BEFORE REDSHIFT RESOLVED ")
    const orgLngth = result.length;
    console.log("FILTER PIXEL OWNER: ", filterPixelOwner);
    if (filterPixelOwner.toLowerCase() === 'my pixels') {
      result = result.filter(row => row.uuid !== 'Network');
      if (result[0]) {
        result[0].org_length = orgLngth;
      }
    } else if (filterPixelOwner.toLowerCase() === 'network pixels') {
      result = result.filter(row => row.uuid === 'Network');
      if (result[0]) {
        result[0].org_length = orgLngth;
      }
    }

    console.log("BEFORE RETURN: ", result)
    return main.responseWrapper(result);
  } catch (e) {
    console.log("ERROR: ", e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.postOutgoingNotificationsForPartner = async event => {
  const isExport = event.queryStringParameters?.export;
  const { draw, start, length, order, columns, search, dateStart, dateEnd } = JSON.parse(event.body);
  const partner = await main.authenticateUser(event);
  console.log('UI data draw:', draw);
  console.log('UI data start:', start);
  console.log('UI data length:', length);
  console.log('UI data order:', order);
  console.log('UI data columns:', columns);
  console.log('UI data search:', search);
  console.log('UI data dateStart:', dateStart);
  console.log('UI data dateEnd:', dateEnd);

  const limit = parseInt(length, 10) || 10;
  const offset = parseInt(start, 10) || 0;

  const columnsMap = [
    'email_address',
    'uuid',
    'pixel_name',
    'list_name',
    'integration_name',
    'status_code',
    'response_text',
    'date_created',
    'date_sent',
  ];

  const sortColumnIndex = order && order[0] && typeof order[0].column !== 'undefined' ? parseInt(order[0].column, 10) : 8;
  const sortColumn = columnsMap[sortColumnIndex] || columnsMap['date_sent'];
  const sortDirection = order && order[0] && ['asc', 'desc'].includes(order[0].dir.toLowerCase()) ? order[0].dir.toUpperCase() : 'DESC';
  console.log(" ### sortColumn: ", sortColumn)

  let queryParams = [partner.id];
  let whereClause = '';

  if (dateStart) {
    whereClause += ' AND otn.date_sent >= ?';
    queryParams.push(`${dateStart} 00:00:00`);
  }

  if (dateEnd) {
    whereClause += ' AND otn.date_sent <= ?';
    queryParams.push(`${dateEnd} 24:59:59`);
  }

  if(!dateStart && !dateEnd) {
    whereClause+= "AND otn.date_sent > DATE_SUB(NOW(), INTERVAL 30 DAY)"
  }

  const emlField = partner.hash_access ? 'MD5(otn.email_address)' : 'otn.email_address';

  if (search?.value) {
    whereClause += ` AND (${emlField} LIKE ? OR otn.list_name LIKE ?
                    OR otn.integration_name LIKE ? OR otn.status_code LIKE ? OR otn.uuid LIKE ? OR otn.contact_id = ?
                    OR otn.integration_id = ? OR otn.pixel_id = ? OR otn.partner_id = ?
                    OR otn.partner_list_id = ? OR otn.response_text LIKE ? OR otn.date_created LIKE ?
                    OR otn.date_sent LIKE ?)`;

    const searchValue = `%${search.value}%`;

    queryParams.push(...Array(13).fill(searchValue));
  }

  let query = `SELECT
                  ${emlField} AS email_address,
                  otn.integration_name AS integration_name,
                  otn.uuid AS uuid,
		  '' AS pixel_name,
                  otn.list_name AS list_name,
                  otn.trigger_name AS trigger_name,
                  otn.contact_id,
                  otn.integration_id,
                  otn.pixel_id,
                  otn.partner_id,
                  otn.partner_list_id,
                  otn.status_code,
                  otn.response_text,
                  otn.date_created,
                  otn.date_sent
              FROM recent_outgoing_notifications otn
              WHERE otn.partner_id = ?
              ${whereClause}
              ORDER BY ${sortColumn} ${sortDirection}`;

  if (isExport === "yes") {
     query += ` LIMIT 10000 OFFSET ?`;
     queryParams.push(offset);

    try {
      const result = await main.sql.query(query, queryParams);
      const response = {
        draw: draw,
        recordsTotal: result.length,
        recordsFiltered: result.length,
        data: result,
      };

      await main.sql.end();
      return main.responseWrapper(response);
   } catch(err) {
    console.log("ERROR ON EXPORT REPORT QUERY: ", err);
    const result = {}
   }

    await main.sql.end();
    return main.responseWrapper(result);
  } else {
     query += ` LIMIT ? OFFSET ?`;
     queryParams.push(limit, offset);

      const countQuery = `SELECT COUNT(*) AS total
                          FROM recent_outgoing_notifications otn
			  WHERE otn.partner_id = ?
			  ${whereClause}`

  let totalRecords = 10;
  try{
    console.log(" *** BEFORE COUNT RUNS ")

    const totalResult = await main.sql.query(countQuery, [partner.id, ...queryParams.slice(1, -2)]);
    totalRecords = parseInt(totalResult[0].total, 10);
  } catch(err) {
    console.log("QUERY COUNT CATCH ERROR: ", err);
  }
  console.log(" >>> BEFORE QUERY RUNS ")
  console.log("CHECK QUERY: ", query, " | PARAMS:  ", queryParams)

  const result = await main.sql.query(query, queryParams);
  console.log("RESULT: ", result)

  const response = {
    draw: parseInt(draw, 10),
    recordsTotal: totalRecords,
    recordsFiltered: totalRecords,
    data: result,
  };

  console.log("RESPONSE: ", response)

  await main.sql.end();
  return main.responseWrapper(response);
 }
};

module.exports.getNotificationsForPartner = async event => {
  console.log(
    'Get Incoming Notifications For Partner Event: ' + JSON.stringify(event),
  );
  const {
    take,
    offset,
    filterDate = null,
    filterName = null,
    fDate = null,
    tDate = null,
    filterPixelStatus = null,
  } = event.queryStringParameters;
  const lmt = parseInt(take);
  console.log('Limit: ' + lmt);
  const offst = parseInt(offset);
  console.log('Offset: ' + offst);
  const dtObj = {
    fltrDate: filterDate,
    fromDate: fDate,
    toDate: tDate,
    field: 'n.date_received',
  };
  const dateFilterPart = setDateFilters(dtObj);
  const dateFilterSql = !!dateFilterPart ? dateFilterPart : '';
  console.log('Date Filter: ' + dateFilterSql);
  const nameFilterSql = !!filterName ? `and p.pixel_name = ${filterName}` : '';
  console.log('Name Filter: ' + nameFilterSql);
  //const pixelFilterSql = filterPixelStatus
  //  ? `and p.status = ${filterPixelStatus}`
  //  : '';
  //console.log('Pixel Status: ' + pixelFilterSql);

  try {
    const partner = await main.authenticateUser(event);
    var emlField;

    if (partner.hash_access) {
      emlField = 'c.email_hash';
    } else {
      emlField = 'c.email_address';
    }

    console.log('Get Partner: ' + partner);

    let result = await main.sql.query(
      `select ${emlField}, p.pixel_name, p.description, p.uuid, p.status, n.* from incoming_notifications n
      inner join contacts c on c.id = n.contact_id
      left join pixels p on p.id = n.pixel_id
      where n.partner_id = ?
      ${dateFilterSql}
      ${nameFilterSql}
      order by n.date_received desc
      limit ? offset ?`,
      [partner.id, lmt, offst],
    );

    await main.sql.end();

    const orgLngth = result.length;
    console.log('Query Length: ' + orgLngth);

    if (filterPixelStatus == 1) {
      result = result.filter(row => row.status == 1);
      if (result[0]) {
        result[0].org_length = orgLngth;
      }
    } else if (filterPixelStatus == 2) {
      result = result.filter(row => row.status == 2);
      if (result[0]) {
        result[0].org_length = orgLngth;
      }
    }

    return main.responseWrapper(result);
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.getCommissionsForPartner = async event => {
  console.log('Get Commissions for Partner Event: ' + JSON.stringify(event));
  const {
    take,
    offset,
    filterDate = null,
    fDate = null,
    tDate = null,
  } = event.queryStringParameters;

  try {
    const partner = await main.authenticateUser(event);
    var emlField;

    if (partner.hash_access) {
      emlField = 'c.email_hash';
    } else {
      emlField = 'c.email_address';
    }

    checkPartnerPublisher(partner);
    const dtObj = {
      fltrDate: filterDate,
      fromDate: fDate,
      toDate: tDate,
      field: 't.date_created',
    };
    const dateFilterPart = setDateFilters(dtObj);
    const dateCondition = !!dateFilterPart ? dateFilterPart : '';

    const result = await main.sql.query(
      `SELECT ${emlField}, p.uuid as pixel_uuid, p.pixel_name, p.description, t.amount, t.date_created
      FROM transactions t
      INNER JOIN incoming_notifications n ON n.id = t.incoming_notification_id
      INNER JOIN contacts c ON c.id = n.contact_id
      INNER JOIN pixels p ON p.id = n.pixel_id
      WHERE t.event = 'PIXEL' AND t.partner_id = ? ${dateCondition}
      ORDER BY p.id DESC, t.date_created DESC
      LIMIT ? OFFSET ?`,
      [partner.id, +take, +offset],
    );

    await main.sql.end();

    return main.responseWrapper(result);
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

/**csv download  */
module.exports.getNotificationsForPartnerCsv = async event => {
  console.log(
    'Get Incoming Notifications For Partner Event CSV: ' +
      JSON.stringify(event),
  );

  const {
    filterDate = null,
    filterName = null,
    fDate = null,
    tDate = null,
    filterPixelStatus = null,
  } = event.queryStringParameters;
  const dtObj = {
    fltrDate: filterDate,
    fromDate: fDate,
    toDate: tDate,
    field: 'n.date_received',
  };

  const dateFilterPart = setDateFilters(dtObj);
  const dateFilterSql = !!dateFilterPart ? dateFilterPart : '';
  console.log('Date Filter: ' + dateFilterSql);
  const nameFilterSql = !!filterName ? `and p.pixel_name = ${filterName}` : '';
  console.log('Name Filter: ' + nameFilterSql);

  try {
    const partner = await main.authenticateUser(event);
    var emlHeader;
    var emlField;

    if (partner.hash_access) {
      emlHeader = 'Email Hash';
      emlField = 'email_hash';
    } else {
      emlHeader = 'Email Address';
      emlField = 'email_address';
    }

    let result = await main.sql.query(
      `select ${emlField} as email_address, p.pixel_name, p.description, p.uuid, p.status, n.* from incoming_notifications n
       inner join contacts c on c.id = n.contact_id
       left join pixels p on p.id = n.pixel_id
       where n.partner_id = ?
       ${dateFilterSql}
       order by n.date_received desc`,
      [partner.id],
    );

    console.log('Query Result: ' + result);

    const orgLngth = result.length;

    if (filterPixelStatus == 1) {
      result = result.filter(row => row.status == 1);
    } else if (filterPixelStatus == 2) {
      result = result.filter(row => row.status == 2);
    }

    await main.sql.end();

    let triggers = [];
    triggers.push({
      [emlHeader]: emlHeader,
      Pixel_ID: 'Pixel ID',
      Pixel_Name: 'Pixel Name',
      Pixel_Description: 'Pixel Description',
      Date_Fired: 'Date Fired',
    });
    const actionId = uuid.v4();
    const csvStringifier = createCsvStringifier({
      header: [
        { id: emlHeader, title: emlHeader },
        { id: 'Pixel_ID', title: 'Pixel_ID' },
        { id: 'Pixel_Name', title: 'Pixel_Name' },
        { id: 'Pixel_Description', title: 'Pixel_Description' },
        { id: 'Date_Fired', title: 'Date_Fired' },
      ],
    });

    result.map(obj => {
      const { email_address, uuid, pixel_name, description, date_received } =
        obj;

      let date = new Date('' + date_received + '');
      let formattedDate = date.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });
      let formattedDateEst =
        formattedDate.substring(0, formattedDate.length - 3) + 'EST';

      triggers.push({
        [emlHeader]: email_address,
        Pixel_ID: uuid,
        Pixel_Name: pixel_name,
        Pixel_Description: description,
        Date_Fired: formattedDateEst,
      });
    });

    const csv = csvStringifier.stringifyRecords(triggers);
    const resp = await this.signUrl(actionId);
    const { uploadURL, csvFilename } = resp.body;
    await this.uploadTos3(csv, uploadURL);
    return main.responseWrapper({ filename: csvFilename });
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.getOutgoingNotificationsForPartnerCsv = async event => {
  console.log('Get Outgoing Notifications For Partner Event csv: ');

  const {
    filterDate = null,
    fDate = null,
    tDate = null,
    filterPixelOwner,
  } = event.queryStringParameters;
  const dtObj = {
    fltrDate: filterDate,
    fromDate: fDate,
    toDate: tDate,
    field: 'otn.date_sent',
  };

  const dateFilterPart = setDateFilters(dtObj);
  const dateFiltersSql = !!dateFilterPart ? dateFilterPart : '';
  //const pixelOwnerFiltersSql = setPixelOwnerFilters(filterPixelOwner);

  try {
    const partner = await main.authenticateUser(event);

    console.log(" *** HERE BEFORE *** ");
    console.log('PARTNER: ', partner)

    if (partner.id == 14) {
      const {
        reportId
      } = event.queryStringParameters

      console.log("USER ID IS 14")
      console.log("REPORT ID: ", reportId)

      const filterStr = JSON.stringify(dateFiltersSql)

      if(!reportId) {
        const addWorkRow = await main.sql.query(
          `INSERT INTO partner_report_download (partner_id, status, filters, created_at, updated_at)
          VALUES (?, 'pending', ?, CURRENT_DATE(), CURRENT_DATE())`,
          [partner.id, filterStr],
        );
      }

      const getWordRow = await main.sql.query(
        `SELECT * FROM partner_report_download
          WHERE partner_id = ?
          ORDER  BY id DESC
          LIMIT 1`
        , [partner.id],
      );

      return main.responseWrapper({ data: getWordRow });
    }

    console.log(" *** HERE AFTER *** ")

    checkPartnerNetworkIn(partner);
    var emlHeader;
    var emlField;

    if (partner.hash_access) {
      emlHeader = 'Email Hash';
      emlField = 'email_hash';
    } else {
      emlHeader = 'Email Address';
      emlField = 'email_address';
    }
    console.log('Email Header: ' + emlHeader);

    console.log(partner.network_in);

    checkPartnerNetworkIn(partner);

    /**const result = await redshift.parameterizedQuery(
      `select c.email_address, i.name as integration_name, nvl(p.uuid, 'Network') as uuid, nvl(p.pixel_name, 'Network') as pixel_name, nvl(p.description, 'Network') as pixel_description, nvl(l.name, 'Pixel') as list_name, otn.*
       from outgoing_notifications otn
       inner join contacts c on otn.contact_id = c.id
       left join integrations i on otn.integration_id = i.id
       left join pixels p on otn.pixel_id IS NOT NULL AND otn.pixel_id = p.id and otn.partner_id = p.partner_id
       left join partner_lists l on otn.partner_list_id IS NOT NULL AND otn.partner_list_id = l.id and otn.partner_id = l.partner_id
       where otn.partner_id = $1
       ${dateFiltersSql}
       ${pixelOwnerFiltersSql}
       order by otn.date_sent desc
       limit $2 offset $3`,
      [partner.id, take, offset],
      { raw: true },
    );
    return main.responseWrapper(result);*/
    // writing it with sql
    let result = await main.sql.query(
      `select ${emlField} as email_address, i.name as integration_name, ifnull(p.uuid, 'Network') as uuid, ifnull(p.pixel_name, 'Network') as pixel_name, ifnull(p.description, 'Network') as pixel_description, ifnull(l.name, 'Pixel') as list_name, otn.*
       from outgoing_notifications otn
       inner join contacts c on otn.contact_id = c.id
       left join integrations i on otn.integration_id = i.id
       left join pixels p on otn.pixel_id IS NOT NULL AND otn.pixel_id = p.id and otn.partner_id = p.partner_id
       left join partner_lists l on otn.partner_list_id IS NOT NULL AND otn.partner_list_id = l.id and otn.partner_id = l.partner_id
       where otn.partner_id = ?
	     ${dateFiltersSql}
       order by otn.date_sent desc`,
      [partner.id],
    );

    console.log('Export Query Result: ' + result);

    await main.sql.end();

    const orgLngth = result.length;
    console.log(`Breakpoint 2`, result.length);
    console.log(new Date());

    if (filterPixelOwner.toLowerCase() === 'my pixels') {
      result = result.filter(row => row.uuid !== 'Network');
    } else if (filterPixelOwner.toLowerCase() === 'network pixels') {
      result = result.filter(row => row.uuid === 'Network');
    }

    console.log('Result After Filter: ' + result);

    let triggers = [];
    const actionId = uuid.v4();
    const csvStringifier = createCsvStringifier({
      header: [
        { id: emlHeader, title: emlHeader },
        { id: 'Pixel_ID', title: 'Pixel_ID' },
        { id: 'Pixel_Name', title: 'Pixel_Name' },
        { id: 'Pixel_Description', title: 'Pixel_Description' },
        { id: 'List_Name', title: 'List_Name' },
        { id: 'Integration', title: 'Integration' },
        { id: 'Status_Code', title: 'Status_Code' },
        { id: 'Response_Text', title: 'Response_Text' },
        { id: 'Date_Triggered', title: 'Date_Triggered' },
      ],
    });
    console.log('CSV Stringifier: ' + csvStringifier);
    triggers.push({
      [emlHeader]: emlHeader,
      Pixel_ID: 'Pixel ID',
      Pixel_Name: 'Pixel Name',
      Pixel_Description: 'Pixel Description',
      List_Name: 'List Name',
      Integration: 'Integration',
      Status_Code: 'Status Code',
      Response_Text: 'Response Text',
      Date_Triggered: 'Date Triggered',
    });
    console.log('Triggers Result: ' + triggers);
    result.map(obj => {
      const {
        email_address,
        uuid,
        pixel_name,
        pixel_description,
        list_name,
        integration_name,
        status_code,
        response_text,
        date_sent,
      } = obj;
      let date = new Date('' + date_sent + '');
      let formattedDate = date.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });
      let formattedDateEst =
        formattedDate.substring(0, formattedDate.length - 3) + 'EST';

      triggers.push({
        [emlHeader]: email_address,
        Pixel_ID: uuid,
        Pixel_Name: pixel_name,
        Pixel_Description: pixel_description,
        List_Name: list_name,
        Integration: integration_name,
        Status_Code: status_code,
        Response_Text: response_text,
        Date_Triggered: formattedDateEst,
      });
    });
    const csv = csvStringifier.stringifyRecords(triggers);
    console.log('CSV Response: ' + csv);
    const resp = await this.signUrl(actionId);
    console.log('Sign URL: ' + resp);

    const { uploadURL, csvFilename } = resp.body;
    await this.uploadTos3(csv, uploadURL);
    console.log(`Breakpoint 3 `, new Date());
    return main.responseWrapper({ filename: csvFilename });
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};

module.exports.signUrl = async file_name => {
  return await main.getSignedURLCsv(
    'imp-record-manager-contact-uploader',
    file_name,
  );
};

module.exports.uploadTos3 = async (csv, uri) => {
  return await axios.put(uri, csv, {
    headers: {
      'Content-Type': 'text/csv',
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
};

module.exports.signUrlForDownload = async event => {
  const { fileName } = event.queryStringParameters;
  return await main.getSignedURLDownload(
    'imp-record-manager-contact-uploader',
    fileName,
  );
};

/**
 * Create Process To Sync Contact Lists With AtData Lists
 * @param {*} event
 * @returns
 */
module.exports.syncDataList = async event => {
  try {
    const loadQuery = `SELECT c.email_hash FROM imp.contact_partner_mapping cpm
    LEFT JOIN contacts c ON c.id = cpm.contact_id
    WHERE cpm.date_updated > DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 48 HOUR)
    AND cpm.partner_id > 166
    AND cpm.partner_id NOT IN (188,205,206,207,208,210,211,213,248,249,250,251,263,264,278,279,280,281,282,286,287,289,291,292,297,306,308,309,312,316,338,346,349,362,367,395,397,400,409,410)
    AND cpm.active = 1
    AND cpm.contact_id NOT IN (SELECT contact_id FROM contact_partner_mapping cpmt WHERE cpmt.partner_id > 166 AND cpmt.partner_id NOT IN (188,205,206,207,208,210,211,213,248,249,250,251,263,264,278,279,280,281,282,286,287,289,291,292,297,306,308,309,312,316,338,346,349,362,367,395,397,400,409,410) AND cpmt.date_updated < DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 48 HOUR) AND cpmt.active = 1)
    GROUP BY cpm.contact_id ORDER BY cpm.contact_id ASC`;
    const deleteQuery = `SELECT c.email_hash FROM imp.contact_partner_mapping cpm
    LEFT JOIN contacts c ON c.id = cpm.contact_id
    WHERE cpm.date_updated > DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 48 HOUR)
    AND cpm.partner_id > 166
    AND cpm.partner_id NOT IN (188,205,206,207,208,210,211,213,248,249,250,251,263,264,278,279,280,281,282,286,287,289,291,292,297,306,308,309,312,316,338,346,349,362,367,395,397,400,409,410)
    AND cpm.active = 0
    AND cpm.contact_id NOT IN (SELECT contact_id FROM contact_partner_mapping cpmt WHERE cpmt.partner_id > 166 AND cpmt.partner_id NOT IN (188,205,206,207,208,210,211,213,248,249,250,251,263,264,278,279,280,281,282,286,287,289,291,292,297,306,308,309,312,316,338,346,349,362,367,395,397,400,409,410) AND cpmt.active = 1)
    GROUP BY cpm.contact_id ORDER BY cpm.contact_id ASC`;

    let loadresult = await main.sql.query(loadQuery);

    console.log('Load Query Result: ' + loadresult);
    console.log('Load Query Length: ' + loadresult.length);

    let deleteresult = await main.sql.query(deleteQuery);

    console.log('Delete Query Result: ' + deleteresult);
    console.log('Delete Query Length: ' + deleteresult.length);

    let loadTriggers = [];
    let deleteTriggers = [];

    const csvStringifierLoad = createCsvStringifier({
      header: [{ id: 'Email_Hash', title: 'Email_Hash' }],
    });
    const csvStringifierDelete = createCsvStringifier({
      header: [{ id: 'Email_Hash', title: 'Email_Hash' }],
    });

    loadresult.map(obj => {
      loadTriggers.push({
        Email_Hash: obj.email_hash,
      });
    });
    deleteresult.map(obj => {
      deleteTriggers.push({
        Email_Hash: obj.email_hash,
      });
    });

    const csvforload = csvStringifierLoad.stringifyRecords(loadTriggers);
    console.log('CSV For Loads: ' + csvforload);
    const csvfordelete = csvStringifierDelete.stringifyRecords(deleteTriggers);
    let respfromload = await sftp.upload(csvforload, csvfordelete);
    return main.responseWrapper({
      ...respfromload,
    });
  } catch (e) {
    console.log(e);
    return main.responseWrapper(e, e.statusCode || 500);
  }
};
