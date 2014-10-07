var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;
var assert = require('assert');
var xh_translation = require('../translations/xh');

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
                toilet_api_issue_url: 'http://toilet.info/api/issues/', 
            })
            .setup.config({
                'translation.xh': xh_translation
            })
            .setup(function(api) {
                fixtures().forEach(api.http.fixtures.add);
            })
            .setup.char_limit(139);
    });

    describe("when a new user starts a session", function() {
        it("should give them a language selection", function() {
            return tester
                .start()
                .check.interaction({
                    state: 'states:select-language',
                    reply: [
                        'Welcome to Imali Yethu toilet reporting service. ',
                        'Please choose your language:',
                        '\n1. English',
                        '\n2. isiXhosa'].join(''),
                })
                .check.reply.char_limit()
                .run();
        });

        it('should trigger the unique user metrics', function() {
            return tester
                .start()
                .check(function(api) {
                    metrics = api.metrics.stores.test_app.unique_users;
                    metrics_trans = api.metrics.stores.test_app
                        ['unique_users.transient'];
                    assert.deepEqual(metrics, {agg: 'last', values: [ 1 ]});
                    assert.deepEqual(metrics_trans, {agg: 'sum', values: [1]});
                })
                .run();
        });

        it('should trigger the total sessions metrics', function() {
            return tester
                .start()
                .check(function(api) {
                    metrics = api.metrics.stores.test_app.total_sessions;
                    metrics_trans = api.metrics.stores.test_app
                        ['total_sessions.transient'];
                    assert.deepEqual(metrics, {agg: 'last', values: [ 1 ]});
                    assert.deepEqual(metrics_trans, {agg: 'sum', values: [1]});
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
                    .check.reply.char_limit()
                    .run();
            });
        });

        it("should ask them for the toilet code", function() {
            return tester
                .input('1')
                .check.interaction({
                    state: 'states:input-toilet-code',
                    reply: 'Enter the toilet number.'
                })
                .check.reply.char_limit()
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
                    reply: 'Enter the toilet number.'
                })
                .check.reply.char_limit()
                .run();
        });

        languages.map(function(lang) {
            it("should limit the length of the response " + lang, function() {
                return tester
                    .setup.user.lang(lang)
                    .start()
                    .check.reply.char_limit()
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
                })
                .check.reply.char_limit()
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
                .check.reply.char_limit()
                .run();
        });

        languages.map(function(lang) {
            it("should limit the length of the response " + lang, function() {
                return tester
                    .setup.user.lang(lang)
                    .input('MN')
                    .check.reply.char_limit()
                    .run();
            });
        });
    });

    describe("When a user enters a query with zero results", function() {
        it("should forward the query and blank toilet data and get issues", 
            function() {
            return tester
                .setup.user.lang('en')
                .input('MN31')
                .check.user.state({
                    creator_opts: {
                        "choices":  [
                            {
                              "en": "Broken toilet",
                              "value": "broken_toilet",
                              "xh": "Aphukileyo indlu yangasese"
                            },
                            {
                              "en": "Broken basin",
                              "value": "broken_basin",
                              "xh": "Aphukileyo isitya"
                            },
                            {
                              "en": "Issue 3",
                              "value": "issue_3",
                              "xh": "Ikhathegori 3"
                            },
                            {
                              "en": "Issue 4",
                              "value": "issue_4",
                              "xh": "Ikhathegori 4"
                            },
                            {
                              "en": "Issue 5",
                              "value": "issue_5",
                              "xh": "Ikhathegori 5"
                            },
                            {
                              "en": "Issue 6",
                              "value": "issue_6",
                              "xh": "Ikhathegori 6"
                            },
                            {
                              "en": "Issue 7",
                              "value": "issue_7",
                              "xh": "Ikhathegori 7"
                            }
                        ],
                        'query': 'MN31', 
                        'toilet':{}},
                    metadata: {
                        "page_start": 0
                    },
                    name: 'states:report-issue'
                })
                .check.reply.char_limit()
                .run();
        });

        it("should ask the user for the issue (en)", function() {
            return tester
                .setup.user.lang('en')
                .input('MN31')
                .check.interaction({
                    state: 'states:report-issue',
                    reply: [
                        'What is the problem?',
                        '1. Broken toilet',
                        '2. Broken basin',
                        '3. Issue 3',
                        '4. Issue 4',
                        '5. Issue 5',
                        '6. Issue 6',
                        '7. Issue 7',
                        '8. Other'].join('\n'),
                })
                .check.reply.char_limit()
                .run();
        });

        it("should ask the user for the issue (xh)", function() {
            return tester
                .setup.user.lang('xh')
                .input('MN31')
                .check.interaction({
                    state: 'states:report-issue',
                    reply: [
                        'Yintoni ingxaki?',
                        '1. Aphukileyo indlu yangasese',
                        '2. Aphukileyo isitya',
                        '3. Ikhathegori 3',
                        '4. Ikhathegori 4',
                        '5. Ikhathegori 5',
                        '6. More'].join('\n'),
                })
                .check.reply.char_limit()
                .run();
        });
    });

    describe("If there isn't a translation for an issue", function() {
        it("should use the translation value", function() {
            return tester
                .setup.user.lang('zu')
                .setup.user.state('states:input-toilet-code')
                .input('MN31')
                .check.interaction({
                    state: 'states:report-issue',
                    reply: [
                        'What is the problem?',
                        '1. broken_toilet',
                        '2. broken_basin',
                        '3. issue_3',
                        '4. issue_4',
                        '5. issue_5',
                        '6. issue_6',
                        '7. issue_7',
                        '8. Other',
                    ].join('\n')
                })
                .check.reply.char_limit()
                .run();
        });
    });

    describe("When the user selects Not the code from list", function() {
        it("should request the issue", function() {
            return tester
                .setup.user.lang('en')
                .inputs('MN', '5')
                .check.interaction({
                    state: 'states:report-issue',
                    reply: [
                        'What is the problem?',
                        '1. Broken toilet',
                        '2. Broken basin',
                        '3. Issue 3',
                        '4. Issue 4',
                        '5. Issue 5',
                        '6. Issue 6',
                        '7. Issue 7',
                        '8. Other'].join('\n'),
                })
                .check.reply.char_limit()
                .run();
        });

        it("should store the user query and blank toilet data", function() {
            return tester
                .setup.user.lang('en')
                .inputs('MN', '5')
                .check.user.state({
                    creator_opts: {
                        "choices":  [
                            {
                              "en": "Broken toilet",
                              "value": "broken_toilet",
                              "xh": "Aphukileyo indlu yangasese"
                            },
                            {
                              "en": "Broken basin",
                              "value": "broken_basin",
                              "xh": "Aphukileyo isitya"
                            },
                            {
                              "en": "Issue 3",
                              "value": "issue_3",
                              "xh": "Ikhathegori 3"
                            },
                            {
                              "en": "Issue 4",
                              "value": "issue_4",
                              "xh": "Ikhathegori 4"
                            },
                            {
                              "en": "Issue 5",
                              "value": "issue_5",
                              "xh": "Ikhathegori 5"
                            },
                            {
                              "en": "Issue 6",
                              "value": "issue_6",
                              "xh": "Ikhathegori 6"
                            },
                            {
                              "en": "Issue 7",
                              "value": "issue_7",
                              "xh": "Ikhathegori 7"
                            }
                          ],
                        'query': 'MN',
                        'toilet': {}},
                    metadata: {
                        "page_start": 0
                    },
                    name: 'states:report-issue'
                })
                .run();
        });

        languages.map(function(lang) {
            it("should limit the length of the response " + lang, function() {
                return tester
                    .setup.user.lang(lang)
                    .inputs('MN', '5')
                    .check.reply.char_limit()
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
                        'What is the problem?',
                        '1. Broken toilet',
                        '2. Broken basin',
                        '3. Issue 3',
                        '4. Issue 4',
                        '5. Issue 5',
                        '6. Issue 6',
                        '7. Issue 7',
                        '8. Other'].join('\n'),
                })
                .check.reply.char_limit()
                .run();
        });

        languages.map(function(lang) {
            it("should limit the length of the response " + lang, function() {
                return tester
                    .setup.user.lang(lang)
                    .inputs('MN', '1')
                    .check.reply.char_limit()
                    .run();
            });
        });
    });

    describe("When a user enters a query with one result", function() {
        it("should send the request to toilet API", function() {
            return tester
                .setup.user.lang('en')
                .input('MN34')
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
                .setup.user.lang('en')
                .input('MN34')
                .check.interaction({
                    state: 'states:report-issue',
                    reply: [
                        'What is the problem?',
                        '1. Broken toilet',
                        '2. Broken basin',
                        '3. Issue 3',
                        '4. Issue 4',
                        '5. Issue 5',
                        '6. Issue 6',
                        '7. Issue 7',
                        '8. Other'].join('\n'),
                })
                .check.reply.char_limit()
                .run();
        });

        it("should send the toilet and query data in creator_opts", function(){
            return tester
                .setup.user.lang('en')
                .input('MN34')
                .check.user.state({
                    creator_opts: {
                        choices:  [
                            {
                              "en": "Broken toilet",
                              "value": "broken_toilet",
                              "xh": "Aphukileyo indlu yangasese"
                            },
                            {
                              "en": "Broken basin",
                              "value": "broken_basin",
                              "xh": "Aphukileyo isitya"
                            },
                            {
                              "en": "Issue 3",
                              "value": "issue_3",
                              "xh": "Ikhathegori 3"
                            },
                            {
                              "en": "Issue 4",
                              "value": "issue_4",
                              "xh": "Ikhathegori 4"
                            },
                            {
                              "en": "Issue 5",
                              "value": "issue_5",
                              "xh": "Ikhathegori 5"
                            },
                            {
                              "en": "Issue 6",
                              "value": "issue_6",
                              "xh": "Ikhathegori 6"
                            },
                            {
                              "en": "Issue 7",
                              "value": "issue_7",
                              "xh": "Ikhathegori 7"
                            }
                        ],
                        toilet: {
                            "code": "MN34",
                            "lat": "2.71828",
                            "long": "3.14159"
                        },
                        query: "MN34"},
                    metadata: {
                        "page_start": 0
                    },
                    name: 'states:report-issue'
                })
                .run();
        });

        languages.map(function(lang) {
            it("should limit the length of the response " + lang, function() {
                return tester
                    .setup.user.lang(lang)
                    .input('MN34')
                    .check.reply.char_limit()
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
                    reply: ['Thanks for your report. We will notify the CoCT ',
                            'of your issue and inform you of any updates via ',
                            'SMS or Call. Imali Yethu.'
                            ].join(''),
                })
                .check.reply.char_limit()
                .run();
        });

        it("should send the information to snappy bridge", function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .inputs('MN34', '1')
                .check(function(api, im , app) {
                    http_sent = api.http.requests[api.http.requests.length-1];
                    assert.equal(http_sent.url, 'http://besnappy.com/api/');
                    assert.deepEqual(http_sent.data, {
                        "msisdn": "+12345",
                        "toilet": {
                            "code": "MN34",
                            "long": "3.14159",
                            "lat": "2.71828"
                        },
                        "issue": {
                            "en": "Broken toilet",
                            "xh": "Aphukileyo indlu yangasese",
                            "value": "broken_toilet"
                        },
                        "query": "MN34"
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
                    .check.reply.char_limit()
                    .run();
            });
        });

        it('should trigger the total completed reports metric', function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .inputs('MN34', '1')
                .check(function(api) {
                    metrics = api.metrics.stores.test_app
                        .total_completed_reports;
                    metrics_trans = api.metrics.stores.test_app
                        ['total_completed_reports.transient'];
                    assert.deepEqual(metrics, {agg: 'last', values: [ 1 ]});
                    assert.deepEqual(metrics_trans, {agg: 'sum', values: [1]});
                })
                .run();
        });

        it('should trigger the average sessions per report metric', function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .inputs(null, 'MN34', '1')
                .check(function(api) {
                    metrics = api.metrics.stores.test_app
                        .average_sessions_per_report;
                    assert.deepEqual(metrics, {agg: 'avg', values: [ 1 ]});
                })
                .run();
        });

        it('should trigger the time per report metrics', function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .setup.user.state('states:detect-language')
                .inputs(null, 'MN34', '1')
                .check(function(api) {
                    metrics = api.metrics.stores.test_app.time_per_report;
                    assert.equal(metrics.agg, 'avg');
                    assert.equal(metrics.values.length, 1);
                })
                .run();
        });
    });

    describe("When the user selects other as issue", function() {
        it("should request the user for the issue", function() {
            return tester
                .setup.user.lang('en')
                .inputs('MN34', '8')
                .check.interaction({
                    state: 'states:custom-issue',
                    reply: 'Please type your issue with the toilet.',
                })
                .check.reply.char_limit()
                .run();
        });

        languages.map(function(lang) {
            it("should limit the length of the response " + lang, function() {
                return tester
                    .setup.user.lang(lang)
                    .inputs('MN34', '8')
                    .check.reply.char_limit()
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
                    reply: ['Thanks for your report. We will notify the CoCT ',
                            'of your issue and inform you of any updates via ',
                            'SMS or Call. Imali Yethu.'
                            ].join(''),
                })
                .check.reply.char_limit()
                .run();
        });

        it("should send the custom issue to snappy", function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .inputs("MN34", "8", "Custom issue")
                .check(function(api, im , app) {
                    http_sent = api.http.requests[api.http.requests.length-1];
                    assert.equal(http_sent.url, 'http://besnappy.com/api/');
                    assert.deepEqual(http_sent.data, {
                        "msisdn": "+12345",
                        "toilet": {
                            "code": "MN34",
                            "long": "3.14159",
                            "lat": "2.71828"
                        },
                        "issue": "Custom issue",
                        "query": "MN34"
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
                    .check.reply.char_limit()
                    .run();
            });
        });
    });

    describe('Per screen timing metrics', function() {
        it('should have a timing metric for screen 1', function() {
            return tester
                .inputs(null, '1')
                .check(function(api) {
                    metrics = api.metrics.stores.test_app
                        .time_per_screen_1_select_language;
                    assert.equal(metrics.agg, 'avg');
                    assert.equal(metrics.values.length, 1);
                })
                .run();
        });

        it('should have a timing metric for screen 2', function() {
            return tester
                .inputs(null, '1', 'MN34')
                .check(function(api) {
                    metrics = api.metrics.stores.test_app
                        .time_per_screen_2_input_toilet_code;
                    assert.equal(metrics.agg, 'avg');
                    assert.equal(metrics.values.length, 1);
                })
                .run();
        });

        it('should have a timing metric for screen 3a', function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .inputs('MN34', '1')
                .check(function(api) {
                    metrics = api.metrics.stores.test_app
                        .time_per_screen_3a_get_issue;
                    assert.equal(metrics.agg, 'avg');
                    assert.equal(metrics.values.length, 1);
                })
                .run();
        });

        it('should have a timing metric for screen 3b', function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .inputs('MN', '1')
                .check(function(api) {
                    metrics = api.metrics.stores.test_app
                        .time_per_screen_3b_refine_response;
                    assert.equal(metrics.agg, 'avg');
                    assert.equal(metrics.values.length, 1);
                })
                .run();
        });

        it('should have a timing metric for screen 3c', function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .inputs("MN34", "8", "Custom issue")
                .check(function(api) {
                    metrics = api.metrics.stores.test_app
                        .time_per_screen_3c_custom_issue;
                    assert.equal(metrics.agg, 'avg');
                    assert.equal(metrics.values.length, 1);
                })
                .run();
        });

        it('should have a timing metric for screen 4', function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .setup.user.state({
                    name:'states:send-report',
                    creator_opts: {
                        toilet: {
                            "code": "MN34",
                            "long": "3.14159",
                            "lat": "2.71828"
                        },
                        query: "MN34",
                        issue: {
                            "en": "Broken toilet",
                            "xh": "Aphukileyo indlu yangasese",
                            "value": "broken_toilet"
                        }
                    }})
                .inputs(null)
                .check(function(api) {
                    metrics = api.metrics.stores.test_app
                        .time_per_screen_4_send_report;
                    assert.equal(metrics.agg, 'avg');
                    assert.equal(metrics.values.length, 1);
                })
                .run();
        });
    });

});
