from django.contrib import admin
from .models import Comment, Project, Task
from users.models import User, UserManager

admin.site.register(Comment)
admin.site.register(Task)
admin.site.register(Project)
admin.site.register(User)
