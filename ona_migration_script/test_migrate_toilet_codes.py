import json
import requests
from requests_testadapter import TestAdapter
import unittest

import migrate_toilet_codes


class TestCreateSession(unittest.TestCase):
    def test_create_session(self):
        username = 'testuser'
        password = 'testpass'
        s = migrate_toilet_codes.create_session(username, password)
        self.assertTrue(isinstance(s, requests.Session))
        self.assertEqual(
            s.headers['Content-type'], "application/json; charset=utf-8")
        self.assertEqual(s.auth, (username, password))


class TestGetAllToilets(unittest.TestCase):
    def test_get_list_of_toilets(self):
        s = requests.Session()
        url = 'http://www.example.org/toilet_codes/'
        return_data = [
            {
                "id": 94,
                "code": "RR007094FT",
                "lat": -34.01691,
                "lon": 18.66339,
                "section": "RR",
                "section_number": "94",
                "cluster": "7",
                "toilet_type": "FT"
            },
            {
                "id": 1,
                "code": "RR001001FT",
                "lat": -34.01667,
                "lon": 18.66404,
                "section": "RR",
                "section_number": "1",
                "cluster": "1",
                "toilet_type": "FT"
            }
        ]
        s.mount(url, TestAdapter(json.dumps(return_data)))
        toilets = migrate_toilet_codes.get_all_toilets(s, url)
        self.assertEqual(return_data, toilets)

    def test_http_errors_raised(self):
        s = requests.Session()
        url = 'http://www.example.org/toilet_codes/'
        s.mount(url, TestAdapter('', status=404))
        with self.assertRaises(requests.HTTPError) as e:
            migrate_toilet_codes.get_all_toilets(s, url)
        self.assertEqual(e.exception.response.status_code, 404)
