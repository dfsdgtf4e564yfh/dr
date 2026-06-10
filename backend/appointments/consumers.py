import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

User = get_user_model()


class AppointmentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'appointments'

        token = self.scope['query_string'].decode().split('token=')[-1] if b'token=' in self.scope['query_string'] else None
        if token:
            try:
                access = AccessToken(token)
                user = await database_sync_to_async(User.objects.get)(id=access['user_id'])
                self.scope['user'] = user
            except Exception:
                await self.close()
                return

        if not self.scope['user'].is_authenticated:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def appointment_update(self, event):
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'appointment_id': event.get('appointment_id'),
            'action': event.get('action'),
            'doctor_id': event.get('doctor_id'),
        }))
