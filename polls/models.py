from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model


class Project(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    description = models.TextField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)


class Task(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, null=True, blank=True
    )

    class Level(models.TextChoices):
        LOW = "L", "LOW"
        MEDIUM = "M", "MEDIUM"
        HIGH = "H", "HIGH"
        CRITICAL = "C", "CRITICAL"

    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(max_length=1000)
    status = models.BooleanField(default=False)
    priority = models.CharField(
        max_length=2, choices=Level.choices, default=Level.MEDIUM
    )
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Comment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    author = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)

    content = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by: {self.author.username} on {self.task.title}"
