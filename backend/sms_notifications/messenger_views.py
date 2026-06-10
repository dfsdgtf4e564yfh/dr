import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import MessengerSetting, MessengerLog
from .messenger_gateway import get_messenger, MESSENGER_NAMES

logger = logging.getLogger(__name__)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def messenger_settings(request):
    if request.method == 'GET':
        settings_list = MessengerSetting.objects.all().order_by('messenger_type')
        data = []
        for s in settings_list:
            data.append({
                'messenger_type': s.messenger_type,
                'name': s.name,
                'bot_token': s.bot_token,
                'chat_id': s.chat_id,
                'is_active': s.is_active,
                'created_at': s.created_at,
                'updated_at': s.updated_at,
            })
        if not data:
            default_settings = [
                {'messenger_type': 'eitaa', 'name': 'ایتا', 'bot_token': '', 'chat_id': '', 'is_active': False},
                {'messenger_type': 'bale', 'name': 'بله', 'bot_token': '', 'chat_id': '', 'is_active': False},
                {'messenger_type': 'rubika', 'name': 'روبیکا', 'bot_token': '', 'chat_id': '', 'is_active': False},
            ]
            for ds in default_settings:
                MessengerSetting.objects.get_or_create(
                    messenger_type=ds['messenger_type'],
                    defaults=ds,
                )
            data = default_settings
        return Response(data)

    messenger_type = request.data.get('messenger_type')
    bot_token = request.data.get('bot_token', '')
    chat_id = request.data.get('chat_id', '')
    is_active = request.data.get('is_active', False)

    if messenger_type not in dict(MessengerSetting.MESSENGER_CHOICES):
        return Response({'error': 'نوع پیام‌رسان نامعتبر است'}, status=status.HTTP_400_BAD_REQUEST)

    setting, created = MessengerSetting.objects.get_or_create(
        messenger_type=messenger_type,
        defaults={
            'name': MESSENGER_NAMES.get(messenger_type, messenger_type),
            'bot_token': bot_token,
            'chat_id': chat_id,
            'is_active': bool(is_active),
        }
    )
    if not created:
        setting.bot_token = bot_token
        setting.chat_id = chat_id
        setting.is_active = bool(is_active)
        setting.save(update_fields=['bot_token', 'chat_id', 'is_active'])

    return Response({
        'messenger_type': setting.messenger_type,
        'name': setting.name,
        'bot_token': setting.bot_token,
        'chat_id': setting.chat_id,
        'is_active': setting.is_active,
        'message': 'تنظیمات ذخیره شد',
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_messenger_message(request):
    messenger_type = request.data.get('messenger_type')
    recipient = request.data.get('recipient', '')
    message_text = request.data.get('message', '')

    if messenger_type not in dict(MessengerSetting.MESSENGER_CHOICES):
        return Response({'error': 'نوع پیام‌رسان نامعتبر است'}, status=status.HTTP_400_BAD_REQUEST)

    if not recipient:
        return Response({'error': 'گیرنده وارد نشده'}, status=status.HTTP_400_BAD_REQUEST)
    if not message_text:
        return Response({'error': 'متن پیام وارد نشده'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        setting = MessengerSetting.objects.get(messenger_type=messenger_type)
    except MessengerSetting.DoesNotExist:
        return Response({'error': 'تنظیمات این پیام‌رسان یافت نشد'}, status=status.HTTP_400_BAD_REQUEST)

    messenger = get_messenger(messenger_type, setting.bot_token)
    if not messenger:
        return Response({'error': 'پیام‌رسان پشتیبانی نمی‌شود'}, status=status.HTTP_400_BAD_REQUEST)

    result = messenger.send_message(recipient, message_text)

    MessengerLog.objects.create(
        messenger_type=messenger_type,
        recipient=recipient,
        message=message_text,
        status='sent' if result['success'] else 'failed',
        message_id=result.get('message_id', ''),
        error_message=result.get('error', ''),
    )

    if result['success']:
        return Response({'success': True, 'message_id': result.get('message_id', ''), 'message': 'پیام با موفقیت ارسال شد'})
    return Response({'success': False, 'error': result.get('error', 'خطا در ارسال')}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_messenger(request):
    messenger_type = request.data.get('messenger_type')
    bot_token = request.data.get('bot_token', '')

    if messenger_type not in dict(MessengerSetting.MESSENGER_CHOICES):
        return Response({'error': 'نوع پیام‌رسان نامعتبر است'}, status=status.HTTP_400_BAD_REQUEST)

    messenger = get_messenger(messenger_type, bot_token)
    if not messenger:
        return Response({'error': 'پیام‌رسان پشتیبانی نمی‌شود'}, status=status.HTTP_400_BAD_REQUEST)

    result = messenger.send_message('', 'تست اتصال پیام‌رسان')
    if result['success']:
        return Response({'success': True, 'message': 'اتصال با موفقیت برقرار شد'})
    return Response({'success': False, 'error': result.get('error', 'خطا در اتصال')}, status=status.HTTP_400_BAD_REQUEST)
