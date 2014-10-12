module.exports = function() {
    return [{
        "request": {
            "method": "GET",
            "url": "http://toilet.info/api/",
            "params": {
                "query": "MN34",
            }
        },
        "response": {
            "code": 200,
            "data": [
                {
                    "code" : "MN34",
                    "lon" : -18.66404,
                    "id" : 1,
                    "lat" : -34.01667
                }
            ]
        }
    },
    {
        "request": {
            "method": "GET",
            "url": "http://toilet.info/api/",
            "params": {
                "query": "MN",
            }
        },
        "response": {
            "code": 200,
            "data": [
                {
                    "lat" : -34.01667,
                    "code" : "MN33",
                    "id" : 4,
                    "lon" : -18.66404
                },
                {
                    "lon" : -18.66404,
                    "code" : "MN34",
                    "lat" : -34.01667,
                    "id" : 3
                },
                {
                    "lat" : -34.01667,
                    "id" : 2,
                    "code" : "MN35",
                    "lon" : -18.66404
                },
                {
                    "id" : 1,
                    "lat" : -34.01667,
                    "code" : "MN36",
                    "lon" : -18.66404
                }
            ]
        }
    },
    {
        "request": {
            "method": "GET",
            "url": "http://toilet.info/api/",
            "params": {
                "query": "MN31",
            }
        },
        "response": {
            "code": 200,
            "data": []
        }
    },
    {
        "request": {
            "method": "GET",
            "url": "http://toilet.info/api/issues/",
            "params": {}
        },
        "response": {
            "code": 200,
            "data": [
                {
                    "en": "Broken toilet",
                    "xh": "Aphukileyo indlu yangasese",
                    "value": "broken_toilet"
                },
                {
                    "en": "Broken basin",
                    "xh": "Aphukileyo isitya",
                    "value": "broken_basin"
                },
                {
                    "en": "Issue 3",
                    "xh": "Ikhathegori 3",
                    "value": "issue_3"
                },
                {
                    "en": "Issue 4",
                    "xh": "Ikhathegori 4",
                    "value": "issue_4"
                },
                {
                    "en": "Issue 5",
                    "xh": "Ikhathegori 5",
                    "value": "issue_5"
                },
                {
                    "en": "Issue 6",
                    "xh": "Ikhathegori 6",
                    "value": "issue_6"
                },
                {
                    "en": "Issue 7",
                    "xh": "Ikhathegori 7",
                    "value": "issue_7"
                },
            ]
        },
        "repeatable": "true"
    },
    {
        "request": {
            "method": "POST",
            "url": "http://besnappy.com/api/",
            "data": {
                "msisdn": "+12345",
                "issue": {
                    "en": "Broken toilet",
                    "xh": "Aphukileyo indlu yangasese",
                    "value": "broken_toilet"
                },
                "toilet": {
                    "id": 1,
                    "code": "MN34",
                    "lat": -34.01667,
                    "lon": -18.66404
                },
                "query": "MN34"
            }
        },
        "response": {
            "code": 200,
            "data": {
                "status": "OK"
            }
        }
    },
    {
        "request": {
            "method": "POST",
            "url": "http://besnappy.com/api/",
            "data": {
                "msisdn": "+12345",
                "issue": "Custom issue",
                "toilet": {
                    "id": 1,
                    "code": "MN34",
                    "lat": -34.01667,
                    "lon": -18.66404
                },
                "query": "MN34"
            }
        },
        "response": {
            "code": 200,
            "data": {
                "status": "OK"
            }
        }
    }];
};
