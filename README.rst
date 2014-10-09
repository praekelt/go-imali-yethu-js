go-imali-yethu-js
=================

|travis|_

This is the Vumi Go javascript sandbox app for the Imali Yethu project.

::

    $ npm install
    $ npm test

Config parameters:

::

    name:                   Name of the app.
    toilet_api_url:         URL of the toilet data API.
    snappy_api_url:         URL of the snappy bridge API.
    toilet_api_issue_url:   URL of the issue data API
    ona:                    Ona information
        ona.id:             Ona form identifier
        ona.username:       Ona auth username
        ona.password:       Ona auth password
        ona.url:            URL for Ona API

.. |travis| image:: https://travis-ci.org/praekelt/go-imali-yethu-js.svg?branch=develop
.. _travis: https://travis-ci.org/praekelt/go-imali-yethu-js
