const fs = require('fs');

const sql = require('serverless-mysql')({
  config: {
    host: process.env.MYSQL_HOST,
    database: process.env.DB_NAME,
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
    //ssl: process.env.NODE_ENV === 'production' && {
      //ca: fs.readFileSync(__dirname + '/../mysql-ca.pem'),
    //},
    typeCast: (field, next) => {
      if (field.type === 'BIT' && field.length === 1) {
        return field.buffer()[0] === 1;
      }

      if (field.type === 'JSON') {
        return JSON.parse(field.string());
      }

      return next();
    },
  },
});

module.exports = sql;
