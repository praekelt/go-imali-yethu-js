import argparse
import hashlib
import math

from ona import OnaApiClient


def calculate_gps_offsets(toilet_code):
    length = 0.00010
    angle = int(hashlib.md5(toilet_code).hexdigest()[-4:], 16)
    angle = (angle - 2 ** 15) / (2. ** 15) * math.pi
    return length * math.cos(angle), length * math.sin(angle)


def generate_location(lat, lon, toilet_code):
    offset_lat, offset_lon = calculate_gps_offsets(toilet_code)
    return ' '.join([str(lat + offset_lat), str(lon + offset_lon)])

CONVERSIONS = {
    'code': 'toilet_code', 'section': 'toilet_section',
    'cluster': 'toilet_cluster'}
ADDITIONS = {
    'toilet_location': (generate_location, ['lat', 'lon', 'code'])
}
DEFAULTS = {
    'toilet_state': 'no_issue', 'toilet_issue': '', 'toilet_issue_date': ''}

parser = argparse.ArgumentParser(description='Migrate submissions')
parser.add_argument(
    'url', type=str,
    help='The full URL to get the JSON toilet information from')
parser.add_argument(
    'to_id', type=str,
    help="The id (number) of the form to migrate submissions to")
parser.add_argument(
    'username', type=str, help='The Ona username used to log in')
parser.add_argument(
    'password', type=str, help='The Ona password used to log in')
args = parser.parse_args()

client = OnaApiClient(args.username, args.password)


def get_toilet_info_from_django():
    url = args.url
    headers = {
        "Content-type": "application/json; charset=utf-8"
    }
    r = client.session.request(
        'GET', url, headers=headers)
    r.raise_for_status()
    return r.json()


def get_fields_from_form(formid):
    form = client.get_form_information(formid)
    fields = []
    for child in form.get('children'):
        fields.append(child.get('name'))
    return fields

toilet_data = get_toilet_info_from_django()
to_fields = get_fields_from_form(args.to_id)

for toilet in toilet_data:
    new_toilet = toilet.copy()
    # Add fields
    for field, (function, arguments) in ADDITIONS.iteritems():
        arguments = [toilet[arg] for arg in arguments]
        new_toilet[field] = function(*arguments)
    # Migrate fields
    for field in toilet:
        if field in CONVERSIONS:
            new_toilet[CONVERSIONS[field]] = toilet[field]
    # Remove deleted fields
        if field not in to_fields:
            del new_toilet[field]
    # Add missing fields
    for field in to_fields:
        if field not in new_toilet:
            new_toilet[field] = DEFAULTS.get(field, None)
    # Post submission to new form
    form_id_string = client.get_form(args.to_id)['id_string']
    try:
        client.submission({
            "id": form_id_string,
            "submission": new_toilet,
        })
    except:
        print "Error sending form %s. Submission: " % form_id_string
        print new_toilet
