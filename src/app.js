go.app = function() {
    var vumigo = require('vumigo_v02');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var EndState = vumigo.states.EndState;
    var LanguageChoice = vumigo.states.LanguageChoice;
    var FreeText = vumigo.states.FreeText;
    var JsonApi = vumigo.http.api.JsonApi;
    var ChoiceState = vumigo.states.ChoiceState;
    var PaginatedChoiceState = vumigo.states.PaginatedChoiceState;
    var MetricsHelper = require('go-jsbox-metrics-helper');


    var GoApp = App.extend(function(self) {
        App.call(self, 'states:detect-language');
        var $ = self.$;

        self.init = function() {
        // Uses the metrics helper to add the required metrics to the
        // application
            mh = new MetricsHelper(self.im);
            mh
                // Total unique users
                .add.total_unique_users()
                // Total and weekly USSD sessions
                .add.total_sessions()
                // Total and weekly completed reports
                // Average sessions per complete report
                .add.trigger({state: 'states:send-report', action: 'enter'}, {
                        total_state_actions: 'total_completed_reports',
                        sessions_until_state: 'average_sessions_per_report'})
                // Average time to complete report
                .add.time_between_states(
                    {state: 'states:detect-language', action: 'enter'},
                    {state: 'states:send-report', action:'enter'},
                    'time_per_report')
                // Average time spent per screen 1, 2, 3a, 3b, 3c, 4
                .add.time_between_states(
                    {state: 'states:select-language', action: 'enter'},
                    {state: 'states:select-language', action: 'exit'},
                    'time_per_screen_1_select_language')
                .add.time_between_states(
                    {state: 'states:input-toilet-code', action: 'enter'},
                    {state: 'states:input-toilet-code', action: 'exit'},
                    'time_per_screen_2_input_toilet_code')
                .add.time_between_states(
                    {state: 'states:report-issue', action: 'enter'},
                    {state: 'states:report-issue', action: 'exit'},
                    'time_per_screen_3a_get_issue')
                .add.time_between_states(
                    {state: 'states:refine-response', action: 'enter'},
                    {state: 'states:refine-response', action: 'exit'},
                    'time_per_screen_3b_refine_response')
                .add.time_between_states(
                    {state: 'states:custom-issue', action: 'enter'},
                    {state: 'states:custom-issue', action: 'exit'},
                    'time_per_screen_3c_custom_issue')
                .add.time_between_states(
                    {state: 'states:send-report', action: 'enter'},
                    {state: 'states:send-report', action: 'exit'},
                    'time_per_screen_4_send_report');
        };

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
        // Screen 1
        // Allows the user to select their language. This choice is displayed
        // only once and the selection is used for all future interactions.
            return new LanguageChoice(name, {
                question: ['Welcome to Imali Yethu toilet reporting service.',
                           'Please choose your language:'].join(' '),

                choices: [
                    new Choice('en', 'English'),
                    new Choice('xh', 'isiXhosa')],

                next: 'states:input-toilet-code'
            });
        });

        self.states.add('states:input-toilet-code', function(name) {
        // Screen 2
        // This state allows the user to input the code for the toilet.
            return new FreeText(name, {
                question: $('Enter the toilet number.'),

                next: function(content) {
                    return {
                        name: 'states:query-toilet-api',
                        creator_opts: {'query': content}
                    };
                }
            });
        });

        var process_response = function(resp, query) {
        // This function takes in the response from the toilet API and
        // determines what should be done next.
            if(resp.data !== null) {
                if(resp.data.length === 1) {
                    return self.states.create(
                        'states:get-issue', 
                        {'toilet': resp.data[0], 'query': query});
                } else if (resp.data.length > 1) {
                    return self.states.create(
                        'states:refine-response', 
                        {'data': resp.data, 'query': query});
                } else {
                    return self.states.create(
                        'states:get-issue',
                        {'toilet': {}, 'query': query});
                }
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
                        q: opts.query,
                        format: 'json'}
                    })
                .then(function(resp){
                    return process_response(resp, opts.query);
                });
        });

        self.states.add('states:refine-response', function(name, data) {
        // Screen 3b
        // This state requests that the user refine their request, as it
        // didn't return an exact match.
            choices = data.data.map(function(item, index) {
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
                            name: 'states:get-issue',
                            creator_opts: {'toilet': {}, 'query': data.query}
                        }
                        : {
                            name: 'states:get-issue',
                            creator_opts: {'toilet': data.data[choice.value],
                                'query': data.query}
                        };
                }
            });
        });

        self.states.add('states:get-issue', function(name, data) {
        // Delegation state. This state handles the HTTP request to get the
        // list of issues from the toilet API.
            var url = self.im.config.toilet_api_issue_url;
            var http = new JsonApi(self.im);
            return http.get(url).then(function(resp) {
                data.choices = resp.data;
                return self.states.create('states:report-issue', data);
            });
        });

        self.states.add('states:report-issue', function(name, data) {
        // Screen 3a
        // This state gives the user a list of choices, as well as `other`,
        // which allows the user to define a custom issue.
            var language = self.im.user.lang;
            var choices = data.choices.map(function(issue, index) {
                // Fallback for no translation for language
                issue = issue[language] === undefined
                    ? issue.value
                    : issue[language];
                return new Choice(index, issue);
            });
            choices.push(new Choice('other', $('Other')));

            return new PaginatedChoiceState(name, {
                question: $('What is the problem?'),

                choices: choices,

                characters_per_page: 139,
                options_per_page: null,

                next: function(choice) {
                    return choice.value === 'other'
                        ? {
                            name: 'states:custom-issue',
                            creator_opts: data
                        }
                        : {
                            name: 'states:send-report',
                            creator_opts: {
                                toilet: data.toilet,
                                query: data.query,
                                issue: data.choices[choice.value]}
                        };
                }
            });
        });

        self.states.add('states:custom-issue', function(name, data) {
        // Screen 3c
        // This state allows the user to define a custom issue using a text
        // input.
            return new FreeText(name, {
                question: $("Please type your issue with the toilet."),

                next: function(input) {
                    return {
                        name: 'states:send-report',
                        creator_opts: {
                            toilet: data.toilet,
                            query: data.query,
                            issue: input }
                    };
                }
            });
        });

        var notify_success = function(name) {
        // This function will notify the user of a successfully transmitted
        // report.
            return new EndState(name, {
                text: $(['Thanks for your report. We will notify the CoCT of ',
                         'your issue and inform you of any updates via SMS or',
                         ' Call. Imali Yethu.'
                            ].join('')),
                next: 'states:detect-language'
            });
        };

        self.states.add('states:send-report', function(name, data) {
        // Screen 4
        // This state sends the collected information to the Snappy Bridge API,
        // and then reports the success back to the user.
            var url = self.im.config.snappy_api_url;
            var http = new JsonApi(self.im);

            return http.post(url, {
                data: {
                    msisdn: self.im.user.addr,
                    toilet: data.toilet,
                    issue: data.issue,
                    query: data.query
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
