module.exports = function() {
    return [{
        "request": {
            "method": "GET",
            "url": "http://toilet.info/api/",
            "params": {
                "query": "MN34",
                "threshold": "0",
                "max_results": "5"
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
                "threshold": "0",
                "max_results": "5"
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
                "threshold": "0",
                "max_results": "5"
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
                    "id": 1,
                    "value": "broken_toilet",
                    "translations": [{
                        "language": "en",
                        "description": "Broken toilet"
                    }, {
                        "language": "xh",
                        "description": "Aphukileyo indlu yangasese",
                    }]
                },
                {
                    "id": 2,
                    "value": "broken_basin",
                    "translations": [{
                        "language": "en",
                        "description": "Broken basin"
                    }, {
                        "language": "xh",
                        "description": "Aphukileyo isitya"
                    }]
                },
                {
                    "id": 3,
                    "value": "issue_3",
                    "translations": [{
                        "language": "en",
                        "description": "Issue 3"
                    }, {
                        "language": "xh",
                        "description": "Ikhathegori 3"
                    }]
                },
                {
                    "id": 4,
                    "value": "issue_4",
                    "translations": [{
                        "language": "en",
                        "description": "Issue 4"
                    }, {
                        "language": "xh",
                        "description": "Ikhathegori 4"
                    }]
                },
                {
                    "id": 5,
                    "value": "issue_5",
                    "translations": [{
                        "language": "en",
                        "description": "Issue 5"
                    }, {
                        "language": "xh",
                        "description": "Ikhathegori 5"
                    }]
                }
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
