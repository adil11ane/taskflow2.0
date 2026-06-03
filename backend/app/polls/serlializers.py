from rest_framework import serializers
from .models import Project, Task, Comment
from users.serlializers import UserMinimalSerializer


class ProjectSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = Project
        fields = ["id", "name", "user", "description", "created_at"]


class TaskSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "user",
            "project",
            "title",
            "description",
            "status",
            "priority",
            "due_date",
            "created_at",
            "updated_at",
        ]


class CommentSerializer(serializers.ModelSerializer):
    author = UserMinimalSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "author", "task", "content", "created_at"]
