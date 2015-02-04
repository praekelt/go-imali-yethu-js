import argparse

parser = argparse.ArgumentParser(description='Migrate toilet codes')
parser.add_argument(
    'url', type=str,
    help='The base URL for the django toilet database')
parser.add_argument(
    'username', type=str, help='The username used to log in')
parser.add_argument(
    'password', type=str, help='The password used to log in')
