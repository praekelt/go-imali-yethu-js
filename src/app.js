go.app = function() {
    var vumigo = require('vumigo_v02');
    var _ = require('lodash');
    var crypto = require('crypto');
    var moment = require('moment');
    var Q = require('q');
    var App = vumigo.App;
    var Choice = vumigo.states.Choice;
    var EndState = vumigo.states.EndState;
    var LanguageChoice = vumigo.states.LanguageChoice;
    var FreeText = vumigo.states.FreeText;
    var JsonApi = vumigo.http.api.JsonApi;
    var ChoiceState = vumigo.states.ChoiceState;
    var PaginatedChoiceState = vumigo.states.PaginatedChoiceState;
    var MetricsHelper = require('go-jsbox-metrics-helper');
    var Ona = require('go-jsbox-ona').Ona;


    var GoApp = App.extend(function(self) {
        App.call(self, 'states:detect-language');
        var $ = self.$;
        var characters_per_page = 139;

        self.now = function() {
            var timestamp =
                typeof self.now.timestamp == 'undefined' ?
                    new moment() : new moment(self.now.timestamp);
            return timestamp.zone('+02:00').format();
        };

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
                .add.trigger({state: 'states:notify-success', action: 'enter'},
                    {total_state_actions: 'total_completed_reports',
                     sessions_until_state: 'average_sessions_per_report'})
                // Average time to complete report
                .add.time_between_states(
                    {state: 'states:input-toilet-code', action: 'enter'},
                    {state: 'states:notify-success', action:'enter'},
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
                    'time_per_screen_3c_custom_issue');

            return self.im.contacts
                .for_user()
                .then(function(user_contact) {
                   self.contact = user_contact;
                });
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
                question: [
                    'Wamkelekile ku Imali Yethu. Nceda ukhethe ulwimi lwakho.',
                    'Welcome. Please choose your language.',
                    ].join(" "),
                choices: [
                    new Choice('xh', 'isiXhosa'),
                    new Choice('en', 'English'),
                ],
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
                if (resp.data.length >= 1) {
                    var best = resp.data[0];
                    if (best.code.toLowerCase() == query.toLowerCase()) {
                        return self.states.create(
                            'states:get-issue',
                            {'toilet': best, 'query': query});
                    }
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
            var url = self.im.config.toilet_code.url;
            var http = new JsonApi(self.im);
            return http.get(url, {
                    params: {
                        query: opts.query,
                        threshold: self.im.config.toilet_code.threshold,
                        max_results: self.im.config.toilet_code.max_results}
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

            choices.push(new Choice('none', $('None of the above')));
            return new ChoiceState(name, {
                question: $(["Toilet number not found.",
                             " Could it be one of these:"].join("")),
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
                var issues = resp.data.map(function(datum) {
                    var issue = {value: datum.value};
                    _.forEach(datum.translations, function(trans) {
                        issue[trans.language] = trans.description;
                    });
                    return issue;
                });
                data.choices = issues;
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
                options_per_page: 7,
                characters_per_page: characters_per_page,
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
            return self.states.create('states:notify-success');
        };

        self.calculate_gps_offsets = function(toilet_code) {
        // This function calculated the required GPS offsets given the
        // toilet_code string
            var cluster_len = self.im.config.cluster_len || 0.0;
            var issue_len = self.im.config.issue_len || 0.0;
            var cluster_angle =
                crypto.createHash('md5').update(toilet_code).digest()
                .readInt16LE(0) / 32768.0 * Math.PI;
            var issue_angle = (Math.random() * 2 - 1) * Math.PI;
            return {
                lon: cluster_len * Math.cos(cluster_angle)
                    + issue_len * Math.cos(issue_angle),
                lat: cluster_len * Math.sin(cluster_angle)
                    + issue_len * Math.sin(issue_angle)
            };
        };

        self.create_ona_submission = function(data) {
            var submission = {
                toilet_code: data.toilet.code,
                toilet_section: data.toilet.section,
                toilet_cluster: data.toilet.cluster,
                issue: data.issue.value,
                fault_status: 'logged',
                logged_date: self.now(),
                msisdn: self.im.user.addr,
            };

            if ((typeof data.toilet.code === 'string') &&
                (typeof data.toilet.lat === 'number') &&
                (typeof data.toilet.lon === 'number')) {
                var offsets = self.calculate_gps_offsets(data.toilet.code);
                submission.toilet_location = [
                    data.toilet.lat + offsets.lat,
                    data.toilet.lon + offsets.lon,
                ].join(' ');
            }
            submission = _.defaults(submission, {
                toilet_code: data.query,
                toilet_section: "None",
                toilet_cluster: "None",
                issue: data.issue,
                // toilet_location is omitted if there is no valid
                // value.
            });
            return submission;
        };

        var create_issue_message = function(snappy_conf, data) {
            toilet = _.defaults({
                code: data.toilet.code,
                lat: data.toilet.lat,
                lon: data.toilet.lon,
                issue: data.issue.value,
                lang: self.im.user.lang,
                tags: snappy_conf.tags,
            }, {
                code: data.query,
                lat: "None",
                lon: "None",
                issue: data.issue,
                lang: "None",
                tags: "-",
            });
            return [
                "Toilet code: " + toilet.code,
                "Toilet latitude: " + toilet.lat,
                "Toilet longitude: " + toilet.lon,
                // For custom issues, toilet.issue is just a string
                "Issue: " + toilet.issue,
                "Language: " + toilet.lang,
                "Tags: " + toilet.tags,
                "Timestamp: " + self.now(),
            ].join('\n');
        };

        self.states.add('states:send-report', function(name, data) {
        // Delegation State
        // This state sends the collected information to the Snappy Bridge API,
        // and then reports the success back to the user.
            return Q()
                .then(function() {
                    // Send response to Snappy
                    var snappy_conf = self.im.config.snappy;
                    if (typeof snappy_conf == 'undefined') {
                        return self.im.log.info([
                            "No Snappy API configured.",
                            "Not submitting data to Snappy."
                        ].join(" "));
                    }
                    var http = new JsonApi(self.im, {
                        headers: {
                            Authorization: [['ApiKey ', snappy_conf.auth_user,
                                ':', snappy_conf.auth_token].join('')]
                        }
                    });

                    return http.post(snappy_conf.url, {
                        data: {
                            contact_key: self.contact.key,
                            msisdn: self.im.user.addr,
                            conversation: snappy_conf.conversation,
                            message: create_issue_message(snappy_conf, data)
                        }
                    });
                })
                .fail(function(err) {
                    // Check for Snappy error
                    self.im.log.error([
                        'Error when sending issue to Snappy:',
                        JSON.stringify(err.response)].join(' '));
                })
                .then(function() {
                    // Send response to Ona
                    var ona_conf = self.im.config.ona;
                    if (typeof ona_conf == 'undefined') {
                        return self.im.log.info([
                            "No Ona API configured.",
                            "Not submitting data to Ona."
                        ].join(" "));
                    }
                    var ona = new Ona(self.im, {
                        auth: {
                            username: ona_conf.username,
                            password: ona_conf.password
                        },
                        url: ona_conf.url
                    });
                    var submission = self.create_ona_submission(data);
                    return ona.submit({
                        id: self.im.config.ona.id,
                        submission: submission,
                    });
                })
                .fail(function(err) {
                    // Check for Ona response error
                    return self.im.log.error([
                        'Error when sending data to Ona:',
                        JSON.stringify(err.response)].join(' '));
                })
                .then(function() {
                    // Return success to user
                    return notify_success(name);
                });
        });

        self.states.add('states:notify-success', function(name) {
            // Screen 4
            return new EndState(name, {
                text: $(['Thank you. We will forward your report to the City ',
                         'of Cape Town and let you know if there is an update.'
                            ].join('')),
                next: 'states:detect-language'
            });
        });

    });

    return {
        GoApp: GoApp
    };
}();
