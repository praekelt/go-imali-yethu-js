var OnaFixtures = require('go-jsbox-ona').OnaFixtures;

onafixtures = new OnaFixtures({url: "http://ona.io/api/v1/"});

onafixtures.submit.add({
    data: {
        id: '1',
        submission: {
            "toilet_code":"MN34",
            "issue":"broken_toilet",
            "toilet_code_query":"MN34",
            "fault_status":"logged",
            "toilet_location":"-34.01667 -18.66404",
            "logged_date":"1970-01-01T00:00:01.337Z"
        }
    },
    response: {
        data: {
            "instanceID": "uuid:4a89f4f7cc044e45a5f887487406307e",
            "encrypted": false,
            "submissionDate": "1970-01-01T00:00:01.337Z",
            "formid": "1",
            "message": "Successful submission.",
            "markedAsCompleteDate": "1970-01-01T00:00:01.337Z"
        }
    }
});

onafixtures.submit.add({
    data: {
        "id":"1",
        "submission": {
            "toilet_code":"MN34",
            "issue": "Custom issue",
            "toilet_code_query":"MN34",
            "fault_status":"logged",
            "toilet_location":"-34.01667 -18.66404",
            "logged_date":"1970-01-01T00:00:01.337Z"
        }
    },
    response: {
        data: {
            "instanceID": "uuid:4a89f4f7cc044e45a5f887487406307e",
            "encrypted": false,
            "submissionDate": "1970-01-01T00:00:01.337Z",
            "formid": "1",
            "message": "Successful submission.",
            "markedAsCompleteDate": "1970-01-01T00:00:01.337Z"
        }
    }
});

onafixtures.submit.add({
    data: {
        "id":"1",
        "submission": {
            "toilet_code":"MN34",
            "issue": "Error issue",
            "toilet_code_query":"MN34",
            "fault_status":"logged",
            "toilet_location":"-34.01667 -18.66404",
            "logged_date":"1970-01-01T00:00:01.337Z"
        }
    },
    response: {
        data: {
            "error": "Error message."
        },
        code: 400
    }
});

module.exports = onafixtures;
