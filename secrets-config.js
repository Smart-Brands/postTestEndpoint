// secrets-config.js
module.exports = {
  secrets: [
  "inboxmailers-prod-aws-credentials",
  "inboxmailers-prod-chargebee",
  "inboxmailers-prod-database-credentials",
  "inboxmailers-prod-external-services",
  "inboxmailers-prod-oauth-integrations",
  "inboxmailers-prod-pixel-tracking",
  "inboxmailers-prod-redshift"
],
  envVarMapping: {
  "OAUTH2_KEAP_SECRET": {
    "secretName": "inboxmailers-prod-oauth-integrations",
    "key": "OAUTH2_KEAP_SECRET"
  },
  "OAUTH2_KEAP_KEY": {
    "secretName": "inboxmailers-prod-oauth-integrations",
    "key": "OAUTH2_KEAP_KEY"
  },
  "DB_NAME": {
    "secretName": "inboxmailers-prod-database-credentials",
    "key": "DB_NAME"
  },
  "MYSQL_HOST": {
    "secretName": "inboxmailers-prod-database-credentials",
    "key": "MYSQL_HOST"
  },
  "REDSHIFT_DB_PASSWORD": {
    "secretName": "inboxmailers-prod-redshift",
    "key": "REDSHIFT_DB_PASSWORD"
  },
  "MYSQL_AES_KEY": {
    "secretName": "inboxmailers-prod-database-credentials",
    "key": "MYSQL_AES_KEY"
  },
  "REDSHIFT_HOST": {
    "secretName": "inboxmailers-prod-redshift",
    "key": "REDSHIFT_HOST"
  },
  "SECRET_ACCESS_KEY": {
    "secretName": "inboxmailers-prod-aws-credentials",
    "key": "SECRET_ACCESS_KEY"
  },
  "REDSHIFT_PORT": {
    "secretName": "inboxmailers-prod-redshift",
    "key": "REDSHIFT_PORT"
  },
  "ACCESS_KEY_ID": {
    "secretName": "inboxmailers-prod-aws-credentials",
    "key": "ACCESS_KEY_ID"
  },
  "REDSHIFT_USER": {
    "secretName": "inboxmailers-prod-redshift",
    "key": "REDSHIFT_USER"
  }
},
  region: 'us-east-1',
  application: 'inboxmailers',
  lambdaFunction: 'postTestEndpoint'
};
