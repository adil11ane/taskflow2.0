<template>
    <div class="dashboard-page">
        <header class="dashboard-header">
            <h1>TaskFlow</h1>
            <button class="logout-btn" @click="handleLogout">Выйти</button>
        </header>

        <main class="dashboard-content">
            <section class="new-task-card">
                <h2>Новая задача</h2>
                <form class="new-task-form" @submit.prevent="handleCreate">
                    <input
                        v-model="newTitle"
                        type="text"
                        placeholder="Название задачи"
                        required
                    />
                    <select v-model="newPriority">
                        <option value="L">Низкий приоритет</option>
                        <option value="M">Средний приоритет</option>
                        <option value="H">Высокий приоритет</option>
                        <option value="C">Критический приоритет</option>
                    </select>
                    <button type="submit" :disabled="isCreating">
                        {{ isCreating ? 'Добавление...' : 'Добавить' }}
                    </button>
                </form>
                <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
            </section>

            <section class="tasks-section">
                <p v-if="isLoading">Загрузка задач...</p>
                <p v-else-if="tasks.length === 0" class="empty-state">
                    Задач пока нет — добавьте первую выше.
                </p>

                <div v-else class="tasks-list">
                    <div
                        v-for="task in tasks"
                        :key="task.id"
                        class="task-card"
                        :class="`priority-${task.priority}`"
                    >
                        <div class="task-main">
                            <h3>{{ task.title }}</h3>
                            <span class="badge">{{ priorityLabel(task.priority) }}</span>
                        </div>

                        <div class="task-controls">
                            <select
                                :value="task.status"
                                @change="handleStatusChange(task, $event.target.value)"
                            >
                                <option value="B">Backlog</option>
                                <option value="P">В работе</option>
                                <option value="D">Готово</option>
                            </select>

                            <button class="delete-btn" @click="handleDelete(task.id)">
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStores'
import tasksAPI from '@/api/tasks'

const router = useRouter()
const store = useAuthStore()

const tasks = ref([])
const isLoading = ref(false)
const isCreating = ref(false)
const errorMessage = ref('')

const newTitle = ref('')
const newPriority = ref('M')

const priorityLabels = {
    L: 'Низкий',
    M: 'Средний',
    H: 'Высокий',
    C: 'Критический',
}
const priorityLabel = (code) => priorityLabels[code] || code

const loadTasks = async () => {
    isLoading.value = true
    errorMessage.value = ''
    try {
        tasks.value = await tasksAPI.list()
    } catch (error) {
        console.error('Ошибка загрузки задач:', error)
        errorMessage.value = 'Не удалось загрузить задачи'
    } finally {
        isLoading.value = false
    }
}

const handleCreate = async () => {
    isCreating.value = true
    errorMessage.value = ''
    try {
        const created = await tasksAPI.create({
            title: newTitle.value,
            description: '',
            priority: newPriority.value,
        })
        // Добавляем в начало списка, а не делаем повторный fetch —
        // так быстрее и не нужен лишний запрос к серверу.
        tasks.value.unshift(created)
        newTitle.value = ''
        newPriority.value = 'M'
    } catch (error) {
        console.error('Ошибка создания задачи:', error)
        errorMessage.value = 'Не удалось создать задачу'
    } finally {
        isCreating.value = false
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

const handleDelete = async (taskId) => {
    try {
        await tasksAPI.remove(taskId)
        tasks.value = tasks.value.filter((t) => t.id !== taskId)
    } catch (error) {
        console.error('Ошибка удаления задачи:', error)
        errorMessage.value = 'Не удалось удалить задачу'
    }
}

const handleLogout = () => {
    store.clearAuth()
    router.push('/')
}

onMounted(loadTasks)
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
.logout-btn:hover {
    background-color: #4338ca;
}

.dashboard-content {
    max-width: 720px;
    margin: 2rem auto;
    padding: 0 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.new-task-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
.new-task-card h2 {
    margin-top: 0;
    font-size: 1.125rem;
    color: #1f2937;
}

.new-task-form {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}
.new-task-form input {
    flex: 1;
    min-width: 180px;
    padding: 0.625rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
}
.new-task-form select {
    padding: 0.625rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
}
.new-task-form button {
    background-color: #4f46e5;
    color: white;
    padding: 0.625rem 1.25rem;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
}
.new-task-form button:disabled {
    background-color: #a5b4fc;
    cursor: not-allowed;
}

.empty-state {
    text-align: center;
    color: #6b7280;
}

.tasks-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.task-card {
    background: white;
    padding: 1rem 1.25rem;
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border-left: 4px solid #d1d5db;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}
.task-card.priority-L { border-left-color: #9ca3af; }
.task-card.priority-M { border-left-color: #3b82f6; }
.task-card.priority-H { border-left-color: #f59e0b; }
.task-card.priority-C { border-left-color: #ef4444; }

.task-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
.task-main h3 {
    margin: 0;
    font-size: 1rem;
    color: #1f2937;
}
.badge {
    font-size: 0.7rem;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    background: #eef2ff;
    color: #4f46e5;
}

.task-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.task-controls select {
    padding: 0.4rem 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.8rem;
}
.delete-btn {
    background: none;
    border: 1px solid #ef4444;
    color: #ef4444;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
}
.delete-btn:hover {
    background: #ef4444;
    color: white;
}

.error-message {
    color: #dc2626;
    font-size: 0.875rem;
    margin-top: 0.75rem;
    margin-bottom: 0;
}
</style>
