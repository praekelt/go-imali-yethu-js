import argparse
import json
import re
import requests
import urlparse

parser = argparse.ArgumentParser(description='Migrate toilet codes')
parser.add_argument(
    'url', type=str,
    help='The base URL for the django toilet code database')
parser.add_argument(
    'username', type=str, help='The username used to log in')
parser.add_argument(
    'password', type=str, help='The password used to log in')
parser.add_argument(
    'source_regex', type=str, help='The regex that is applied to the code')
parser.add_argument(
    'target_regex', type=str, help='The regex construction of the new code')
parser.add_argument(
    '--dryrun', '-d', action='store_true',
    help='Print out changes instead of uploading them.')


def create_session(user, password):
    s = requests.Session()
    s.auth = (user, password)
    s.headers.update({"Content-type": "application/json; charset=utf-8"})
    return s


def get_all_toilets(session, url):
    r = session.get(url)
    r.raise_for_status()
    return r.json()


def get_new_code(toilet, source_regex, target_regex):
    return source_regex.sub(target_regex, toilet['code'])


def change_toilet_code(session, url, toilet, new_code):
    data = {'code': new_code}
    url = urlparse.urljoin(url, str(toilet['id']))
    r = session.patch(url, json.dumps(data))
    r.raise_for_status()
    assert r.json()['code'] == new_code
    return r


if __name__ == '__main__':
    args = parser.parse_args()
    session = create_session(args.username, args.password)
    source_regex = re.compile(args.source_regex)
    for toilet in get_all_toilets(session, args.url):
        new_code = get_new_code(toilet, source_regex, args.target_regex)
        if args.dryrun:
            print '%s %s' % (toilet['code'], new_code)
        else:
            change_toilet_code(session, args.url, toilet, new_code)
