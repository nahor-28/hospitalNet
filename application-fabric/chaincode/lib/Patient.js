
class Patient {

    constructor(patientId, firstName, lastName, password, age, sex, phoneNumber, emergPhoneNumber, address, bloodGroup,
        changedBy = '', allergies = '', ehrFile = '', symptoms = '', diagnosis = '', treatment = '', followUp = '')
    {
        this.patientId = patientId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.password = password;
        this.age = age;
        this.sex = sex;
        this.phoneNumber = phoneNumber;
        this.emergPhoneNumber = emergPhoneNumber;
        this.address = address;
        this.bloodGroup = bloodGroup;
        this.changedBy = changedBy;
        this.allergies = allergies;
        this.ehrFile = ehrFile;
        this.symptoms = symptoms;
        this.diagnosis = diagnosis;
        this.treatment = treatment;
        this.followUp = followUp;
        this.permissionGranted = [];
        this.pwdTemp = true;
        return this;
    }
}
module.exports = Patient