# AWS Secrets Manager Migration Guide

**Lambda:** postTestEndpoint  
**Application:** inboxmailers

## Secrets Required

- `inboxmailers-prod-aws-credentials`
- `inboxmailers-prod-chargebee`
- `inboxmailers-prod-database-credentials`
- `inboxmailers-prod-external-services`
- `inboxmailers-prod-oauth-integrations`
- `inboxmailers-prod-pixel-tracking`
- `inboxmailers-prod-redshift`

## Environment Variables Migrated

- `OAUTH2_KEAP_SECRET` → `inboxmailers-prod-oauth-integrations.OAUTH2_KEAP_SECRET`
- `OAUTH2_KEAP_KEY` → `inboxmailers-prod-oauth-integrations.OAUTH2_KEAP_KEY`
- `DB_NAME` → `inboxmailers-prod-database-credentials.DB_NAME`
- `MYSQL_HOST` → `inboxmailers-prod-database-credentials.MYSQL_HOST`
- `REDSHIFT_DB_PASSWORD` → `inboxmailers-prod-redshift.REDSHIFT_DB_PASSWORD`
- `MYSQL_AES_KEY` → `inboxmailers-prod-database-credentials.MYSQL_AES_KEY`
- `REDSHIFT_HOST` → `inboxmailers-prod-redshift.REDSHIFT_HOST`
- `SECRET_ACCESS_KEY` → `inboxmailers-prod-aws-credentials.SECRET_ACCESS_KEY`
- `REDSHIFT_PORT` → `inboxmailers-prod-redshift.REDSHIFT_PORT`
- `ACCESS_KEY_ID` → `inboxmailers-prod-aws-credentials.ACCESS_KEY_ID`
- `REDSHIFT_USER` → `inboxmailers-prod-redshift.REDSHIFT_USER`

## Usage
```javascript
const { initializeSecrets, getEnv } = require('./secrets-loader');

let secretsInitialized = false;

exports.handler = async (event, context) => {
  if (!secretsInitialized) {
    await initializeSecrets();
    secretsInitialized = true;
  }
  
  const dbHost = getEnv('DB_HOST');
  const dbPassword = getEnv('DB_PASSWORD');
  
  // Your Lambda logic
};
```
