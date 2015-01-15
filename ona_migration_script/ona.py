import json
import requests


class OnaApiClient(object):
    """
    Client for Ona's API

    :param string form_id: The form ID.
    :param string username: The username to log into Ona with.
    :param string password: The password to log into Ona with.
    :param string url:
        The full URL of the Ona API. Defaults to ``https://ona.io/api/v1``.
    :type session:
        :class:`requests.Session`
    :param session:
        Requests session to use for HTTP requests. Defaults to a new session.
    """

    def __init__(self, username, password, url=None, session=None):
        self.username = username
        self.password = password
        if url is None:
            url = "https://ona.io/api/v1"
        self.url = url.rstrip('/')
        if session is None:
            session = requests.Session()
        self.session = session

    def _api_request(self, method, api_collection, api_object, data=None):
        url = ("%s/%s/%s" % (self.url, api_collection, api_object)).rstrip("/")
        headers = {
            "Content-type": "application/json; charset=utf-8"
        }
        if data is not None:
            data = json.dumps(data)
        r = self.session.request(
            method, url, auth=(self.username, self.password), data=data,
            headers=headers)
        r.raise_for_status()
        return r.json()

    def forms(self):
        """
        Retrieve all forms.
        """
        return self._api_request("GET", "forms", "")

    def get_form(self, formid):
        """
        Retrieve a form with form ID ``formid``
        """
        return self._api_request("GET", "forms", formid)

    def get_form_information(self, formid):
        """
        Retrieve all the form information (fields)
        """
        return self._api_request("GET", "forms", formid + '/form.json')

    def data_endpoints(self):
        """
        Retrieve a list of data endpoints.
        """
        return self._api_request("GET", "data", "")

    def data_for_form(self, formid):
        """
        Retrieve the data for a specific form
        """
        return self._api_request("GET", "data", formid)

    def submission(self, data):
        """
        Send a form submission with data ``data``.
        """
        self._api_request("POST", "submissions", "", data=data)
