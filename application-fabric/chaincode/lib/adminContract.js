/*
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

let Patient = require('./Patient.js');
const primaryContract = require('./primaryContract.js');

class adminContract extends primaryContract {

    //Returns the last patientId in the set
    async getLatestPatientId(ctx) {
        let allResults = await this.queryAllPatients(ctx);

        return allResults[allResults.length - 1].patientId;
    }

    //Create patient in the ledger
    async createPatient(ctx, args) {
        args = JSON.parse(args);

        let newPatient = await new Patient(args.patientId, args.firstName, args.lastName, args.password, args.age, args.sex,
            args.phoneNumber, args.emergPhoneNumber, args.address, args.bloodGroup, args.changedBy, args.allergies);
        const exists = await this.patientExists(ctx, newPatient.patientId);
        if (exists) {
            throw new Error(`The patient ${newPatient.patientId} already exists`);
        }
        const buffer = Buffer.from(JSON.stringify(newPatient));
        await ctx.stub.putState(newPatient.patientId, buffer);
    }

    //Read patient details based on patientId
    async readPatient(ctx, patientId) {
        let asset = await super.readPatient(ctx, patientId)

        asset = ({
            patientId: patientId,
            firstName: asset.firstName,
            lastName: asset.lastName
        });
        return asset;
    }

    //Delete patient from the ledger based on patientId
    async deletePatient(ctx, patientId) {
        const exists = await this.patientExists(ctx, patientId);
        if (!exists) {
            throw new Error(`The patient ${patientId} does not exist`);
        }
        await ctx.stub.deleteState(patientId);
    }


    //Retrieves all patients details
    async queryAllPatients(ctx) {
        let resultsIterator = await ctx.stub.getStateByRange('', '');
        let asset = await this.getAllPatientResults(resultsIterator, false);

        return this.fetchLimitedFields(asset);
    }

    fetchLimitedFields = asset => {
        for (let i = 0; i < asset.length; i++) {
            const obj = asset[i];
            asset[i] = {
                patientId: obj.Key,
                firstName: obj.Record.firstName,
                lastName: obj.Record.lastName
            };
        }

        return asset;
    }
}
module.exports = adminContract;