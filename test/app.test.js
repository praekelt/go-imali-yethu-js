var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;
var assert = require('assert');

languages = ['en', 'xh'];

describe("App", function() {
    var app;
    var tester;

    beforeEach(function() {
        app = new go.app.GoApp();

        tester = new AppTester(app);

        tester
            .setup.config.app({
                name: 'test_app',
                toilet_api_url: 'http://toilet.info/api/',
                snappy_api_url: 'http://besnappy.com/api/',
                issues: [
                    'Broken toilet',
                    'Broken basin',
                    'Category 3',
                    'Category 4',
                    'Category 5',
                    'Category 6',
                    'Category 7',
                ]
            })
            .setup(function(api) {
                fixtures().forEach(api.http.fixtures.add);
            });
    });

    describe("when a new user starts a session", function() {
        it("should give them a language selection", function() {
            return tester
                .start()
                .check.interaction({
                    state: 'states:select-language',
                    reply: [
                        'Welcome to Imali Yethu sanitation reporting ',
                        'service. Please choose your language:\n1. ',
                        'English\n2. isiXhosa'].join(''),
                    char_limit: 139
                })
                .run();
        });
    });

    describe("When a new user selects their language", function() {
        languages.map(function(lang, index) {
            it("should store their language choice " + lang, function() {
                return tester
                    .input(String(index + 1))
                    .check.user.lang(lang)
                    .run();
            });
            it("should limit the response length " + lang, function() {
                return tester
                    .input(String(index + 1))
                    .check.interaction({char_limit: 139})
                    .run();
            });
        });

        it("should ask them for the toilet code", function() {
            return tester
                .input('1')
                .check.interaction({
                    state: 'states:input-toilet-code',
                    reply: ['Please input the code for the toilet. e.g. MN34',
                        ' (You will find this on a sticker in the toilet)'
                        ].join(''),
                    char_limit: 139
                })
                .run();
        });
    });

    describe("When an existing user starts a session", function() {
        it("should ask them for the toilet code", function() {
            return tester
                .setup.user.lang('en')
                .start()
                .check.interaction({
                    state: 'states:input-toilet-code',
                    reply: ['Please input the code for the toilet. e.g. MN34',
                        ' (You will find this on a sticker in the toilet)'
                        ].join(''),
                })
                .run();
        });

        languages.map(function(lang) {
            it("should limit the length of the response " + lang, function() {
                return tester
                    .setup.user.lang(lang)
                    .start()
                    .check.interaction({char_limit: 129})
                    .run();
            });
        });
    });

    describe("When a user enters a query with multiple results", function() {
        it("should ask to refine the selection", function() {
            return tester
                .setup.user.lang('en')
                .input("MN")
                .check.interaction({
                    state: 'states:refine-response',
                    reply: ["Sorry your code doesn't match what is in our ",
                        "database. Could it be one of these instead?",
                        "\n1. MN33\n2. MN34\n3. MN35\n4. MN36\n5. Not the code"
                        ].join(''),
                    char_limit: 139
                })
                .run();
        });

        it("should send the request to toilet API", function() {
            return tester
                .setup.user.lang('en')
                .input("MN")
                .check(function(api, im , app) {
                    http_sent = api.http.requests[0];
                    assert.equal(http_sent.url, 'http://toilet.info/api/');
                    assert.deepEqual(http_sent.params, {
                        "q": "MN",
                        "format": "json"
                    });
                })
                .run();
        });

        languages.map(function(lang) {
            it("should limit the length of the response " + lang, function() {
                return tester
                    .setup.user.lang(lang)
                    .input('MN')
                    .check.interaction({
                        char_limit: 139
                    })
                    .run();
            });
        });
        
    });

    describe("When a user refines the selection", function() {
        it("should request the issue", function() {
            return tester
                .setup.user.lang('en')
                .inputs('MN', '1')
                .check.interaction({
                    state: 'states:report-issue',
                    reply: [
                        'What is the issue?',
                        '1. Broken toilet',
                        '2. Broken basin',
                        '3. Category 3',
                        '4. Category 4',
                        '5. Category 5',
                        '6. Category 6',
                        '7. Category 7',
                        '8. Other'].join('\n'),
                    char_limit: 139
                })
                .run();
        });
        languages.map(function(lang) {
            it("should limit the length of the response " + lang, function() {
                return tester
                    .setup.user.lang(lang)
                    .inputs('MN', '1')
                    .check.interaction({
                        char_limit: 139
                    })
                    .run();
            });
        });
    });

    describe("When a user enters a query with one result", function() {
        beforeEach(function() {
            tester
                .setup.user.lang('en')
                .input('MN34');
        });

        it("should send the request to toilet API", function() {
            return tester
                .check(function(api, im , app) {
                    http_sent = api.http.requests[0];
                    assert.equal(http_sent.url, 'http://toilet.info/api/');
                    assert.deepEqual(http_sent.params, {
                        "q": "MN34",
                        "format": "json"
                    });
                })
                .run();
        });

        it("should request the issue", function() {
            return tester
                .check.interaction({
                    state: 'states:report-issue',
                    reply: [
                        'What is the issue?',
                        '1. Broken toilet',
                        '2. Broken basin',
                        '3. Category 3',
                        '4. Category 4',
                        '5. Category 5',
                        '6. Category 6',
                        '7. Category 7',
                        '8. Other'].join('\n'),
                    char_limit: 139
                })
                .run();
        });

        it("should send the toilet data in creator_opts", function() {
            return tester
                .check.user.state({
                    creator_opts: {
                        "code": "MN34",
                        "lat": "2.71828",
                        "long": "3.14159"
                    },
                    metadata: {},
                    name: 'states:report-issue'
                })
                .run();
        });

        languages.map(function(lang) {
            it("should limit the length of the response " + lang, function() {
                return tester
                    .check.interaction({
                        char_limit: 139
                    })
                    .run();
            });
        });
    });

    describe("When a user selects an issue", function() {
        it("should notify the user that the report has been sent", function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .inputs('MN34', '1')
                .check.interaction({
                    state: 'states:send-report',
                    reply: ["Thanks for your report. We will notify the City ",
                        "of Cape Town of your issue and inform you of any ",
                        "updates via SMS or Call. Imali Yethu"].join(''),
                    char_limit: 139
                })
                .run();
        });

        it("should send the information to snappy bridge", function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .inputs('MN34', '1')
                .check(function(api, im , app) {
                    http_sent = api.http.requests[1];
                    assert.equal(http_sent.url, 'http://besnappy.com/api/');
                    assert.deepEqual(http_sent.data, {
                        "msisdn": "+12345",
                        "toilet": {
                            "code": "MN34",
                            "long": "3.14159",
                            "lat": "2.71828"
                        },
                        "issue": "Broken toilet"
                    });
                })
                .run();
        });

        languages.map(function(lang) {
            it("should limit the length of the response " + lang, function() {
                return tester
                    .setup.user.lang(lang)
                    .setup.user.addr('+12345')
                    .inputs('MN34', '1')  
                    .check.interaction({
                        char_limit: 139
                    })
                    .run();
            });
        });
    });

    describe("When the user selects other as issue", function() {
        it("should request the user for the issue", function() {
            return tester
                .setup.user.lang('en')
                .inputs('MN34', '8')
                .check.interaction({
                    state: 'states:custom-issue',
                    reply: 'Please type the issue with the toilet.',
                    char_limit: 139
                })
                .run();
        });

        languages.map(function(lang) {
            it("should limit the length of the response " + lang, function() {
                return tester
                    .setup.user.lang(lang)
                    .inputs('MN34', '8')
                    .check.interaction({
                        char_limit: 139
                    })
                    .run();
            });
        });
    });

    describe("When the user types a custom issue", function() {
        it("should acknowledge the report as sent", function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .inputs("MN34", "8", "Custom issue")
                .check.interaction({
                    state: 'states:send-report',
                    reply: ["Thanks for your report. We will notify the City ",
                        "of Cape Town of your issue and inform you of any ",
                        "updates via SMS or Call. Imali Yethu"].join(''),
                    char_limit: 139
                })
                .run();
        });

        it("should send the custom issue to snappy", function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .inputs("MN34", "8", "Custom issue")
                .check(function(api, im , app) {
                    http_sent = api.http.requests[1];
                    assert.equal(http_sent.url, 'http://besnappy.com/api/');
                    assert.deepEqual(http_sent.data, {
                        "msisdn": "+12345",
                        "toilet": {
                            "code": "MN34",
                            "long": "3.14159",
                            "lat": "2.71828"
                        },
                        "issue": "Custom issue"
                    });
                })
                .run();
        });

        languages.map(function(lang) {
            it("should limit the length of the response " + lang, function() {
                return tester
                    .setup.user.lang(lang)
                    .setup.user.addr('+12345')
                    .inputs('MN34', '8', 'Custom issue')
                    .check.interaction({
                        char_limit: 139
                    })
                    .run();
            });
        });        
    });

});