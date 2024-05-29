const uuid = require('uuid');
const AWS = require('aws-sdk');
const axios = require('axios');
const sql = require('./database');
const jwt_decode = require('jwt-decode');

AWS.config.update({ region: 'us-east-1' });

const s3 = new AWS.S3({
  signatureVersion: 'v4',
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

const ses = new AWS.SES({
  region: 'us-east-1',
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

const apigateway = new AWS.APIGateway({
  region: 'us-east-1',
  apiVersion: '2015-07-09',
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

const cognito = new AWS.CognitoIdentityServiceProvider({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

class HttpError extends Error {
  constructor(message, statusCode) {
    super();
    this.statusCode = statusCode;
    this.message = message;
  }
}

module.exports.responseWrapper = (
  results,
  statusCode = 200,
  additonalHeaders = {},
) => ({
  statusCode,
  body: results ? JSON.stringify(results) : '',
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    ...additonalHeaders,
  },
});

module.exports.getSignedURL = async function (bucketName, partnerEmail) {
  const actionId = uuid.v4();

  const s3Params = {
    Bucket: bucketName,
    Key: `${partnerEmail}/${actionId}.csv`,
    ContentType: 'application/x-www-form-urlencoded',
    CacheControl: 'max-age=31104000',
    ACL: 'public-read-write',
  };

  return new Promise((resolve, reject) => {
    const uploadURL = s3.getSignedUrl('putObject', s3Params);
    resolve({
      statusCode: 200,
      isBase64Encoded: false,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        uploadURL: uploadURL,
        csvFilename: `${actionId}.csv`,
      }),
    });
  });
};

module.exports.authenticateUser = async event => {
  const jwtdcd = await jwt_decode(
    event.headers.Authorization || event.headers.authorization,
  );

  const email = jwtdcd.email;
  console.log('JWT Token Email: ' + email);

  const jwtgrp = jwtdcd['cognito:groups'];

  var sqlWhere;
  var sqlVal;

  const imEml = Boolean(email.indexOf('@inboxmailers.com') > -1);
  const supGrp = Boolean(jwtgrp?.indexOf('IMSupport') > -1);
  const qString = event.queryStringParameters;

  if (imEml && supGrp) {
    const custPartId = qString?.partner_id != null ? qString.partner_id : 211;
    sqlWhere = 'id = ?';
    sqlVal = custPartId;
  } else {
    sqlWhere = 'email_address = ?';
    sqlVal = email;
  }

  const result = await sql.query(
    `SELECT *, SUM(credit_reload_threshold + available_credits) AS credits_before_reload FROM partners WHERE ${sqlWhere}`,
    sqlVal,
  );

  if (result.length > 0) {
    result[0].support_group = supGrp;
    return result[0];
  }

  throw new HttpError('Unauthorized user.', 401);
};

module.exports.getSignedURLCsv = async function (bucketName, fileName) {
  const s3Params = {
    Bucket: bucketName,
    Key: `${fileName}.csv`,
    ContentType: 'application/octet-stream',
  };

  return new Promise((resolve, reject) => {
    const uploadURL = s3.getSignedUrl('putObject', s3Params);
    console.log('here is upload url', uploadURL);

    resolve({
      statusCode: 200,
      isBase64Encoded: false,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      body: {
        uploadURL: uploadURL,
        csvFilename: `${fileName}.csv`,
      },
    });
  });
};
module.exports.getSignedURLDownload = async function (bucketName, fileName) {
  const actionId = uuid.v4();

  const s3Params = {
    Bucket: bucketName,
    Key: `${fileName}`,
    Expires: 3600,
  };

  return new Promise((resolve, reject) => {
    const uploadURL = s3.getSignedUrl('getObject', s3Params);
    resolve({
      statusCode: 200,
      isBase64Encoded: false,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        downloadURL: uploadURL,
      }),
    });
  });
};

module.exports.s3 = s3;
module.exports.ses = ses;
module.exports.sql = sql;
module.exports.axios = axios;
module.exports.HttpError = HttpError;
module.exports.jwt_decode = jwt_decode;
module.exports.cognito = cognito;
module.exports.apigateway = apigateway;
