import json
import requests
import unittest
from requests_testadapter import TestAdapter, TestSession

from ona import OnaApiClient


class TestOnaClient(unittest.TestCase):
    def create_ona_client(self, url=None, fixtures=None):
        self.username = 'username'
        self.password = 'password'
        self.session = TestSession()
        if fixtures:
            for url, data, status in fixtures:
                self.session.mount(
                    url, TestAdapter(data.encode(), status=status))
        return OnaApiClient(
            self.username, self.password, url, self.session)

    def test_create_client_default_url(self):
        ona_client = self.create_ona_client()
        self.assertEqual(ona_client.username, self.username)
        self.assertEqual(ona_client.password, self.password)
        self.assertEqual(ona_client.url, "https://ona.io/api/v1")
        self.assertTrue(isinstance(ona_client.session, requests.Session))

    def test_create_client_custom_url(self):
        ona_client = self.create_ona_client(url='http://example.org/api/')
        self.assertEqual(ona_client.username, self.username)
        self.assertEqual(ona_client.password, self.password)
        self.assertEqual(ona_client.url, "http://example.org/api")
        self.assertTrue(isinstance(ona_client.session, requests.Session))

    def test_api_request_get(self):
        fixtures = [
            ('https://ona.io/api/v1/foo/bar', json.dumps('foo bar'), 200)
        ]
        ona_client = self.create_ona_client(fixtures=fixtures)
        r = ona_client._api_request('GET', 'foo', 'bar')
        self.assertEqual(r, 'foo bar')

    def test_api_request_post(self):
        fixtures = [
            ('https://ona.io/api/v1/foo/bar', json.dumps('foo bar'), 200)
        ]
        ona_client = self.create_ona_client(fixtures=fixtures)
        r = ona_client._api_request('POST', 'foo', 'bar')
        self.assertEqual(r, 'foo bar')

    def test_api_request_raises_for_http(self):
        fixtures = [
            ('https://ona.io/api/v1/foo/bar', json.dumps('foo bar'), 404)
        ]
        ona_client = self.create_ona_client(fixtures=fixtures)
        try:
            ona_client._api_request('GET', 'foo', 'bar')
        except requests.HTTPError as e:
            self.assertEqual(e.response.status_code, 404)

    def test_get_all_forms(self):
        fixtures = [
            ('https://ona.io/api/v1/forms', json.dumps('foo bar'), 200)
        ]
        ona_client = self.create_ona_client(fixtures=fixtures)
        r = ona_client.forms()
        self.assertEqual(r, 'foo bar')

    def test_get_one_form(self):
        fixtures = [
            ('https://ona.io/api/v1/forms/1', json.dumps('foo bar'), 200)
        ]
        ona_client = self.create_ona_client(fixtures=fixtures)
        r = ona_client.get_form(1)
        self.assertEqual(r, 'foo bar')

    def test_get_form_information(self):
        fixtures = [
            (
                'https://ona.io/api/v1/forms/1/form.json',
                json.dumps('foo bar'),
                200
            )
        ]
        ona_client = self.create_ona_client(fixtures=fixtures)
        r = ona_client.get_form_information(1)
        self.assertEqual(r, 'foo bar')

    def test_get_data_endpoints(self):
        fixtures = [
            ('https://ona.io/api/v1/data', json.dumps('foo bar'), 200)
        ]
        ona_client = self.create_ona_client(fixtures=fixtures)
        r = ona_client.data_endpoints()
        self.assertEqual(r, 'foo bar')

    def test_get_data_for_form(self):
        fixtures = [
            ('https://ona.io/api/v1/data/1', json.dumps('foo bar'), 200)
        ]
        ona_client = self.create_ona_client(fixtures=fixtures)
        r = ona_client.data_for_form(1)
        self.assertEqual(r, 'foo bar')

    def test_post_submission(self):
        fixtures = [
            ('https://ona.io/api/v1/submissions', json.dumps('foo bar'), 200)
        ]
        ona_client = self.create_ona_client(fixtures=fixtures)
        r = ona_client.submission(json.dumps({}))
        self.assertEqual(r, 'foo bar')
