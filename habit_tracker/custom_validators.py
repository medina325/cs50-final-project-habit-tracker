from django.core.exceptions import ValidationError

def no_empty_strings(value):
    if not value.strip():
        raise ValidationError('This field cannot be an empty string.')
