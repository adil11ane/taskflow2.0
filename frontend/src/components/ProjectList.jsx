import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../api/client'
import styles from './ProjectList.module.css'

export default function ProjectList({ selectedProject, onSelectProject }) {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (data) => projectsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      setCreating(false)
      setName('')
      setDescription('')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id) => projectsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })

  const handleCreate = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    createMut.mutate({ name: name.trim(), description: description.trim() })
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Проекты</span>
        <button className={styles.addBtn} onClick={() => setCreating(v => !v)} title="Новый проект">
          {creating ? '✕' : '+'}
        </button>
      </div>

      {creating && (
        <form className={styles.createForm} onSubmit={handleCreate}>
          <input
            className={styles.input}
            placeholder="Название проекта"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <input
            className={styles.input}
            placeholder="Описание (необязательно)"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <button className={styles.createBtn} type="submit" disabled={createMut.isPending}>
            {createMut.isPending ? 'Создаём...' : 'Создать'}
          </button>
        </form>
      )}

      {isLoading && (
        <div className={styles.list}>
          {[1,2,3].map(i => <div key={i} className={`${styles.skeleton} skeleton`} />)}
        </div>
      )}

      {!isLoading && projects.length === 0 && !creating && (
        <p className={styles.empty}>Нет проектов. Создайте первый!</p>
      )}

      <div className={styles.list}>
        {/* "All tasks" item */}
        <button
          className={`${styles.item} ${!selectedProject ? styles.selected : ''}`}
          onClick={() => onSelectProject(null)}
        >
          <span className={styles.itemIcon}>📋</span>
          <span className={styles.itemName}>Все задачи</span>
        </button>

        {projects.map(p => (
          <div
            key={p.id}
            className={`${styles.item} ${selectedProject?.id === p.id ? styles.selected : ''}`}
          >
            <button className={styles.itemBody} onClick={() => onSelectProject(p)}>
              <span className={styles.itemIcon} style={{ background: projectColor(p.id) }}>
                {p.name[0].toUpperCase()}
              </span>
              <div className={styles.itemMeta}>
                <span className={styles.itemName}>{p.name}</span>
                {p.description && <span className={styles.itemDesc}>{p.description}</span>}
              </div>
            </button>
            <button
              className={styles.deleteBtn}
              onClick={() => deleteMut.mutate(p.id)}
              title="Удалить проект"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function projectColor(id) {
  const colors = ['#6c63ff33', '#22d3a433', '#f5c54233', '#ff5c5c33', '#4ea8de33']
  return colors[id % colors.length]
}
