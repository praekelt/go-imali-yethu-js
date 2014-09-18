module.exports = function() {
    return [{
        "request": {
            "method": "GET",
            "url": "http://toilet.info/api/",
            "params": {
                "q": "MN34",
                "format": "json"
            }
        },
        "response": {
            "code": 200,
            "data": [
                {
                    "code": "MN34",
                    "long": "3.14159",
                    "lat": "2.71828"
                }
            ]
        }
    },
    {
        "request": {
            "method": "GET",
            "url": "http://toilet.info/api/",
            "params": {
                "q": "MN",
                "format": "json"
            }
        },
        "response": {
            "code": 200,
            "data": [
                {
                    "code": "MN33",
                    "long": "3.14159",
                    "lat": "2.71828"
                },
                {
                    "code": "MN34",
                    "long": "2.71828",
                    "lat": "3.14159"
                },
                {
                    "code": "MN35",
                    "long": "1.12358",
                    "lat": "3.14159"
                },
                {
                    "code": "MN36",
                    "long": "2.71828",
                    "lat": "1.12358"
                }
            ]
        }
    },
    {
        "request": {
            "method": "GET",
            "url": "http://toilet.info/api/",
            "params": {
                "q": "MN31",
                "format": "json"
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
                    "code": "MN34",
                    "lat": "2.71828",
                    "long": "3.14159"
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
                    "code": "MN34",
                    "lat": "2.71828",
                    "long": "3.14159"
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
