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
            "method": "POST",
            "url": "http://besnappy.com/api/",
            "data": {
                "msisdn": "+12345",
                "issue": "Broken toilet",
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
