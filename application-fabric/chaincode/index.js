
'use strict';

const primaryContract = require('./lib/primaryContract.js');
const adminContract = require('./lib/adminContract.js');
const patientContract = require('./lib/patientContract.js');
const doctorContract = require('./lib/doctorContract.js');

module.exports.contracts = [ primaryContract, patientContract, adminContract, doctorContract ];
