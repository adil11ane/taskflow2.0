from django.urls import path
from . import views

urlpatterns = [
    path("api/tasks/", views.TaskAPIView.as_view(), name="tasks"),
    path(
        "api/tasks/<int:pk>/",
        views.TaskDetailAPIView.as_view(),
        name="task_detail",
    ),
    path("api/projects/", views.ProjectListCreateAPIView.as_view(), name="projects"),
    path(
        "api/projects/<int:pk>/",
        views.ProjectDetailAPIView.as_view(),
        name="project_detail",
    ),
    path("api/comments/", views.CommentListCreateAPIView.as_view(), name="comments"),
    path(
        "api/comments/<int:pk>/",
        views.CommentDetailAPIView.as_view(),
        name="comment_detail",
    ),
]
