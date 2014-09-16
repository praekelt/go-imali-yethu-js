// WARNING: This is a generated file.
//          If you edit it you will be sad.
//          Edit src/app.js instead.

var go = {};
go;

go.app = function() {
    var vumigo = require('vumigo_v02');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var ChoiceState = vumigo.states.ChoiceState;
    var EndState = vumigo.states.EndState;
    var LanguageChoice = vumigo.states.LanguageChoice;

    var GoApp = App.extend(function(self) {
        App.call(self, 'states:detect-language');
        var $ = self.$;

        self.states.add('states:detect-language', function(name) {
        // Check if a language is registered for a contact. If it is,
        // continue the interaction in that language. If it isn't, get the
        // desired language, and then continue the interaction in that
        // language.
            return ['en', 'xh'].indexOf(self.im.user.lang) === -1
                ? self.states.create('states:select-language')
                : self.states.create('states:start');
        });

        self.states.add('states:select-language', function(name) {
        // Allows the user to select their language. This choice is displayed
        // only once and the selection is used for all future interactions.
            return new LanguageChoice(name, {
                question: ['Welcome to Imali Yethu sanitation reporting',
                    ' service. Please choose your language:'].join(''),

                choices: [
                    new Choice('en', 'English'),
                    new Choice('xh', 'isiXhosa')],

                next: 'states:start'
            });
        });

        self.states.add('states:start', function(name) {
            return new ChoiceState(name, {
                question: $('Hi there! What do you want to do?'),

                choices: [
                    new Choice('states:start', $('Show this menu again')),
                    new Choice('states:end', $('Exit'))],

                next: function(choice) {
                    return choice.value;
                }
            });
        });

        self.states.add('states:end', function(name) {
            return new EndState(name, {
                text: $('Thanks, cheers!'),
                next: 'states:detect-language'
            });
        });
    });

    return {
        GoApp: GoApp
    };
}();

go.init = function() {
    var vumigo = require('vumigo_v02');
    var InteractionMachine = vumigo.InteractionMachine;
    var GoApp = go.app.GoApp;


    return {
        im: new InteractionMachine(api, new GoApp())
    };
}();
