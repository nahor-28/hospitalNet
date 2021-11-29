/*
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

const { Contract } = require('fabric-contract-api');
let initPatients = require('./initLedger.json');

class primaryContract extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        for (let i = 0; i < initPatients.length; i++) {
            initPatients[i].docType = 'patient';
            await ctx.stub.putState('PID' + i, Buffer.from(JSON.stringify(initPatients[i])));
            console.info('Added <--> ', initPatients[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    //Read patient details based on patientId
    async readPatient(ctx, patientId) {
        const exists = await this.patientExists(ctx, patientId);
        if (!exists) {
            throw new Error(`The patient ${patientId} does not exist`);
        }

        const buffer = await ctx.stub.getState(patientId);
        let asset = JSON.parse(buffer.toString());
        asset = ({
            patientId: patientId,
            firstName: asset.firstName,
            lastName: asset.lastName,
            age: asset.age,
            sex: asset.sex,
            phoneNumber: asset.phoneNumber,
            emergPhoneNumber: asset.emergPhoneNumber,
            address: asset.address,
            bloodGroup: asset.bloodGroup,
            allergies: asset.allergies,
            ehrFile: asset.ehrFile,
            symptoms: asset.symptoms,
            diagnosis: asset.diagnosis,
            treatment: asset.treatment,
            followUp: asset.followUp,
            changedBy: asset.changedBy,
            permissionGranted: asset.permissionGranted,
            password: asset.password,
            pwdTemp: asset.pwdTemp
        });
        return asset;
    }

    async patientExists(ctx, patientId) {
        const buffer = await ctx.stub.getState(patientId);
        return (!!buffer && buffer.length > 0);
    }


    async getAllPatientResults(iterator, isHistory) {
        let allResults = [];
        while (true) {
            let res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                console.log(res.value.value.toString('utf8'));

                if (isHistory && isHistory === true) {
                    jsonRes.Timestamp = res.value.timestamp;
                }
                jsonRes.Key = res.value.key;

                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Record = res.value.value.toString('utf8');
                }
                allResults.push(jsonRes);
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return allResults;
            }
        }
    }
}
module.exports = primaryContract;