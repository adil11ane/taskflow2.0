import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi, projectsApi } from '../api/client'
import styles from './KanbanBoard.module.css'

const COLUMNS = [
  { id: 'B', label: 'Backlog', color: '#5a5f80' },
  { id: 'P', label: 'В работе', color: '#6c63ff' },
  { id: 'D', label: 'Готово', color: '#22d3a4' },
]

const PRIORITY_COLOR = { L: '#22d3a4', M: '#4ea8de', H: '#f5c542', C: '#ff5c5c' }
const PRIORITY_LABEL = { L: 'Low', M: 'Med', H: 'High', C: 'Crit' }

export default function KanbanBoard({ selectedProject, onOpenTask }) {
  const qc = useQueryClient()
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.list().then(r => r.data),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then(r => r.data),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => tasksApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => tasksApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const filtered = tasks.filter(t =>
    !selectedProject || t.project === selectedProject.id
  )

  const byStatus = (status) => filtered.filter(t => t.status === status)

  const onDragStart = (e, task) => {
    setDragging(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = (e, colId) => {
    e.preventDefault()
    setDragOver(colId)
  }

  const onDrop = (e, newStatus) => {
    e.preventDefault()
    if (dragging && dragging.status !== newStatus) {
      updateMut.mutate({ id: dragging.id, data: { status: newStatus } })
    }
    setDragging(null)
    setDragOver(null)
  }

  const onDragEnd = () => {
    setDragging(null)
    setDragOver(null)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Kanban
          {selectedProject && <span className={styles.sub}> · {selectedProject.name}</span>}
        </h2>
        <div className={styles.legend}>
          {COLUMNS.map(c => (
            <span key={c.id} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: c.color }} />
              {c.label}
              <span className={styles.legendCount}>{byStatus(c.id).length}</span>
            </span>
          ))}
        </div>
      </div>

      <div className={styles.board}>
        {COLUMNS.map(col => (
          <div
            key={col.id}
            className={`${styles.column} ${dragOver === col.id ? styles.dragOver : ''}`}
            onDragOver={e => onDragOver(e, col.id)}
            onDrop={e => onDrop(e, col.id)}
          >
            <div className={styles.colHeader}>
              <span className={styles.colDot} style={{ background: col.color }} />
              <span className={styles.colLabel}>{col.label}</span>
              <span className={styles.colCount}>{byStatus(col.id).length}</span>
            </div>

            <div className={styles.colBody}>
              {isLoading && [...Array(2)].map((_, i) => (
                <div key={i} className={`${styles.skeletonCard} skeleton`} />
              ))}

              {byStatus(col.id).map(task => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  projects={projects}
                  isDragging={dragging?.id === task.id}
                  onDragStart={e => onDragStart(e, task)}
                  onDragEnd={onDragEnd}
                  onClick={() => onOpenTask(task)}
                  onDelete={() => deleteMut.mutate(task.id)}
                />
              ))}

              {!isLoading && byStatus(col.id).length === 0 && (
                <div className={styles.colEmpty}>
                  Перетащи задачу сюда
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function KanbanCard({ task, projects, isDragging, onDragStart, onDragEnd, onClick, onDelete }) {
  const project = projects.find(p => p.id === task.project)
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'D'

  return (
    <div
      className={`${styles.card} ${isDragging ? styles.dragging : ''} animate-in`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <div className={styles.cardTop}>
        <span
          className={styles.priority}
          style={{ background: PRIORITY_COLOR[task.priority] + '22', color: PRIORITY_COLOR[task.priority] }}
        >
          {PRIORITY_LABEL[task.priority]}
        </span>
        <button
          className={styles.deleteBtn}
          onClick={e => { e.stopPropagation(); onDelete() }}
          title="Удалить"
        >✕</button>
      </div>
      <p className={styles.cardTitle}>{task.title}</p>
      {task.description && (
        <p className={styles.cardDesc}>{task.description}</p>
      )}
      <div className={styles.cardFooter}>
        {project && <span className={styles.projectTag}>{project.name}</span>}
        {task.due_date && (
          <span className={`${styles.dueDate} ${isOverdue ? styles.overdue : ''}`}>
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  )
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
