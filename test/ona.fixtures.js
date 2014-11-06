var OnaFixtures = require('go-jsbox-ona').OnaFixtures;

onafixtures = new OnaFixtures({url: "http://ona.io/api/v1/"});

onafixtures.submit.add({
    data: {
        id: '1',
        submission: {
            "toilet_code":"MN34",
            "toilet_section": "MN",
            "toilet_cluster": 4,
            "issue":"broken_toilet",
            "fault_status":"logged",
            "toilet_location":"-34.01667 -18.66404",
            "logged_date":"1970-01-01T02:00:01+02:00"
        }
    },
    response: {
        data: {
            "instanceID": "uuid:4a89f4f7cc044e45a5f887487406307e",
            "encrypted": false,
            "submissionDate": "1970-01-01T02:00:01+02:00",
            "formid": "1",
            "message": "Successful submission.",
            "markedAsCompleteDate": "1970-01-01T02:00:01+02:00"
        }
    }
});

onafixtures.submit.add({
    data: {
        "id":"1",
        "submission": {
            "toilet_code":"MN34",
            "toilet_section": "MN",
            "toilet_cluster": 4,
            "issue": "Custom issue",
            "fault_status":"logged",
            "toilet_location":"-34.01667 -18.66404",
            "logged_date":"1970-01-01T02:00:01+02:00"
        }
    },
    response: {
        data: {
            "instanceID": "uuid:4a89f4f7cc044e45a5f887487406307e",
            "encrypted": false,
            "submissionDate": "1970-01-01T02:00:01+02:00",
            "formid": "1",
            "message": "Successful submission.",
            "markedAsCompleteDate": "1970-01-01T02:00:01+02:00"
        }
    }
});

onafixtures.submit.add({
    data: {
        "id":"1",
        "submission": {
            "toilet_code":"MN34",
            "toilet_section": "MN",
            "toilet_cluster": 4,
            "issue": "Error issue",
            "fault_status":"logged",
            "toilet_location":"-34.01667 -18.66404",
            "logged_date":"1970-01-01T02:00:01+02:00"
        }
    },
    response: {
        data: {
            "error": "Error message."
        },
        code: 400
    }
});

onafixtures.submit.add({
    data: {
        "id":"1",
        "submission": {
            "toilet_code":"MN",
            "toilet_section": "None",
            "toilet_cluster": "None",
            "issue": "broken_toilet",
            "fault_status": "logged",
            "logged_date": "1970-01-01T02:00:01+02:00"
        }
    },
    response: {
        data: {
            "instanceID": "uuid:4a89f4f7cc044e45a5f887487406307e",
            "encrypted": false,
            "submissionDate": "1970-01-01T02:00:01+02:00",
            "formid": "1",
            "message": "Successful submission.",
            "markedAsCompleteDate": "1970-01-01T02:00:01+02:00"
        }
    }
});

module.exports = onafixtures;
