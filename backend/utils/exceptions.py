from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None and response.data:
        _translate_errors(response.data)
    return response


def _translate_errors(data):
    if isinstance(data, dict):
        for key, value in list(data.items()):
            if isinstance(value, list):
                for i, msg in enumerate(value):
                    if isinstance(msg, str):
                        value[i] = _translate(msg)
                    elif isinstance(msg, dict):
                        _translate_errors(msg)
            elif isinstance(value, str):
                data[key] = _translate(value)
            elif isinstance(value, dict):
                _translate_errors(value)
    elif isinstance(data, list):
        for i, item in enumerate(data):
            if isinstance(item, str):
                data[i] = _translate(item)
            elif isinstance(item, dict):
                _translate_errors(item)


def _translate(msg):
    translations = {
        'Date has wrong format. Use one of these formats instead: YYYY-MM-DD.':
            'فرمت تاریخ نامعتبر است. لطفاً از فرمت YYYY-MM-DD استفاده کنید',
        'This field may not be blank.':
            'این فیلد نمی‌تواند خالی باشد',
        'This field may not be null.':
            'این فیلد نمی‌تواند خالی باشد',
        'This field is required.':
            'این فیلد الزامی است',
        'Invalid pk':
            'شناسه نامعتبر',
        'Not found.':
            'یافت نشد',
        'Method \\"GET\\" not allowed.':
            'این متد مجاز نیست',
        'Authentication credentials were not provided.':
            'لطفاً ابتدا وارد شوید',
        'You do not have permission to perform this action.':
            'شما مجوز این عملیات را ندارید',
    }
    return translations.get(msg, msg)
