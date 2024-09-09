"use strict";
const main = require("../main");
const { RedshiftDataClient, ExecuteStatementCommand, DescribeStatementCommand, GetStatementResultCommand } = require('@aws-sdk/client-redshift-data');
const { v4: uuidv4 } = require("uuid");
const NodeCache = require("node-cache");
const cache = new NodeCache();
const redshiftClient = new RedshiftDataClient({
  region: process.env.MY_AWS_REGION,
});

module.exports.postTestEndpoint = async (event) => {
  const action = event.queryStringParameters?.action;
  const partner = await main.authenticateUser(event);
  const isExport = event.queryStringParameters?.export;

  if(isExport) {
    const returnVal = await initializeExportQuery(event, partner);
    return main.responseWrapper(returnVal);
  }

  if (action === "initQuery") {
    return await initializeQuery(event, partner);
  } else if (action === "pollStatus") {
    return await pollQueryStatus(event);
  }

  return main.responseWrapper({ error: "Invalid action" });
};

async function initializeExportQuery(event, partner) {
  const { dateStart, dateEnd, search, order } = JSON.parse(event.body);
  const query = await constructQuery(partner, dateStart, dateEnd, search, order, 0, 2500);

  try {
    const mainQueryParams = {
      ClusterIdentifier: process.env.REDSHIFT_CLUSTER_IDENTIFIER,
      Database: process.env.REDSHIFT_DB_NAME,
      DbUser: process.env.REDSHIFT_USER,
      Sql: query,
      StatementName: `export-query-${uuidv4()}`,
      WithEvent: false,
    };

    const mainQueryCommand = new ExecuteStatementCommand(mainQueryParams);
    const mainQueryResponse = await redshiftClient.send(mainQueryCommand);

    const mainQueryResult = await waitForQueryCompletion(mainQueryResponse.Id);
    const csvData = await convertToCSV(mainQueryResult.Records);

    return csvData;
  } catch (err) {
    console.error("ERROR IN EXPORT QUERY EXECUTION: ", err);
    return main.responseWrapper({ error: err.message });
  }
}

async function convertToCSV(records) {
  if (records.length === 0) return "";

  const arrOfResults = []
  const headerForResults = [
    'email_address',
    'uuid',
    'pixel_name',
    'list_name',
    'integration_name',
    'status_code',
    'response_text',
    'date_created',
    'date_sent',
  ]

  records.forEach(currentRecordItem => {
    const objToPush = {
      "email_address": currentRecordItem[0]["stringValue"],
      "uuid": currentRecordItem[3]["stringValue"],
      "pixel_name": currentRecordItem[1]["stringValue"],
      "list_name": currentRecordItem[1]["stringValue"],
      "integration_name": currentRecordItem[1]["stringValue"],
      "status_code": currentRecordItem[1]["stringValue"],
      "response_text": currentRecordItem[2]["stringValue"],
      "date_created": currentRecordItem[2]["stringValue"],
      "date_sent": currentRecordItem[14]["stringValue"],
   }

    arrOfResults.push(objToPush)
  })

  return {header: headerForResults, body: arrOfResults};
}

async function initializeQuery(event, partner) {
  const { draw, start, length, order, columns, search, dateStart, dateEnd } =
    JSON.parse(event.body);
  const queryId = uuidv4();
  const query = await constructQuery(
    partner,
    dateStart,
    dateEnd,
    search,
    order,
    start,
    length,
  );

  const countQueryString = await constructCountQuery(
    partner,
    dateStart,
    dateEnd,
    search,
  );

  await cache.set(queryId, {
    status: "pending",
    query,
    startTime: Date.now(),
    draw
  });

  await executeQueryAsync(queryId, countQueryString, partner);

  return main.responseWrapper({
    queryId,
    status: "pending",
  });
}

async function pollQueryStatus(event) {
  const queryId = event.body;
  const queryStatus = await cache.get(queryId);

  if (!queryStatus) {
    return main.responseWrapper({ error: "Query not found" });
  }

  if (queryStatus.status === "completed") {

    return main.responseWrapper({
      status: "completed",
      ...queryStatus.results,
    });
  }

  return main.responseWrapper({
    status: queryStatus.status,
    elapsedTime: Date.now() - queryStatus.startTime,
  });
}

function convertArrayToObject(arr) {
    let result = {};
    arr.forEach((item, index) => {
        let key = `key${index}`;
        let value = Object.values(item)[0];
        result[key] = value;
    });

    return result;
}

async function executeQueryAsync(queryId, countQuery, partner) {
  const queryStatus = await cache.get(queryId);

  try {
    const mainQueryParams = {
      ClusterIdentifier: process.env.REDSHIFT_CLUSTER_IDENTIFIER,
      Database: process.env.REDSHIFT_DB_NAME,
      DbUser: process.env.REDSHIFT_USER,
      Sql: queryStatus.query,
      StatementName: `main-query-${queryId}`,
      WithEvent: false,
    };

    const totalCountQuery = `SELECT COUNT(*) AS total FROM outgoing_notifications WHERE partner_id = ${partner.id}`;
    const totalCountQueryParams = {
      ...mainQueryParams,
      Sql: totalCountQuery,
      StatementName: `total-count-query-${queryId}`,
    };

    const mainQueryCommand = new ExecuteStatementCommand(mainQueryParams);
    const mainQueryResponse = await redshiftClient.send(mainQueryCommand);
    console.log("MAIN QUERY: ", mainQueryResponse)

    const countQueryParams = {
      ...mainQueryParams,
      Sql: countQuery,
      StatementName: `count-query-${queryId}`,
    };
    const countQueryCommand = new ExecuteStatementCommand(countQueryParams);
    const countQueryResponse = await redshiftClient.send(countQueryCommand);

    const totalCountQueryCommand = new ExecuteStatementCommand(totalCountQueryParams);
    const totalCountQueryResponse = await redshiftClient.send(totalCountQueryCommand);
    console.log("BEFORE AWAIT CALLS", mainQueryResponse)
    const mainQueryResult = await waitForQueryCompletion(mainQueryResponse.Id);
    console.log("AWAIT CALLS 1")
    const countQueryResult = await waitForQueryCompletion(countQueryResponse.Id);
    console.log("AWAIT CALLS 2")
    const totalCountQueryResult = await waitForQueryCompletion(totalCountQueryResponse.Id);
    console.log("AWAIT CALLS 3")

    const response = {
      draw: parseInt(queryStatus.draw || "1", 10),
      recordsTotal: parseInt(totalCountQueryResult.Records[0][0].longValue, 10),
      recordsFiltered: parseInt(countQueryResult.Records[0][0].longValue, 10),
      data: mainQueryResult.Records.map(row => {
          return convertArrayToObject(row)
      }),
    };
    console.log("****** RESP: ", response)

    await cache.set(queryId, {
      ...queryStatus,
      status: "completed",
      results: response,
    });
  } catch (err) {
    console.error("ERROR IN QUERY EXECUTION: ", err);
    await cache.set(queryId, {
      ...queryStatus,
      status: "error",
      error: err.message,
    });
  }
}

async function waitForQueryCompletion(queryId) {
 console.log("IN waitForQueryCompletion CALL")
  while (true) {
    const describeParams = {
      Id: queryId,
    };

    const describeCommand = new DescribeStatementCommand(describeParams);
    const describeResponse = await redshiftClient.send(describeCommand);
   console.log("@@@@@@@@@ DESCRIBE: ", describeCommand, " || ", describeResponse)

    if (describeResponse.Status === 'FINISHED') {
      const getResultParams = {
          Id: queryId,
      };
      const getResultCommand = new GetStatementResultCommand(getResultParams);
      const getResultResponse = await redshiftClient.send(getResultCommand);

      return getResultResponse;
    } else if (describeResponse.Status === 'FAILED' || describeResponse.Status === 'ABORTED') {
      throw new Error(`Query execution failed: ${describeResponse.Error}`);
    }
  }
}

async function constructQuery(
  partner,
  dateStart,
  dateEnd,
  search,
  order,
  start,
  length,
) {
  const limit = parseInt(length, 10) || 25;
  const offset = parseInt(start, 10) || 0;

  const emlField = partner.hash_access ? "c.email_hash" : "c.email_address";
  let whereClause = `WHERE otn.partner_id = ${partner.id}`;

  if (dateStart) {
    whereClause += ` AND otn.date_sent >= '${dateStart} 00:00:00'`;
  }

  if (dateEnd) {
    whereClause += ` AND otn.date_sent <= '${dateEnd} 23:59:59'`;
  }

  if (!dateStart && !dateEnd) {
    whereClause += " AND otn.date_sent > DATE_SUB(NOW(), INTERVAL 30 DAY)";
  }

  if (search?.value) {
    whereClause += ` AND (${emlField} LIKE '%${search?.value}%' OR otn.list_name LIKE '%${search?.value}%'
                    OR otn.integration_name LIKE '%${search?.value}%' OR otn.status_code LIKE '%${search?.value}%'
                    OR otn.uuid LIKE '%${search?.value}%' OR otn.contact_id = '%${search?.value}%'
                    OR otn.integration_id = '%${search?.value}%' OR otn.pixel_id = '%${search?.value}%'
                    OR otn.partner_id = '%${search?.value}%' OR otn.partner_list_id = '%${search?.value}%'
                    OR otn.response_text LIKE '%${search?.value}%' OR otn.date_created LIKE '%${search?.value}%'
                    OR otn.date_sent LIKE '%${search?.value}%')`;
  }

  let sortColumn = "otn.date_received";
  let sortDirection = "DESC";

  if (order && order[0] && typeof order[0].column !== "undefined") {
    const sortColumnIndex = parseInt(order[0].column, 10);
    const columnsMap = [
      emlField,
      "p.uuid",
      "p.description",
      "otn.date_sent",
    ];
    sortColumn = columnsMap[sortColumnIndex] || sortColumn;
    sortDirection = order[0].dir.toUpperCase() === "ASC" ? "ASC" : "DESC";
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
              FROM outgoing_notifications otn
	      INNER JOIN contacts c ON c.id = otn.contact_id
              ${whereClause}
              ORDER BY ${sortColumn} ${sortDirection}`;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  return query;
}

function constructCountQuery(partner, dateStart, dateEnd, search) {
  let whereClause = `WHERE otn.partner_id = ${partner.id}`;
  const emlField = partner.hash_access ? "c.email_hash" : "c.email_address";

  if (dateStart) {
    whereClause += ` AND otn.date_received >= '${dateStart} 00:00:00'`;
  }

  if (dateEnd) {
    whereClause += ` AND otn.date_received <= '${dateEnd} 23:59:59'`;
  }

  if (!dateStart && !dateEnd) {
    whereClause += " AND otn.date_received > DATE_SUB(NOW(), INTERVAL 30 DAY)";
  }

  if (search?.value) {
    whereClause += ` AND (${emlField} LIKE '%${search?.value}%' OR otn.list_name LIKE '%${search?.value}%'
                    OR otn.integration_name LIKE '%${search?.value}%' OR otn.status_code LIKE '%${search?.value}%'
                    OR otn.uuid LIKE '%${search?.value}%' OR otn.contact_id = '%${search?.value}%'
                    OR otn.integration_id = '%${search?.value}%' OR otn.pixel_id = '%${search?.value}%'
                    OR otn.partner_id = '%${search?.value}%' OR otn.partner_list_id = '%${search?.value}%'
                    OR otn.response_text LIKE '%${search?.value}%' OR otn.date_created LIKE '%${search?.value}%'
                    OR otn.date_sent LIKE '%${search?.value}%')`;
  }

  return `SELECT COUNT(*) AS total FROM outgoing_notifications otn INNER JOIN contacts c ON c.id = otn.contact_id LEFT JOIN pixels p ON p.id = otn.pixel_id ${whereClause}`;
}
