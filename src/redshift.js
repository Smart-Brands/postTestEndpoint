const Redshift = require('node-redshift');

console.log(process.env);

module.exports = new Redshift({
  user: process.env.REDSHIFT_USER,
  database: process.env.REDSHIFT_DB_NAME,
  password: process.env.REDSHIFT_DB_PASSWORD,
  port: process.env.REDSHIFT_PORT,
  host: process.env.REDSHIFT_HOST,
});
