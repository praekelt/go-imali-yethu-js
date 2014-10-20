go-imali-yethu-js
=================

|travis|_

This is the Vumi Go javascript sandbox app for the Imali Yethu project.

::

    $ npm install
    $ npm test

Config parameters:

::

    name:                           Name of the app.
    toilet_code:                    Toilet issues information
        toilet_code.url             URL for the toilet codes API
        toilet_code.threshold       Threshold for search
        toilet_code.max_results     Max results for search
    toilet_api_issue_url:           URL of the issue data API
    snappy:                         Snappy bouncer information
        snappy.url                  Snappy bouncer URL
        snappy.conversation         Snappy conversation to submit under
        snappy.auth_user            Authentication user for Snappy bouncer
        snappy.auth_token           Authentication token for Snappy bouncer
    ona:                            Ona information
        ona.id:                     Ona form identifier
        ona.username:               Ona auth username
        ona.password:               Ona auth password
        ona.url:                    URL for Ona API
    clusten_len:                    Length of radius for cluster 
                                    (deterministic) circles
    issue_len:                      Length of radius for issue (random) circles

.. |travis| image:: https://travis-ci.org/praekelt/go-imali-yethu-js.svg?branch=develop
.. _travis: https://travis-ci.org/praekelt/go-imali-yethu-js
