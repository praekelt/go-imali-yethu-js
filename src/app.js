go.app = function() {
    var vumigo = require('vumigo_v02');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var EndState = vumigo.states.EndState;
    var LanguageChoice = vumigo.states.LanguageChoice;
    var FreeText = vumigo.states.FreeText;

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
                : self.states.create('states:input-toilet-code');
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

                next: 'states:input-toilet-code'
            });
        });

        self.states.add('states:input-toilet-code', function(name) {
        // This state allows the user to input the code for the toilet.
            return new FreeText(name, {
                question: $(['Please input the code for the toilet. e.g. MN34',
                ' (You will find this on a sticker in the toilet)'].join('')),
                
                next: 'states:end'
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
