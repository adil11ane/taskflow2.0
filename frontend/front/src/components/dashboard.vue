<template>
    <div class="dashboard-page">
        <header class="dashboard-header">
            <h1>TaskFlow</h1>
            <button class="logout-btn" @click="handleLogout">Выйти</button>
        </header>

        <main class="dashboard-content">

            <!-- ВИД 1: список проектов -->
            <template v-if="view === 'projects'">
                <section class="new-card">
                    <h2>Новый проект</h2>
                    <form class="new-form" @submit.prevent="handleCreateProject">
                        <input
                            v-model="newProjectName"
                            type="text"
                            placeholder="Название проекта"
                            required
                        />
                        <textarea
                            v-model="newProjectDescription"
                            placeholder="Описание проекта"
                            required
                        ></textarea>
                        <button type="submit" :disabled="isLoading">
                            {{ isLoading ? 'Добавление...' : 'Создать проект' }}
                        </button>
                    </form>
                    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
                </section>

                <section>
                    <p v-if="isLoading && projects.length === 0">Загрузка проектов...</p>
                    <p v-else-if="projects.length === 0" class="empty-state">
                        Проектов пока нет — создайте первый выше.
                    </p>

                    <div v-else class="cards-list">
                        <div
                            v-for="project in projects"
                            :key="project.id"
                            class="card project-card"
                            @click="openProject(project)"
                        >
                            <div class="card-main">
                                <h3>{{ project.name }}</h3>
                                <p class="card-description">{{ project.description }}</p>
                            </div>
                            <button class="delete-btn" @click.stop="handleDeleteProject(project.id)">
                                Удалить
                            </button>
                        </div>
                    </div>
                </section>
            </template>

            <!-- ВИД 2: задачи выбранного проекта -->
            <template v-else-if="view === 'tasks'">
                <button class="back-btn" @click="backToProjects">← Все проекты</button>
                <h2 class="section-title">{{ selectedProject?.name }}</h2>

                <section class="new-card">
                    <h2>Новая задача</h2>
                    <form class="new-form" @submit.prevent="handleCreateTask">
                        <input
                            v-model="newTaskTitle"
                            type="text"
                            placeholder="Название задачи"
                            required
                        />
                        <textarea
                            v-model="newTaskDescription"
                            placeholder="Описание задачи"
                            required
                        ></textarea>
                        <select v-model="newTaskPriority">
                            <option value="L">Низкий приоритет</option>
                            <option value="M">Средний приоритет</option>
                            <option value="H">Высокий приоритет</option>
                            <option value="C">Критический приоритет</option>
                        </select>
                        <button type="submit" :disabled="isLoading">
                            {{ isLoading ? 'Добавление...' : 'Добавить задачу' }}
                        </button>
                    </form>
                    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
                </section>

                <section>
                    <p v-if="isLoading && tasks.length === 0">Загрузка задач...</p>
                    <p v-else-if="tasks.length === 0" class="empty-state">
                        Задач пока нет — добавьте первую выше.
                    </p>

                    <div v-else class="cards-list">
                        <div
                            v-for="task in tasks"
                            :key="task.id"
                            class="card task-card"
                            :class="`priority-${task.priority}`"
                        >
                            <div class="card-main" @click="openTask(task)">
                                <h3>{{ task.title }}</h3>
                                <span class="badge">{{ priorityLabel(task.priority) }}</span>
                            </div>
                            <p class="card-description">{{ task.description }}</p>

                            <div class="task-controls">
                                <select
                                    :value="task.status"
                                    @change="handleStatusChange(task, $event.target.value)"
                                >
                                    <option value="B">Backlog</option>
                                    <option value="P">В работе</option>
                                    <option value="D">Готово</option>
                                </select>

                                <button class="link-btn" @click="openTask(task)">
                                    Комментарии
                                </button>

                                <button class="delete-btn" @click="handleDeleteTask(task.id)">
                                    Удалить
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </template>

            <!-- ВИД 3: комментарии выбранной задачи -->
            <template v-else-if="view === 'comments'">
                <button class="back-btn" @click="backToTasks">← Назад к задачам</button>
                <h2 class="section-title">{{ selectedTask?.title }}</h2>
                <p class="card-description">{{ selectedTask?.description }}</p>

                <section class="new-card">
                    <h2>Добавить комментарий</h2>
                    <form class="new-form" @submit.prevent="handleCreateComment">
                        <textarea
                            v-model="newCommentContent"
                            placeholder="Ваш комментарий (необязательно сейчас — можно вернуться позже)"
                        ></textarea>
                        <button type="submit" :disabled="isLoading || !newCommentContent.trim()">
                            {{ isLoading ? 'Добавление...' : 'Отправить комментарий' }}
                        </button>
                    </form>
                    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
                </section>

                <section>
                    <p v-if="isLoading && comments.length === 0">Загрузка комментариев...</p>
                    <p v-else-if="comments.length === 0" class="empty-state">
                        Комментариев пока нет. Можете добавить сейчас или вернуться позже.
                    </p>

                    <div v-else class="cards-list">
                        <div v-for="comment in comments" :key="comment.id" class="card comment-card">
                            <div class="card-main">
                                <strong>{{ comment.author?.first_name || 'Вы' }}</strong>
                                <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
                            </div>
                            <p class="card-description">{{ comment.content }}</p>
                            <button class="delete-btn" @click="handleDeleteComment(comment.id)">
                                Удалить
                            </button>
                        </div>
                    </div>
                </section>
            </template>

        </main>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStores'
import tasksAPI from '@/api/tasks'
import projectsAPI from '@/api/projects'
import commentsAPI from '@/api/comments'

const router = useRouter()
const store = useAuthStore()

// Навигация: 'projects' -> 'tasks' -> 'comments'
const view = ref('projects')

const isLoading = ref(false)
const errorMessage = ref('')

// Проекты
const projects = ref([])
const newProjectName = ref('')
const newProjectDescription = ref('')

// Задачи выбранного проекта
const selectedProject = ref(null)
const tasks = ref([])
const newTaskTitle = ref('')
const newTaskDescription = ref('')
const newTaskPriority = ref('M')

// Комментарии выбранной задачи
const selectedTask = ref(null)
const comments = ref([])
const newCommentContent = ref('')

const priorityLabels = { L: 'Низкий', M: 'Средний', H: 'Высокий', C: 'Критический' }
const priorityLabel = (code) => priorityLabels[code] || code

const formatDate = (isoString) => {
    if (!isoString) return ''
    return new Date(isoString).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    })
}

// ---- Проекты ----
const loadProjects = async () => {
    isLoading.value = true
    errorMessage.value = ''
    try {
        projects.value = await projectsAPI.list()
    } catch (error) {
        console.error('Ошибка загрузки проектов:', error)
        errorMessage.value = 'Не удалось загрузить проекты'
    } finally {
        isLoading.value = false
    }
}

const handleCreateProject = async () => {
    isLoading.value = true
    errorMessage.value = ''
    try {
        const created = await projectsAPI.create({
            name: newProjectName.value,
            description: newProjectDescription.value,
        })
        projects.value.unshift(created)
        newProjectName.value = ''
        newProjectDescription.value = ''
    } catch (error) {
        console.error('Ошибка создания проекта:', error)
        errorMessage.value = 'Не удалось создать проект'
    } finally {
        isLoading.value = false
    }
}

const handleDeleteProject = async (projectId) => {
    try {
        await projectsAPI.remove(projectId)
        projects.value = projects.value.filter((p) => p.id !== projectId)
    } catch (error) {
        console.error('Ошибка удаления проекта:', error)
        errorMessage.value = 'Не удалось удалить проект'
    }
}

// ---- Задачи ----
const openProject = async (project) => {
    selectedProject.value = project
    view.value = 'tasks'
    errorMessage.value = ''
    isLoading.value = true
    try {
        const allTasks = await tasksAPI.list()
        tasks.value = allTasks.filter((t) => t.project === project.id)
    } catch (error) {
        console.error('Ошибка загрузки задач:', error)
        errorMessage.value = 'Не удалось загрузить задачи'
    } finally {
        isLoading.value = false
    }
}

const backToProjects = () => {
    view.value = 'projects'
    selectedProject.value = null
    tasks.value = []
}

const handleCreateTask = async () => {
    isLoading.value = true
    errorMessage.value = ''
    try {
        const created = await tasksAPI.create({
            title: newTaskTitle.value,
            description: newTaskDescription.value,
            priority: newTaskPriority.value,
            project: selectedProject.value.id,
        })
        tasks.value.unshift(created)
        newTaskTitle.value = ''
        newTaskDescription.value = ''
        newTaskPriority.value = 'M'
    } catch (error) {
        console.error('Ошибка создания задачи:', error)
        errorMessage.value = 'Не удалось создать задачу'
    } finally {
        isLoading.value = false
    }
}

const handleStatusChange = async (task, newStatus) => {
    try {
        const updated = await tasksAPI.update(task.id, { status: newStatus })
        task.status = updated.status
    } catch (error) {
        console.error('Ошибка обновления статуса:', error)
        errorMessage.value = 'Не удалось обновить статус задачи'
    }
}

const handleDeleteTask = async (taskId) => {
    try {
        await tasksAPI.remove(taskId)
        tasks.value = tasks.value.filter((t) => t.id !== taskId)
    } catch (error) {
        console.error('Ошибка удаления задачи:', error)
        errorMessage.value = 'Не удалось удалить задачу'
    }
}

// ---- Комментарии ----
const openTask = async (task) => {
    selectedTask.value = task
    view.value = 'comments'
    errorMessage.value = ''
    isLoading.value = true
    try {
        comments.value = await commentsAPI.list(task.id)
    } catch (error) {
        console.error('Ошибка загрузки комментариев:', error)
        errorMessage.value = 'Не удалось загрузить комментарии'
    } finally {
        isLoading.value = false
    }
}

const backToTasks = () => {
    view.value = 'tasks'
    selectedTask.value = null
    comments.value = []
}

const handleCreateComment = async () => {
    if (!newCommentContent.value.trim()) return
    isLoading.value = true
    errorMessage.value = ''
    try {
        const created = await commentsAPI.create({
            task: selectedTask.value.id,
            content: newCommentContent.value,
        })
        comments.value.push(created)
        newCommentContent.value = ''
    } catch (error) {
        console.error('Ошибка создания комментария:', error)
        errorMessage.value = 'Не удалось отправить комментарий'
    } finally {
        isLoading.value = false
    }
}

const handleDeleteComment = async (commentId) => {
    try {
        await commentsAPI.remove(commentId)
        comments.value = comments.value.filter((c) => c.id !== commentId)
    } catch (error) {
        console.error('Ошибка удаления комментария:', error)
        errorMessage.value = 'Не удалось удалить комментарий'
    }
}

// ---- Общее ----
const handleLogout = () => {
    store.clearAuth()
    router.push('/')
}

onMounted(loadProjects)
</script>

<style scoped>
.dashboard-page {
    min-height: 100vh;
    background-color: #f3f4f6;
    font-family: sans-serif;
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.dashboard-header h1 {
    color: #4f46e5;
    margin: 0;
}
.logout-btn {
    background-color: #4f46e5;
    color: white;
    padding: 0.5rem 1.25rem;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
}
.logout-btn:hover { background-color: #4338ca; }

.dashboard-content {
    max-width: 720px;
    margin: 2rem auto;
    padding: 0 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.section-title {
    margin: 0;
    color: #1f2937;
}

.back-btn {
    align-self: flex-start;
    background: none;
    border: none;
    color: #4f46e5;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
}
.back-btn:hover { text-decoration: underline; }

.new-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
.new-card h2 {
    margin-top: 0;
    font-size: 1.125rem;
    color: #1f2937;
}

.new-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}
.new-form input,
.new-form select,
.new-form textarea {
    padding: 0.625rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    font-family: inherit;
}
.new-form textarea {
    resize: vertical;
    min-height: 60px;
}
.new-form button {
    background-color: #4f46e5;
    color: white;
    padding: 0.625rem 1.25rem;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    align-self: flex-start;
}
.new-form button:disabled {
    background-color: #a5b4fc;
    cursor: not-allowed;
}

.empty-state {
    text-align: center;
    color: #6b7280;
}

.cards-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.card {
    background: white;
    padding: 1rem 1.25rem;
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border-left: 4px solid #d1d5db;
}
.project-card { cursor: pointer; }
.project-card:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); }

.task-card.priority-L { border-left-color: #9ca3af; }
.task-card.priority-M { border-left-color: #3b82f6; }
.task-card.priority-H { border-left-color: #f59e0b; }
.task-card.priority-C { border-left-color: #ef4444; }

.card-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
}
.card-main h3 {
    margin: 0;
    font-size: 1rem;
    color: #1f2937;
}
.card-description {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0.5rem 0;
}
.badge {
    font-size: 0.7rem;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    background: #eef2ff;
    color: #4f46e5;
    white-space: nowrap;
}

.task-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
}
.task-controls select {
    padding: 0.4rem 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.8rem;
}
.link-btn {
    background: none;
    border: 1px solid #4f46e5;
    color: #4f46e5;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
}
.link-btn:hover { background: #4f46e5; color: white; }

.delete-btn {
    background: none;
    border: 1px solid #ef4444;
    color: #ef4444;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
}
.delete-btn:hover { background: #ef4444; color: white; }

.comment-card .card-main {
    cursor: default;
    justify-content: flex-start;
    gap: 0.75rem;
}
.comment-date {
    color: #9ca3af;
    font-size: 0.75rem;
}

.error-message {
    color: #dc2626;
    font-size: 0.875rem;
    margin-top: 0.75rem;
    margin-bottom: 0;
}
</style>
