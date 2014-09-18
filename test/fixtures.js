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
                    "zh": "Aphukileyo indlu yangasese",
                    "value": "broken_toilet"
                },
                {
                    "en": "Broken basin",
                    "zh": "Aphukileyo isitya",
                    "value": "broken_basin"
                },
                {
                    "en": "Category 3",
                    "zh": "Ikhathegori 3",
                    "value": "category_3"
                },
                {
                    "en": "Category 4",
                    "zh": "Ikhathegori 4",
                    "value": "category_4"
                },
                {
                    "en": "Category 5",
                    "zh": "Ikhathegori 5",
                    "value": "category_5"
                },
                {
                    "en": "Category 6",
                    "zh": "Ikhathegori 6",
                    "value": "category_6"
                },
                {
                    "en": "Category 7",
                    "zh": "Ikhathegori 7",
                    "value": "category_7"
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
                    "zh": "Aphukileyo indlu yangasese",
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
