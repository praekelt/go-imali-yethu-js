import argparse
import requests

parser = argparse.ArgumentParser(description='Migrate toilet codes')
parser.add_argument(
    'url', type=str,
    help='The base URL for the django toilet code database')
parser.add_argument(
    'username', type=str, help='The username used to log in')
parser.add_argument(
    'password', type=str, help='The password used to log in')
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


if __name__ == '__main__':
    args = parser.parse_args()
    session = create_session(args.username, args.password)
    toilets = get_all_toilets(session, args.url)
    print len(toilets)
