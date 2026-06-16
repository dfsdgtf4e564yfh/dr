import json
import logging
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


class AppointmentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'appointments'
        self.authenticated = False

        query_string = self.scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token_list = params.get('token', [])
        token = token_list[0] if token_list else None

        if token:
            await self._authenticate(token)

        await self.accept()

        if not self.authenticated:
            await self.send(text_data=json.dumps({'type': 'auth_required'}))
        else:
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.send(text_data=json.dumps({'type': 'auth_success'}))

    async def _authenticate(self, token):
        try:
            access = AccessToken(token)
            user = await database_sync_to_async(User.objects.get)(id=access['user_id'])
            self.scope['user'] = user
            self.authenticated = True
        except Exception as e:
            logger.warning(f'WebSocket auth failed: {e}')
            self.authenticated = False

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)

            if data.get('type') == 'auth' and data.get('token') and not self.authenticated:
                await self._authenticate(data['token'])
                if self.authenticated:
                    await self.channel_layer.group_add(self.group_name, self.channel_name)
                    await self.send(text_data=json.dumps({'type': 'auth_success'}))
                else:
                    await self.send(text_data=json.dumps({'type': 'auth_failed'}))
                    await self.close(code=4001)
                return

            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
                return

        except json.JSONDecodeError:
            pass
        except Exception as e:
            logger.exception(f'WebSocket receive error: {e}')

    async def disconnect(self, close_code):
        if self.authenticated:
            try:
                await self.channel_layer.group_discard(self.group_name, self.channel_name)
            except Exception:
                pass

    async def appointment_update(self, event):
        await self.send(text_data=json.dumps({
            'type': event.get('type', 'appointment_update'),
            'appointment_id': event.get('appointment_id'),
            'action': event.get('action'),
            'doctor_id': event.get('doctor_id'),
        }))
