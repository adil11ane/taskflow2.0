import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ProjectList from '../components/ProjectList'
import TaskList from '../components/TaskList'
import KanbanBoard from '../components/KanbanBoard'
import TaskDetail from '../components/TaskDetail'
import styles from './DashboardPage.module.css'

const VIEWS = [
  { id: 'list', label: 'Список', icon: '☰' },
  { id: 'kanban', label: 'Kanban', icon: '⊞' },
]

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [selectedProject, setSelectedProject] = useState(null)
  const [view, setView] = useState('list')
  const [selectedTask, setSelectedTask] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  const initials = user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] || ''}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <div className={styles.app}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? '' : styles.collapsed}`}>
        <div className={styles.sidebarTop}>
          <div className={styles.logoRow}>
            <div className={styles.logoMark}>T</div>
            {sidebarOpen && <span className={styles.logoText}>TaskFlow</span>}
          </div>
          <button className={styles.toggleBtn} onClick={() => setSidebarOpen(v => !v)} title="Свернуть">
            {sidebarOpen ? '◁' : '▷'}
          </button>
        </div>

        {sidebarOpen && (
          <div className={styles.sidebarBody}>
            <ProjectList
              selectedProject={selectedProject}
              onSelectProject={setSelectedProject}
            />
          </div>
        )}
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {/* Top bar */}
        <div className={styles.topbar}>
          <div className={styles.viewSwitcher}>
            {VIEWS.map(v => (
              <button
                key={v.id}
                className={`${styles.viewBtn} ${view === v.id ? styles.viewActive : ''}`}
                onClick={() => setView(v.id)}
              >
                <span>{v.icon}</span>
                {v.label}
              </button>
            ))}
          </div>

          {/* User menu */}
          <div className={styles.userMenu}>
            <button
              className={styles.avatarBtn}
              onClick={() => setUserMenuOpen(v => !v)}
            >
              <span className={styles.avatar}>{initials}</span>
              {sidebarOpen && <span className={styles.userEmail}>{user?.email || 'Пользователь'}</span>}
            </button>

            {userMenuOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownUser}>
                  <span className={styles.avatarLg}>{initials}</span>
                  <div>
                    <div className={styles.dropdownName}>
                      {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Пользователь'}
                    </div>
                    <div className={styles.dropdownEmail}>{user?.email}</div>
                  </div>
                </div>
                <div className={styles.dropdownDivider} />
                <button className={styles.dropdownItem} onClick={handleLogout}>
                  <span>⎋</span> Выйти
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {view === 'list' && (
            <TaskList
              selectedProject={selectedProject}
              onOpenTask={setSelectedTask}
            />
          )}
          {view === 'kanban' && (
            <KanbanBoard
              selectedProject={selectedProject}
              onOpenTask={setSelectedTask}
            />
          )}
        </div>
      </main>

      {/* Task detail drawer */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Close user menu on outside click */}
      {userMenuOpen && (
        <div className={styles.menuOverlay} onClick={() => setUserMenuOpen(false)} />
      )}
    </div>
  )
}
