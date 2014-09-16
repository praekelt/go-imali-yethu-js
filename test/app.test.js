var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var AppTester = vumigo.AppTester;


describe("ImaliYethu", function() {
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
                    char_limit: 140
                })

                .run();
        });
    });

    describe("when the user asks to see the menu again", function() {
        it("should show the menu again", function() {
            return tester
                .setup.user.state('states:start')
                .input('1')
                .check.interaction({
                    state: 'states:start',
                    reply: [
                        'Hi there! What do you want to do?',
                        '1. Show this menu again',
                        '2. Exit'
                    ].join('\n')
                })
                .run();
        });
    });

    describe("when the user asks to exit", function() {
        it("should say thank you and end the session", function() {
            return tester
                .setup.user.state('states:start')
                .input('2')
                .check.interaction({
                    state: 'states:end',
                    reply: 'Thanks, cheers!'
                })
                .check.reply.ends_session()
                .run();
        });
    });
});
