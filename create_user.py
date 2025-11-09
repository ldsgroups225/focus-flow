from appwrite.client import Client
from appwrite.services.users import Users
from appwrite.id import ID
import os

client = Client()

(client
  .set_endpoint(os.environ["NEXT_PUBLIC_APPWRITE_ENDPOINT"])
  .set_project(os.environ["NEXT_PUBLIC_APPWRITE_PROJECT_ID"])
  .set_key(os.environ["NEXT_PUBLIC_APPWRITE_DEV_KEY"])
)

users = Users(client)

try:
    user = users.create(
        user_id=ID.unique(),
        email='test@example.com',
        password='password123'
    )
    print(user)
except Exception as e:
    print(e)
