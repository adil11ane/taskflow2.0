import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi, projectsApi } from '../api/client'
import styles from './TaskList.module.css'

const PRIORITY_LABEL = { L: 'Низкий', M: 'Средний', H: 'Высокий', C: 'Критичный' }
const PRIORITY_COLOR = { L: '#22d3a4', M: '#4ea8de', H: '#f5c542', C: '#ff5c5c' }
const STATUS_LABEL = { B: 'Backlog', P: 'В работе', D: 'Готово' }
const STATUS_COLOR = { B: '#5a5f80', P: '#6c63ff', D: '#22d3a4' }

export default function TaskList({ selectedProject, onOpenTask }) {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState('all') // all | B | P | D
  const [form, setForm] = useState({ title: '', description: '', priority: 'M', status: 'P', due_date: '' })

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.list().then(r => r.data),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (data) => tasksApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      setCreating(false)
      setForm({ title: '', description: '', priority: 'M', status: 'P', due_date: '' })
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => tasksApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => tasksApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const payload = { ...form }
    if (selectedProject) payload.project = selectedProject.id
    if (!payload.due_date) delete payload.due_date
    createMut.mutate(payload)
  }

  const filteredTasks = tasks
    .filter(t => !selectedProject || t.project === selectedProject.id)
    .filter(t => filter === 'all' || t.status === filter)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>
            {selectedProject ? selectedProject.name : 'Все задачи'}
            <span className={styles.count}>{filteredTasks.length}</span>
          </h2>
          <button className={styles.addBtn} onClick={() => setCreating(v => !v)}>
            {creating ? '✕ Отмена' : '+ Задача'}
          </button>
        </div>

        {/* Status filter */}
        <div className={styles.filters}>
          {[['all', 'Все'], ['B', 'Backlog'], ['P', 'В работе'], ['D', 'Готово']].map(([v, l]) => (
            <button
              key={v}
              className={`${styles.filterBtn} ${filter === v ? styles.filterActive : ''}`}
              onClick={() => setFilter(v)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Create form */}
      {creating && (
        <form className={styles.createForm} onSubmit={handleCreate}>
          <input
            className={styles.input}
            placeholder="Название задачи *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            autoFocus
          />
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            placeholder="Описание"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
          />
          <div className={styles.formRow}>
            <select className={styles.select} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              {Object.entries(PRIORITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select className={styles.select} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {!selectedProject && (
              <select className={styles.select} value={form.project || ''} onChange={e => setForm(f => ({ ...f, project: e.target.value || undefined }))}>
                <option value="">Без проекта</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <input
              type="datetime-local"
              className={styles.select}
              value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
            />
          </div>
          <button className={styles.submitBtn} type="submit" disabled={createMut.isPending}>
            {createMut.isPending ? 'Создаём...' : 'Создать задачу'}
          </button>
        </form>
      )}

      {/* Task list */}
      <div className={styles.list}>
        {isLoading && (
          [...Array(4)].map((_, i) => (
            <div key={i} className={`${styles.skeletonCard} skeleton`} />
          ))
        )}

        {!isLoading && filteredTasks.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>✓</span>
            <p>Нет задач</p>
            <button className={styles.emptyBtn} onClick={() => setCreating(true)}>Создать первую</button>
          </div>
        )}

        {filteredTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            projects={projects}
            onOpen={() => onOpenTask(task)}
            onStatusChange={(status) => updateMut.mutate({ id: task.id, data: { status } })}
            onDelete={() => deleteMut.mutate(task.id)}
          />
        ))}
      </div>
    </div>
  )
}

function TaskCard({ task, projects, onOpen, onStatusChange, onDelete }) {
  const project = projects.find(p => p.id === task.project)
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'D'

  return (
    <div className={`${styles.card} animate-in`}>
      <div className={styles.cardLeft}>
        <StatusCircle status={task.status} onChange={onStatusChange} />
      </div>
      <div className={styles.cardBody} onClick={onOpen}>
        <div className={styles.cardTitle}>{task.title}</div>
        {task.description && <p className={styles.cardDesc}>{task.description}</p>}
        <div className={styles.cardMeta}>
          <span className={styles.badge} style={{ background: PRIORITY_COLOR[task.priority] + '22', color: PRIORITY_COLOR[task.priority] }}>
            {PRIORITY_LABEL[task.priority]}
          </span>
          {project && (
            <span className={styles.badge} style={{ background: 'rgba(108,99,255,0.15)', color: '#8a83ff' }}>
              {project.name}
            </span>
          )}
          {task.due_date && (
            <span className={`${styles.badge} ${isOverdue ? styles.overdue : ''}`}>
              {formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>
      <button className={styles.deleteBtn} onClick={onDelete} title="Удалить">
        ✕
      </button>
    </div>
  )
}

function StatusCircle({ status, onChange }) {
  const next = status === 'B' ? 'P' : status === 'P' ? 'D' : 'B'
  return (
    <button
      className={styles.statusCircle}
      style={{ borderColor: STATUS_COLOR[status], background: status === 'D' ? STATUS_COLOR['D'] : 'transparent' }}
      onClick={e => { e.stopPropagation(); onChange(next) }}
      title={`Статус: ${STATUS_LABEL[status]} → ${STATUS_LABEL[next]}`}
    >
      {status === 'D' && <span style={{ color: '#0f1117', fontSize: 12 }}>✓</span>}
    </button>
  )
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
