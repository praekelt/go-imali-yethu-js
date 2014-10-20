var _ = require('lodash');
var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;
var assert = require('assert');
var xh_translation = require('../translations/xh');
var onafixtures = require('./ona.fixtures');

languages = ['xh', 'en'];

describe("App", function() {
    var app;
    var tester;

    beforeEach(function() {
        app = new go.app.GoApp();

        tester = new AppTester(app);

        app.now.timestamp = 1337;

        tester
            .setup.config.app({
                name: 'test_app',
                toilet_code: {
                    url: 'http://toilet.info/api/',
                    threshold: 0,
                    max_results: 5
                },
                toilet_api_url: 'http://toilet.info/api/',
                toilet_api_issue_url: 'http://toilet.info/api/issues/',
                snappy: {
                    url: 'http://besnappy.com/api/',
                    conversation: '/api/v1/snappybouncer/conversation/1/',
                    auth_user: 'azurediamond',
                    auth_token: 'hunter2'
                },
                ona: {
                    id: '1',
                    username: 'root',
                    password: 'toor',
                    url: 'http://ona.io/api/v1/'
                },
                cluster_len: 0,
                issue_len: 0
            })
            .setup.config({
                'translation.xh': xh_translation
            })
            .setup(function(api) {
                fixtures().forEach(api.http.fixtures.add);
                onafixtures.store.forEach(api.http.fixtures.add);
            })
            .setup.char_limit(139);
    });

    describe("app.now", function() {
        describe("when a fixed timestamp is set", function() {
            it("should return the fixed time", function() {
                app.now.timestamp = 1234;
                assert.equal(app.now(), "1970-01-01T00:00:01.234Z");
            });
        });

        describe("when a no timestamp is set", function() {
            it("should return the current time", function() {
                delete app.now.timestamp;
                assert.equal(
                    (new RegExp('^\\d{4}-\\d{2}-\\d{2}T\\d{2}' +
                                ':\\d{2}:\\d{2}\\.\\d{3}Z$'))
                    .test(app.now()), true);
            });
        });
    });

    describe("app.calculate_gps_offsets", function() {
        describe("when cluster_len is set", function() {
            it("should create deterministic offsets", function() {
                app.im.config.cluster_len = 1;
                app.im.config.issue_len = 0;
                var offsets = app.calculate_gps_offsets('foo');
                // longitude
                assert.equal(
                    Math.abs(offsets.lon + 0.057109694655158014) < 1e-7, true);
                // latitude
                assert.equal(
                    Math.abs(offsets.lat + 0.9983679195285438) < 1e-7, true);
                // length
                assert.equal(
                    Math.sqrt(Math.pow(offsets.lon,2) +
                        Math.pow(offsets.lat,2)) - 1 < 1e-7, true);
            });
        });

        describe("when issue_len is set", function() {
            it("should create random offsets within the limits", function() {
                app.im.config.cluster_len = 0;
                app.im.config.issue_len = 1;
                var offsets = app.calculate_gps_offsets('foo');
                // longitude
                assert.equal(Math.abs(offsets.lon) <= 1, true);
                // latitude
                assert.equal(Math.abs(offsets.lat) <= 1, true);
                // length
                assert.equal(
                    Math.sqrt(Math.pow(offsets.lon,2) +
                        Math.pow(offsets.lat,2)) - 1 < 1e-7, true);
            });
        });
    });

    describe("when a new user starts a session", function() {
        it("should give them a language selection", function() {
            return tester
                .start()
                .check.interaction({
                    state: 'states:select-language',
                    reply: [
                        'Wamkelekile ku Imali Yethu. Nceda ukhethe ulwimi',
                        ' lwakho. Welcome. Please choose your language.',
                        '\n1. isiXhosa',
                        '\n2. English'].join(''),
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
                .input('2')
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
                    reply: [
                        "Toilet number not found.",
                        " Could it be one of these:",
                        "\n1. MN33\n2. MN34\n3. MN35\n4. MN36\n5. None of the above"
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
                        "query": "MN",
                        "threshold": "0",
                        "max_results": "5"
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
                            }
                        ],
                        'query': 'MN31',
                        'toilet':{}},
                    metadata: {
                        "page_start": 0,
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
                        '6. Other'].join('\n'),
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
                        '6. Enye'].join('\n'),
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
                        '6. Other',
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
                        '6. Other'].join('\n'),
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
                            }
                          ],
                        'query': 'MN',
                        'toilet': {}},
                    metadata: {
                        page_start: 0,
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
                        '6. Other'].join('\n'),
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

    describe("When a user enters a query with an exact match", function() {
        it("should send the request to toilet API", function() {
            return tester
                .setup.user.lang('en')
                .input('MN34')
                .check(function(api, im , app) {
                    http_sent = api.http.requests[0];
                    assert.equal(http_sent.url, 'http://toilet.info/api/');
                    assert.deepEqual(http_sent.params, {
                        "query": "MN34",
                        "threshold": "0",
                        "max_results": "5"
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
                        '6. Other'].join('\n'),
                })
                .check.reply.char_limit()
                .run();
        });

        it("should detect the match even if case differs", function() {
            return tester
                .setup.user.lang('en')
                .input('mn34')
                .check.interaction({
                    state: 'states:report-issue',
                })
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
                            }
                        ],
                        toilet: {
                            "id": 1,
                            "code": "MN34",
                            "lat": -34.01667,
                            "lon": -18.66404
                        },
                        query: "MN34"},
                    metadata: {
                        page_start: 0,
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
                    reply: ['Thank you. We will forward your report to the ',
                            'City of Cape Town and let you know if there is ',
                            'an update.'
                            ].join(''),
                })
                .check.reply.char_limit()
                .run();
        });

        it("should send the information to snappy bridge", function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .setup(function(api) {
                    api.contacts.add({
                        msisdn: '+12345',
                        key: '34f1343f-fb98-41a1-20b1-b7d9e45e99d2'
                    });
                })
                .inputs('MN34', '1')
                .check(function(api, im , app) {
                    var http_sent = _.where(api.http.requests, {
                        url: 'http://besnappy.com/api/'
                    })[0];
                    assert.deepEqual(http_sent.data, {
                        "contact_key":"34f1343f-fb98-41a1-20b1-b7d9e45e99d2",
                        "msisdn": "+12345",
                        "conversation":"/api/v1/snappybouncer/conversation/1/",
                        "message":
                            "Toilet code: MN34\nToilet latitude: -34.01667\n" +
                            "Toilet longitude: -18.66404\nIssue: broken_toilet"
                    });
                })
                .run();
        });

        it("should authorize the snappy request", function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .setup(function(api) {
                    api.contacts.add({
                        msisdn: '+12345',
                        key: '34f1343f-fb98-41a1-20b1-b7d9e45e99d2'
                    });
                })
                .inputs('MN34', '1')
                .check(function(api) {
                    var http_sent = _.where(api.http.requests, {
                        url: 'http://besnappy.com/api/'
                    })[0];
                    assert.equal(
                        http_sent.headers.Authorization,
                        'ApiKey azurediamond:hunter2');
                })
                .run();
        });

        it("should skip sending the information if there is no snappy config", function() {
            return tester
                .setup.config.app({snappy: undefined})
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .inputs('MN34', '1')
                .check(function(api) {
                    assert.deepEqual(
                        _.where(api.http.requests, {
                            url: 'http://besnappy.com/api/'
                        }), []);
                    assert.deepEqual(
                        api.log.info.slice(-1), [[
                            'No Snappy API configured.',
                            'Not submitting data to Snappy.'
                        ].join(' ')]);
                })
                .run();
        });

        it("should send the information to Ona", function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .inputs('MN34', '1')
                .check(function(api) {
                    var http_sent = _.where(api.http.requests, {
                        url: 'http://ona.io/api/v1/submission'
                    })[0];
                    assert.deepEqual(http_sent.data, {
                        "id": "1",
                        "submission": {
                            "msisdn": "+12345",
                            "toilet_code": "MN34",
                            "issue": "broken_toilet",
                            "toilet_code_query": "MN34",
                            "fault_status": "logged",
                            "toilet_location": "-34.01667 -18.66404",
                            "logged_date": "1970-01-01T00:00:01.337Z"
                        }
                    });
                })
                .run();
        });

        it("should skip sending the information if there is Ona config", function() {
            return tester
                .setup.config.app({ona: undefined})
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .inputs('MN34', '1')
                .check(function(api) {
                    assert.deepEqual(
                        _.where(api.http.requests, {
                            url: 'http://ona.io/api/v1/submission'
                        }), []);
                    assert.deepEqual(
                        api.log.info.slice(-1), [[
                            'No Ona API configured.',
                            'Not submitting data to Ona.'
                        ].join(' ')]);
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
                .inputs('MN34', '6')
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
                    .inputs('MN34', '6')
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
                .inputs("MN34", "6", "Custom issue")
                .check.interaction({
                    state: 'states:send-report',
                    reply: ['Thank you. We will forward your report to the ',
                            'City of Cape Town and let you know if there is ',
                            'an update.'
                            ].join(''),
                })
                .check.reply.char_limit()
                .run();
        });

        it("should send the custom issue to snappy", function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .setup(function(api) {
                    api.contacts.add({
                        msisdn: '+12345',
                        key: '34f1343f-fb98-41a1-20b1-b7d9e45e99d2'
                    });
                })
                .inputs("MN34", "6", "Custom issue")
                .check(function(api, im , app) {
                    var http_sent = _.where(api.http.requests, {
                        url: 'http://besnappy.com/api/'
                    })[0];
                    assert.deepEqual(http_sent.data, {
                        "contact_key":"34f1343f-fb98-41a1-20b1-b7d9e45e99d2",
                        "msisdn": "+12345",
                        "conversation":"/api/v1/snappybouncer/conversation/1/",
                        "message":"Toilet code: MN34\nToilet latitude:" +
                            " -34.01667\nToilet longitude: -18.66404\n" +
                            "Issue: Custom issue"
                    });
                })
                .run();
        });

        it("should send the custom issue to Ona", function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .inputs('MN34', '6', "Custom issue")
                .check(function(api) {
                    var http_sent = _.where(api.http.requests, {
                        url: 'http://ona.io/api/v1/submission'
                    })[0];
                    assert.deepEqual(http_sent.data, {
                        "id": "1",
                        "submission": {
                            "msisdn": "+12345",
                            "toilet_code": "MN34",
                            "issue": "Custom issue",
                            "toilet_code_query": "MN34",
                            "fault_status": "logged",
                            "toilet_location": "-34.01667 -18.66404",
                            "logged_date": "1970-01-01T00:00:01.337Z"
                        }
                    });
                })
                .run();
        });

        languages.map(function(lang) {
            it("should limit the length of the response " + lang, function() {
                return tester
                    .setup.user.lang(lang)
                    .setup.user.addr('+12345')
                    .inputs('MN34', '6', 'Custom issue')
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
                .inputs("MN34", "6", "Custom issue")
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
                .setup(function(api) {
                    api.contacts.add({
                        msisdn: '+12345',
                        key: '34f1343f-fb98-41a1-20b1-b7d9e45e99d2'
                    });
                })
                .setup.user.state({
                    name:'states:send-report',
                    creator_opts: {
                        toilet: {
                            "id": 1,
                            "code": "MN34",
                            "lon": -18.66404,
                            "lat": -34.01667
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

    describe("When there is an error submitting to Ona", function() {
        it("Should log an error and continue", function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .setup(function(api) {
                    api.contacts.add({
                        msisdn: '+12345',
                        key: '34f1343f-fb98-41a1-20b1-b7d9e45e99d2'
                    });
                })
                .inputs("MN34", "6", "Error issue")
                .check(function(api) {
                    var logs = _.flatten(_.values(api.log.store));
                    var log = _.findLast(logs, function(item) {
                        return item.indexOf(
                            'Error when sending data to Ona') > -1;
                    });
                    // Check that log exists
                    assert.equal(typeof log == 'undefined', false);
                    // Assert contents of log
                    error = JSON.parse(log.substring(log.indexOf('{')));
                    assert.equal(error.code, 400);
                    body = JSON.parse(error.body);
                    assert.equal(body.error, "Error message.");
                    // Assert Snappy was still submitted
                    var http_sent = _.where(api.http.requests, {
                        url: 'http://besnappy.com/api/'
                    });
                    assert.equal(http_sent.length > 0, true);
                })
                .run();
        });
    });

    describe("When there is an error submitting to Snappy", function() {
        it("Should log an error and continue", function() {
            return tester
                .setup.user.lang('en')
                .setup.user.addr('+12345')
                .setup(function(api) {
                    api.contacts.add({
                        msisdn: '+12345',
                        key: '34f1343f-fb98-41a1-20b1-b7d9e45e99d2'
                    });
                })
                .inputs("MN34", "6", "Error issue")
                .check(function(api) {
                    var logs = _.flatten(_.values(api.log.store));
                    var log = _.findLast(logs, function(item) {
                        return item.indexOf(
                            'Error when sending issue to Snappy') > -1;
                    });
                    // Check that log exists
                    assert.equal(typeof log == 'undefined', false);
                    // Assert contents of log
                    error = JSON.parse(log.substring(log.indexOf('{')));
                    assert.equal(error.code, 400);
                    body = JSON.parse(error.body);
                    assert.equal(body.status, "Error");
                    // Assert Ona was still submitted
                    var http_sent = _.where(api.http.requests, {
                        url: 'http://ona.io/api/v1/submission'
                    });
                    assert.equal(http_sent.length > 0, true);
                })
                .run();
        });
    });

});
