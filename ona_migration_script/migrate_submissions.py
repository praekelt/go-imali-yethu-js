import argparse

from ona import OnaApiClient
import settings

DEFAULTS = {'msisdn': '', 'fault_status': '', 'logged_date': ''}

client = OnaApiClient(settings.USERNAME, settings.PASSWORD)

parser = argparse.ArgumentParser(description='Migrate submissions')
parser.add_argument(
    'from_id', type=str,
    help="The id (number) of the form to migrate submissions from")
parser.add_argument(
    'to_id', type=str,
    help="The id (number) of the form to migrate submissions to")
args = parser.parse_args()


def get_fields_from_form(formid):
    form = client.get_form_information(formid)
    fields = []
    for child in form.get('children'):
        fields.append(child.get('name'))
    return fields

from_fields = get_fields_from_form(args.from_id)
to_fields = get_fields_from_form(args.to_id)

for submission in client.data_for_form(args.from_id):
    new_submission = submission.copy()
    # Remove deleted fields
    for field in submission:
        if field not in to_fields:
            del new_submission[field]
    # Add missing fields
    for field in to_fields:
        if field not in new_submission:
            if field in DEFAULTS:
                new_submission[field] = DEFAULTS[field]
            else:
                new_submission[field] = None
    # Post submission to new form
    form_id_string = client.get_form(args.to_id)['id_string']
    try:
        client.submission({
            "id": form_id_string,
            "submission": new_submission,
        })
    except:
        print "Error sending form %s. Submission: " % form_id_string
        print new_submission
