var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;

languages = ['en', 'xh'];

describe("App", function() {
    var app;
    var tester;

    beforeEach(function() {
        app = new go.app.GoApp();

        tester = new AppTester(app);

        tester
            .setup.config.app({
                name: 'test_app'
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

});