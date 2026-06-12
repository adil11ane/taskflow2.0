import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi, commentsApi, projectsApi } from '../api/client'
import styles from './TaskDetail.module.css'

const PRIORITY_LABEL = { L: 'Низкий', M: 'Средний', H: 'Высокий', C: 'Критичный' }
const STATUS_LABEL = { B: 'Backlog', P: 'В работе', D: 'Готово' }

export default function TaskDetail({ task, onClose }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...task })
  const [comment, setComment] = useState('')

  useEffect(() => {
    setForm({ ...task })
    setEditing(false)
    setComment('')
  }, [task?.id])

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then(r => r.data),
  })

  const { data: comments = [] } = useQuery({
    queryKey: ['comments'],
    queryFn: () => commentsApi.list().then(r => r.data),
  })

  const taskComments = comments.filter(c => c.task === task.id)

  const updateMut = useMutation({
    mutationFn: (data) => tasksApi.update(task.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      setEditing(false)
    },
  })

  const addCommentMut = useMutation({
    mutationFn: (data) => commentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments'] })
      setComment('')
    },
  })

  const deleteCommentMut = useMutation({
    mutationFn: (id) => commentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments'] }),
  })

  const handleSave = () => {
    const payload = { ...form }
    if (!payload.due_date) delete payload.due_date
    updateMut.mutate(payload)
  }

  const handleAddComment = (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    addCommentMut.mutate({ task: task.id, content: comment.trim() })
  }

  const project = projects.find(p => p.id === task.project)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerMeta}>
            {project && <span className={styles.projectChip}>{project.name}</span>}
            <span className={styles.id}>#{task.id}</span>
          </div>
          <div className={styles.drawerActions}>
            {!editing && (
              <button className={styles.editBtn} onClick={() => setEditing(true)}>Редактировать</button>
            )}
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        <div className={styles.drawerBody}>
          {/* Title */}
          {editing ? (
            <input
              className={styles.titleInput}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          ) : (
            <h2 className={styles.taskTitle}>{task.title}</h2>
          )}

          {/* Meta badges */}
          {!editing && (
            <div className={styles.metaRow}>
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.due_date && (
                <span className={styles.metaBadge}>
                  📅 {new Date(task.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
            </div>
          )}

          {/* Edit form */}
          {editing && (
            <div className={styles.editForm}>
              <div className={styles.editRow}>
                <div className={styles.editField}>
                  <label className={styles.editLabel}>Статус</label>
                  <select className={styles.editSelect} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className={styles.editField}>
                  <label className={styles.editLabel}>Приоритет</label>
                  <select className={styles.editSelect} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    {Object.entries(PRIORITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className={styles.editField}>
                  <label className={styles.editLabel}>Дедлайн</label>
                  <input
                    type="datetime-local"
                    className={styles.editSelect}
                    value={form.due_date ? form.due_date.slice(0,16) : ''}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Проект</label>
                <select className={styles.editSelect} value={form.project || ''} onChange={e => setForm(f => ({ ...f, project: e.target.value || null }))}>
                  <option value="">Без проекта</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Description */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Описание</div>
            {editing ? (
              <textarea
                className={styles.descTextarea}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="Добавьте описание..."
              />
            ) : (
              <p className={styles.description}>
                {task.description || <span className={styles.empty}>Нет описания</span>}
              </p>
            )}
          </div>

          {editing && (
            <div className={styles.editActions}>
              <button className={styles.saveBtn} onClick={handleSave} disabled={updateMut.isPending}>
                {updateMut.isPending ? 'Сохраняем...' : 'Сохранить'}
              </button>
              <button className={styles.cancelBtn} onClick={() => { setEditing(false); setForm({ ...task }) }}>
                Отмена
              </button>
            </div>
          )}

          {/* Comments */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Комментарии ({taskComments.length})</div>
            <div className={styles.comments}>
              {taskComments.length === 0 && (
                <p className={styles.empty}>Пока нет комментариев</p>
              )}
              {taskComments.map(c => (
                <div key={c.id} className={styles.comment}>
                  <div className={styles.commentAvatar}>
                    {(c.author_email || 'U')[0].toUpperCase()}
                  </div>
                  <div className={styles.commentBody}>
                    <p className={styles.commentText}>{c.content}</p>
                    <span className={styles.commentDate}>
                      {new Date(c.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <button
                    className={styles.deleteCommentBtn}
                    onClick={() => deleteCommentMut.mutate(c.id)}
                    title="Удалить"
                  >✕</button>
                </div>
              ))}
            </div>
            <form className={styles.commentForm} onSubmit={handleAddComment}>
              <input
                className={styles.commentInput}
                placeholder="Написать комментарий..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
              <button className={styles.commentBtn} type="submit" disabled={!comment.trim() || addCommentMut.isPending}>
                →
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const config = { B: { label: 'Backlog', color: '#5a5f80' }, P: { label: 'В работе', color: '#6c63ff' }, D: { label: 'Готово', color: '#22d3a4' } }
  const c = config[status]
  return <span className={styles.metaBadge} style={{ background: c.color + '22', color: c.color }}>{c.label}</span>
}

function PriorityBadge({ priority }) {
  const colors = { L: '#22d3a4', M: '#4ea8de', H: '#f5c542', C: '#ff5c5c' }
  const labels = { L: 'Низкий', M: 'Средний', H: 'Высокий', C: 'Критичный' }
  const c = colors[priority]
  return <span className={styles.metaBadge} style={{ background: c + '22', color: c }}>{labels[priority]}</span>
}
