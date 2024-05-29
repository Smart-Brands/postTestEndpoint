const Readable = require('stream').Readable;
// var Client = require('ssh2').Client;
let Client = require('ssh2-sftp-client');
let sftp = new Client();
var zlib = require('zlib');
var fs = require('fs');

module.exports.upload = async (csvupload, csvdownload) => {
  var buf1 = Buffer.from(csvupload, 'utf-8');
  var buf2 = Buffer.from(csvdownload, 'utf-8');
  let x = new Date();
  let yy = x.getUTCFullYear();
  let mm = x.getUTCMonth() + 1;
  let dd = x.getUTCDate();
  let mmstr = '' + mm;
  let ddstr = '' + dd;
  mmstr = mmstr.length === 1 ? '0' + mmstr : mmstr;
  ddstr = ddstr.length === 1 ? '0' + ddstr : ddstr;
  let str = `${yy}${mmstr}${ddstr}`;
  console.log(`Filename is :: ${yy}${mmstr}${ddstr}`);
  let filenameforupload = `InboxMailers_load_${str}.csv.gz`;
  let filenamefordownload = `InboxMailers_delete_${str}.csv.gz`;
  const remoteforupload = `/rto_updates/${filenameforupload}`;
  const remotefordownload = `/rto_updates/${filenamefordownload}`;

  return new Promise(function (resolve, reject) {
    sftp
      .connect({
        host: process.env.SFTP_URI,
        port: process.env.SFTP_PORT,
        username: process.env.SFTP_USER_NAME,
        password: process.env.SFTP_PASSWORD,
      })
      .then(() => {
        let dataStream = zlib.gzipSync(buf1);
        console.log('Created zip datastream');
        console.log('Starting SFTP');
        return sftp.put(dataStream, remoteforupload);
      })
      .then(data => {
        console.log(data, 'the data info');
        let dataStream = zlib.gzipSync(buf2);
        console.log('Created zip datastream');
        console.log('Starting SFTP');
        return sftp.put(dataStream, remotefordownload);
      })
      .then(data => {
        console.log('****', data);
        sftp.end();
        resolve({
          sftploadedfilename: remoteforupload,
          sftpdeletedfilename: remotefordownload,
        });
      })
      .catch(err => {
        console.log(err, 'catch error');
        reject(err);
      });
  });
};

module.exports.download = async (csv, action) => {
  console.log('action is', action);
  var buf = Buffer.from(csv, 'utf-8');
  let stream = bufferToStream(buf);
  // console.log('stream is',stream)
  let x = new Date();
  console.log(x);
  let yy = x.getUTCFullYear();
  let mm = x.getUTCMonth() + 1;
  let dd = x.getUTCDate();
  console.log(dd);
  let mmstr = '' + mm;
  let ddstr = '' + dd;
  mmstr = mmstr.length === 1 ? '0' + mmstr : mmstr;
  ddstr = ddstr.length === 1 ? '0' + ddstr : ddstr;
  let str = `${yy}${mmstr}${ddstr}`;
  console.log(`Filename is :: ${yy}${mmstr}${ddstr}`);
  let filename = `InboxMailers_${action}_${str}.csv.gz`;
  const remote = `/rto_updates/${filename}`;
  var gz = zlib.createGzip();
  let dst = fs.createWriteStream('src/exports/file.txt');

  return new Promise(function (resolve, reject) {
    sftp
      .connect({
        host: process.env.SFTP_URI,
        port: process.env.SFTP_PORT,
        username: process.env.SFTP_USER_NAME,
        password: process.env.SFTP_PASSWORD,
      })
      .then(() => {
        return sftp.get('/rto_updates/InboxMailers_load_20230306.csv.gz');
      })
      .then(data => {
        console.log(data);
        sftp.end();
        resolve(data);
      })
      .catch(err => {
        console.log(err, 'catch error');
        reject(err);
      });
  });
};

module.exports.delete = async (csv, action) => {
  console.log('action is', action);
  var buf = Buffer.from(csv, 'utf-8');
  console.log('Buffer Value: ' + buf);
  let stream = bufferToStream(buf);
  let x = new Date();
  let yy = x.getUTCFullYear();
  let mm = x.getUTCMonth() + 1;
  let dd = x.getUTCDate() - 1;
  let mmstr = '' + mm;
  let ddstr = '' + dd;
  mmstr = mmstr.length === 1 ? '0' + mmstr : mmstr;
  ddstr = ddstr.length === 1 ? '0' + ddstr : ddstr;
  let str = `${yy}${mmstr}${ddstr}`;
  console.log(`Filename is :: ${yy}${mmstr}${ddstr}`);
  let filename = `InboxMailers_${action}_${str}.csv.gz`;
  return new Promise(function (resolve, reject) {
    sftp
      .connect({
        host: process.env.SFTP_URI,
        port: process.env.SFTP_PORT,
        username: process.env.SFTP_USER_NAME,
        password: process.env.SFTP_PASSWORD,
      })
      .then(() => {
        return sftp.delete('/rto_updates/InboxMailers_load_20230308.csv.gz');
      })
      .then(data => {
        // console.log(data, 'the data info');
        sftp.end();
        resolve(data);
      })
      .catch(err => {
        console.log(err, 'catch error');
        reject(err);
      });
  });
};

function bufferToStream(buffer) {
  var stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
