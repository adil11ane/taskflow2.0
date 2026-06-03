from django.urls import path
from . import views

urlpatterns = [
    path("tasks/", views.TaskAPIView.as_view(), name="tasks"),
    path(
        "tasks/<int:pk>/",
        views.TaskDetailAPIView.as_view(),
        name="task_detail",
    ),
    path("projects/", views.ProjectListCreateAPIView.as_view(), name="projects"),
    path(
        "projects/<int:pk>/",
        views.ProjectDetailAPIView.as_view(),
        name="project_detail",
    ),
    path("comments/", views.CommentListCreateAPIView.as_view(), name="comments"),
    path(
        "comments/<int:pk>/",
        views.CommentDetailAPIView.as_view(),
        name="comment_detail",
    ),
]
