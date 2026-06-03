from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Task, Project, Comment
from .serlializers import ProjectSerializer, TaskSerializer, CommentSerializer
from django.contrib.auth import get_user_model

user = get_user_model()


# TASK CRUD TESTS
class APICRUDTaskTests(APITestCase):

    def setUp(self):
        self.user = user.objects.create_user(
            email="adiya@gmail.com",
            password="testpassik",
            first_name="Adiya",
            last_name="Nurova",
        )
        self.project = Project.objects.create(name="API Project", user=self.user)
        self.url = reverse("tasks")
        self.client.force_authenticate(user=self.user)

    def test_create_task_via_api(self):
        data = {
            "user": self.user.id,
            "project": self.project.id,
            "title": "API Task",
            "description": "Testing API task creation",
            "status": "P",
            "priority": "H",
        }

        response = self.client.post(self.url, data, format="json")

        if response.status_code != status.HTTP_201_CREATED:
            print("\n ВАЛИДАЦИЯ НЕ ПРОЙДЕНА! ОТВЕТ БЭКЕНДА:", response.data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Task.objects.filter(title="API Task").exists())

    def test_get_tasks_via_api(self):
        task = Task.objects.create(
            user=self.user,
            project=self.project,
            title="existing task",
            description="this task is already in the database",
            status="P",
            priority="M",
        )

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        serializer_data = TaskSerializer(Task.objects.all(), many=True).data

        self.assertEqual(response.data["results"], serializer_data)

    def test_update_task_via_api(self):
        task = Task.objects.create(
            user=self.user,
            project=self.project,
            title="Task to Update",
            description="This task will be updated",
            status="P",
            priority="M",
        )

        url = reverse("task_detail", kwargs={"pk": task.id})
        data = {
            "title": "Updated Task Title",
            "description": "Updated description",
            "status": "D",
            "priority": "L",
        }

        response = self.client.put(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.title, "Updated Task Title")
        self.assertEqual(task.status, "D")
        self.assertEqual(task.priority, "L")

    def test_delete_task_via_api(self):
        task = Task.objects.create(
            user=self.user,
            project=self.project,
            title="Task to Delete",
            description="This task will be deleted",
            status="P",
            priority="M",
        )

        url = reverse("task_detail", kwargs={"pk": task.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(id=task.id).exists())


# PROJECT CRUD TESTS
class APICRUDProjectTests(APITestCase):
    def setUp(self):
        self.user = user.objects.create_user(
            email="project@gmail.com",
            password="projectpass",
            first_name="Project",
            last_name="Tester",
        )
        self.url = reverse("projects")
        self.client.force_authenticate(user=self.user)

    def test_create_project_via_api(self):
        data = {"name": "API Project", "description": "Testing API project creation"}

        response = self.client.post(self.url, data, format="json")
        serializer = ProjectSerializer(data=data)

        if response.status_code != status.HTTP_201_CREATED:
            print("\n ВАЛИДАЦИЯ НЕ ПРОЙДЕНА! ОТВЕТ БЭКЕНДА:", response.data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Project.objects.filter(name="API Project").exists())
        self.assertEqual(serializer.is_valid(), True)
        self.assertEqual(serializer.validated_data["name"], "API Project")
        self.assertEqual(
            serializer.validated_data["description"], "Testing API project creation"
        )
        self.assertNotIn("user", serializer.validated_data)

    def test_get_projects_via_api(self):
        project = Project.objects.create(
            name="Existing API Project",
            user=self.user,
            description="This project is already in the database",
        )

        response = self.client.get(self.url)
        serializer_data = ProjectSerializer(Project.objects.all(), many=True).data

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"], serializer_data)

    def test_update_project_via_api(self):
        project = Project.objects.create(
            name="Project to Update",
            user=self.user,
            description="This project will be updated",
        )

        url = reverse("project_detail", kwargs={"pk": project.id})
        data = {
            "name": "Updated Project Name",
            "description": "Updated project description",
        }
        response = self.client.put(url, data, format="json")
        serializer = ProjectSerializer(project, data=data, partial=True)
        validated_data = serializer.validated_data if serializer.is_valid() else None
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        project.refresh_from_db()
        self.assertEqual(response.data["name"], validated_data["name"])
        self.assertEqual(response.data["description"], validated_data["description"])
        self.assertEqual(project.name, "Updated Project Name")
        self.assertEqual(project.description, "Updated project description")

    def test_delete_project_via_api(self):
        project = Project.objects.create(
            name="Project to Delete",
            user=self.user,
            description="This project will be deleted",
        )
        url = reverse("project_detail", kwargs={"pk": project.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Project.objects.filter(id=project.id).exists())


class APICRUDCommentTests(APITestCase):
    def setUp(self):
        self.user = user.objects.create_user(
            email="comment@gmail.com",
            password="commentpass",
            first_name="Comment",
            last_name="Tester",
        )

        self.project = Project.objects.create(
            name="Comment Test Project", user=self.user
        )
        self.task = Task.objects.create(
            user=self.user,
            project=self.project,
            title="Comment Test Task",
            description="Task for testing comments",
            status="P",
            priority="M",
        )
        self.url = reverse("comments")
        self.client.force_authenticate(user=self.user)

    def test_create_comment_via_api(self):
        data = {
            "task": self.task.id,
            "author": self.user.id,
            "content": "This is a test comment",
        }

        response = self.client.post(self.url, data, format="json")
        serializer = CommentSerializer(data=data)
        if response.status_code != status.HTTP_201_CREATED:
            print("\n ВАЛИДАЦИЯ НЕ ПРОЙДЕНА! ОТВЕТ БЭКЕНДА:", response.data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Comment.objects.filter(content="This is a test comment").exists()
        )
        self.assertEqual(serializer.is_valid(), True)
        self.assertEqual(serializer.validated_data["content"], "This is a test comment")
        self.assertNotIn("author", serializer.validated_data)

    def test_get_comments_via_api(self):
        comment = Comment.objects.create(
            task=self.task, author=self.user, content="existing comment"
        )

        response = self.client.get(self.url)
        serializer_data = CommentSerializer(Comment.objects.all(), many=True).data

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"], serializer_data)

    def test_update_comment_via_api(self):
        comment = Comment.objects.create(
            task=self.task,
            author=self.user,
            content="Comment to Update",
        )

        url = reverse("comment_detail", kwargs={"pk": comment.id})
        data = {
            "content": "Updated comment content",
        }

        response = self.client.patch(url, data, format="json")
        if response.status_code != status.HTTP_200_OK:
            print("\n ОШИБКА ОБНОВЛЕНИЯ КОММЕНТАРИЯ:", response.data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        comment.refresh_from_db()
        self.assertEqual(response.data["content"], "Updated comment content")
        self.assertEqual(comment.content, "Updated comment content")

    def test_delete_comment_via_api(self):
        comment = Comment.objects.create(
            task=self.task, author=self.user, content="this comment will be deleted"
        )

        url = reverse("comment_detail", kwargs={"pk": comment.id})

        response = self.client.delete(url)
        if response.status_code != status.HTTP_200_OK:
            print("\n ОШИБКА ОБНОВЛЕНИЯ КОММЕНТАРИЯ:", response.data)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
