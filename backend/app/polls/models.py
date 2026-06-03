from django.db import models
from django.contrib.auth import get_user_model


class Project(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    description = models.TextField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Task(models.Model):
    class Level(models.TextChoices):
        LOW = "L", "Low"
        MEDIUM = "M", "Medium"
        HIGH = "H", "High"
        CRITICAL = "C", "Critical"

    class Status(models.TextChoices):
        BACKLOG = "B", "Backlog"
        IN_PROGRESS = "P", "In Progress"
        DONE = "D", "Done"

    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, null=True, blank=True
    )
    title = models.CharField(max_length=200)
    description = models.TextField(max_length=1000)
    priority = models.CharField(
        max_length=2, choices=Level.choices, default=Level.MEDIUM
    )
    status = models.CharField(
        max_length=2, choices=Status.choices, default=Status.IN_PROGRESS
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
        return f"Comment by: {self.author.first_name} on {self.task.title}"
