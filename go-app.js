// WARNING: This is a generated file.
//          If you edit it you will be sad.
//          Edit src/app.js instead.

var go = {};
go;

go.app = function() {
    var vumigo = require('vumigo_v02');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var EndState = vumigo.states.EndState;
    var LanguageChoice = vumigo.states.LanguageChoice;
    var FreeText = vumigo.states.FreeText;
    var JsonApi = vumigo.http.api.JsonApi;
    var ChoiceState = vumigo.states.ChoiceState;


    var GoApp = App.extend(function(self) {
        App.call(self, 'states:detect-language');
        var $ = self.$;

        self.states.add('states:detect-language', function(name) {
        // Delegation state, checks if a language is registered for a contact.
        // If it is, continue the interaction in that language. If it isn't,
        // get the desired language, and then continue the interaction in that
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

                next: function(content) {
                    return {
                        name: 'states:query-toilet-api',
                        creator_opts: content
                    };
                }
            });
        });

        var process_response = function(resp) {
        // This function takes in the response from the toilet API and
        // determines what should be done next.
            if(resp.data !== null && resp.data.length >= 1) {
                return resp.data.length > 1
                    ? self.states.create('states:refine-response', resp.data)
                    : self.states.create('states:report-issue', resp.data[0]);
            } else {
                return self.states.create('states:error');
            }
        };

        self.states.add('states:query-toilet-api', function(name, opts) {
        // Delegation state. This state will send a request to the toilet API
        // with the user's query. If there is more than one result, it will
        // ask the user to refine the selection. If there is just one result,
        // it will request the issue from the user.
            var url = self.im.config.toilet_api_url;
            var http = new JsonApi(self.im);
            return http.get(url, {
                params: {
                    q: opts,
                    format: 'json'}
                })
                .then(function(resp){
                    return process_response(resp);
                });
        });

        self.states.add('states:refine-response', function(name, data) {
        // This state requests that the user refine their request, as it
        // didn't return an exact match.
            choices = data.map(function(item, index) {
                return new Choice(index, item.code);
            });

            choices.push(new Choice('none', $('Not the code')));
            return new ChoiceState(name, {
                question: $(["Sorry your code doesn't match what is in our ",
                    "database. Could it be one of these instead?"].join("")),

                choices: choices,

                next: function(choice) {
                    return choice.value === 'none'
                        ? {
                            name: 'states:report-issue',
                            creator_opts: {}
                        }
                        : {
                            name: 'states:report-issue',
                            creator_opts: data[choice.value]
                        };
                }
            });
        });

        self.states.add('states:report-issue', function(name, data) {
        // This state gives the user a list of choices, as well as `other`,
        // which allows the user to define a custom issue.
            var issues = self.im.config.issues;
            var choices = issues.map(function(issue, index) {
                return new Choice(index, $(issue));
            });
            choices.push(new Choice('other', $('Other')));

            return new ChoiceState(name, {
                question: $('What is the issue?'),

                choices: choices,

                next: function(choice) {
                    return choice.value === 'other'
                        ? {
                            name: 'states:custom-issue',
                            creator_opts: data
                        }
                        : {
                            name: 'states:send-report',
                            creator_opts: {
                                toilet: data,
                                issue: issues[choice.value]}
                        };
                }
            });
        });

        self.states.add('states:custom-issue', function(name, data) {
        // This state allows the user to define a custom issue using a text
        // input.
            return new FreeText(name, {
                question: $("Please type the issue with the toilet."),

                next: function(input) {
                    return {
                        name: 'states:send-report',
                        creator_opts: {
                            toilet: data,
                            issue: input }
                    };
                }
            });
        });

        var notify_success = function(name) {
        // This function will notify the user of a successfully transmitted
        // report.
            return new EndState(name, {
                text: $(["Thanks for your report. We will notify the City of ",
                    "Cape Town of your issue and inform you of any updates ",
                    "via SMS or Call. Imali Yethu"].join('')),
                next: 'states:detect-language'
            });
        };

        self.states.add('states:send-report', function(name, data) {
        // This state sends the collected information to the Snappy Bridge API,
        // and then reports the success back to the user.
            var url = self.im.config.snappy_api_url;
            var http = new JsonApi(self.im);

            return http.post(url, {
                data: {
                    msisdn: self.im.user.addr,
                    toilet: data.toilet,
                    issue: data.issue,
                    //datetime: Date.now()
                    }
                })
                .then(function(resp){
                    return notify_success(name);
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
