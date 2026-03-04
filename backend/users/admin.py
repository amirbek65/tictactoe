from django.contrib import admin
from .models import User, VerificationCode, PendingRegistration

admin.site.register(User)
admin.site.register(VerificationCode)
admin.site.register(PendingRegistration)
