'use strict';
var path = require('path');

const nodemailer = require('nodemailer');
const { exec } = require('child_process');

exports.sendEmail = sendEmail;

const EMAIL_USER="dss@aegean.gr";
const EMAIL_PASS= "ddd111!!!";
const EMAIL_SERVER ="smtp.aegean.gr";
const EMAIL_SERVER_PORT="587";

/**
Sends an email and returns a Promise that it will be sent
**/
function sendEmail(receiverAddress,body){
  return new Promise( (resolve,reject) => {
    let thePath = path.join(__dirname, '..', 'resources',  'emailCredentials');
    let transporter = nodemailer.createTransport({
      host: EMAIL_SERVER,
      port: EMAIL_SERVER_PORT,
      secure: false,
      requireTLS: true, // only use if the server really does support TLS
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });
    let mailOptions = {
      from: '"AD account creation" <dss@aegean.gr>', // sender address
      to: receiverAddress,// list of receivers
      subject: 'An AD account has been created ', // Subject line
      html: body //Hello world ?</b>' // html body
    };
    transporter.sendMail(mailOptions)
    .then(result => {
      console.log(`mail sent`);
      resolve(result);
    })
    .catch(err => {
      console.log(err);
      reject(err)
    });

  });
};
