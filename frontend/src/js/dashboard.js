
// ── STATE ──
const API = '';
let state = { tasks: [], projects: [], comments: [], currentView: 'dashboard' };
let editingId = { task: null, project: null, comment: null };

// ── AUTH ──
const token = () => localStorage.getItem('access_token');
const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` });

if (!token()) window.location.href = '/index.html';

async function refreshToken() {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return doLogout();
  const res = await fetch(`${API}/api/login/refresh/`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ refresh })
  });
  if (!res.ok) return doLogout();
  const data = await res.json();
  localStorage.setItem('access_token', data.access);
}

async function apiFetch(url, opts={}) {
  let res = await fetch(url, { ...opts, headers: { ...headers(), ...(opts.headers||{}) } });
  if (res.status === 401) {
    await refreshToken();
    res = await fetch(url, { ...opts, headers: { ...headers(), ...(opts.headers||{}) } });
  }
  return res;
}

async function doLogout() {
  const refresh = localStorage.getItem('refresh_token');
  if (refresh) {
    await fetch(`${API}/api/logout/`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ refresh })
    }).catch(()=>{});
  }
  localStorage.clear();
  window.location.href = '/index.html';
}

// ── TOAST ──
function toast(msg, type='success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type==='success'?'✓':'✕'}</span>${msg}`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── MODAL ──
function openModal(title, body) {
  document.getElementById('modal-title-text').textContent = title;
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.remove('open');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.getElementById('modal-overlay').classList.remove('open'); });

// ── NAV ──
function showView(view) {
  state.currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  event.currentTarget.classList.add('active');

  const titles = { dashboard:'Dashboard', tasks:'Tasks', projects:'Projects', comments:'Comments' };
  document.getElementById('page-title').textContent = titles[view];

  const actions = document.getElementById('topbar-actions');
  actions.innerHTML = '';
  if (view === 'tasks') {
    actions.innerHTML = `<button class="btn btn-primary" onclick="openTaskModal()">＋ New Task</button>`;
  } else if (view === 'projects') {
    actions.innerHTML = `<button class="btn btn-primary" onclick="openProjectModal()">＋ New Project</button>`;
  } else if (view === 'comments') {
    actions.innerHTML = `<button class="btn btn-primary" onclick="openCommentModal()">＋ New Comment</button>`;
  }
}

// ── PRIORITY / STATUS HELPERS ──
const PRIORITY_MAP = { L:'Low', M:'Medium', H:'High', C:'Critical' };
const STATUS_MAP   = { B:'Backlog', P:'In Progress', D:'Done' };
const PRIORITY_CLASS = { L:'tag-low', M:'tag-medium', H:'tag-high', C:'tag-critical' };

function priorityTag(p) { return `<span class="tag ${PRIORITY_CLASS[p]||''}">${PRIORITY_MAP[p]||p}</span>`; }
function statusTag(s)   { return `<span class="status-${s}" style="font-size:12px;font-weight:500">${STATUS_MAP[s]||s}</span>`; }
function fmtDate(d)     { if (!d) return '—'; return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
function userInitials(u){ if (!u) return '?'; return ((u.first_name||u.email||'?')[0]).toUpperCase(); }

// ── LOAD DATA ──
async function loadAll() {
  const [t, p, c] = await Promise.all([
    apiFetch(`${API}/api/tasks/`).then(r=>r.json()).catch(()=>[]),
    apiFetch(`${API}/api/projects/`).then(r=>r.json()).catch(()=>[]),
    apiFetch(`${API}/api/comments/`).then(r=>r.json()).catch(()=>[]),
  ]);
  state.tasks    = Array.isArray(t) ? t : [];
  state.projects = Array.isArray(p) ? p : [];
  state.comments = Array.isArray(c) ? c : [];

  updateBadges();
  renderStats();
  renderKanban();
  renderTasks();
  renderProjects();
  renderComments();
}

function updateBadges() {
  document.getElementById('tasks-badge').textContent    = state.tasks.length;
  document.getElementById('projects-badge').textContent = state.projects.length;
  document.getElementById('comments-badge').textContent = state.comments.length;
}

function renderStats() {
  document.getElementById('stat-total').textContent    = state.tasks.length;
  document.getElementById('stat-progress').textContent = state.tasks.filter(t=>t.status==='P').length;
  document.getElementById('stat-done').textContent     = state.tasks.filter(t=>t.status==='D').length;
  document.getElementById('stat-projects').textContent = state.projects.length;
}

// ── KANBAN ──
function renderKanban() {
  const board = document.getElementById('kanban-board');
  const cols = [
    { key:'B', label:'Backlog',     color:'#6b6b80' },
    { key:'P', label:'In Progress', color:'#6c63ff' },
    { key:'D', label:'Done',        color:'#4ade80' },
  ];
  board.innerHTML = cols.map(col => {
    const tasks = state.tasks.filter(t => t.status === col.key);
    const proj = id => state.projects.find(p=>p.id===id);
    const cards = tasks.length === 0
      ? `<div class="empty-state"><div class="empty-icon">○</div><p>No tasks</p></div>`
      : tasks.map(t => `
        <div class="task-card" onclick="openTaskModal(${t.id})">
          <div class="task-card-title">${escHtml(t.title)}</div>
          <div class="task-card-meta">
            ${priorityTag(t.priority)}
            ${t.project && proj(t.project) ? `<span class="tag tag-project">${escHtml(proj(t.project).name)}</span>` : ''}
            ${t.due_date ? `<span class="task-due">${fmtDate(t.due_date)}</span>` : ''}
          </div>
        </div>`).join('');
    return `
      <div class="kanban-col">
        <div class="kanban-header">
          <div class="kanban-dot" style="background:${col.color}"></div>
          <div class="kanban-title">${col.label}</div>
          <div class="kanban-count">${tasks.length}</div>
        </div>
        <div class="kanban-body">${cards}</div>
      </div>`;
  }).join('');
}

// ── TASKS TABLE ──
function renderTasks() {
  const tbody = document.getElementById('tasks-tbody');
  if (!state.tasks.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">✓</div><p>No tasks yet. Create your first one!</p></div></td></tr>`;
    return;
  }
  const proj = id => state.projects.find(p=>p.id===id);
  tbody.innerHTML = state.tasks.map(t => `
    <tr>
      <td style="font-weight:500">${escHtml(t.title)}</td>
      <td>${t.project && proj(t.project) ? `<span class="tag tag-project">${escHtml(proj(t.project).name)}</span>` : '<span style="color:var(--muted)">—</span>'}</td>
      <td>${priorityTag(t.priority)}</td>
      <td>${statusTag(t.status)}</td>
      <td style="color:var(--muted);font-size:12px">${fmtDate(t.due_date)}</td>
      <td><div class="actions">
        <button class="btn btn-ghost btn-sm" onclick="openTaskModal(${t.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteTask(${t.id})">Delete</button>
      </div></td>
    </tr>`).join('');
}

// ── PROJECTS ──
function renderProjects() {
  const grid = document.getElementById('projects-grid');
  if (!state.projects.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">◫</div><p>No projects yet. Start one!</p></div>`;
    return;
  }
  grid.innerHTML = state.projects.map(p => `
    <div class="project-card">
      <div class="project-card-name">${escHtml(p.name)}</div>
      <div class="project-card-desc">${escHtml(p.description)}</div>
      <div class="project-card-footer">
        <span>📅 ${fmtDate(p.created_at)}</span>
        <div class="project-card-actions">
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openProjectModal(${p.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteProject(${p.id})">Delete</button>
        </div>
      </div>
    </div>`).join('');
}

// ── COMMENTS ──
function renderComments() {
  const list = document.getElementById('comments-list');
  if (!state.comments.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">◎</div><p>No comments yet.</p></div>`;
    return;
  }
  const taskTitle = id => { const t = state.tasks.find(t=>t.id===id); return t ? t.title : `Task #${id}`; };
  list.innerHTML = state.comments.map(c => `
    <div class="comment-item">
      <div class="comment-avatar">${(c.author?.email||'?')[0].toUpperCase()}</div>
      <div class="comment-body">
        <div class="comment-header">
          <span class="comment-author">${escHtml(c.author?.email||'Unknown')}</span>
          <span style="font-size:10px;color:var(--muted);background:var(--surface);padding:1px 7px;border-radius:6px">on: ${escHtml(taskTitle(c.task))}</span>
          <span class="comment-time">${fmtDate(c.created_at)}</span>
        </div>
        <div class="comment-text">${escHtml(c.content)}</div>
      </div>
      <div class="comment-actions">
        <button class="btn btn-ghost btn-sm" onclick="openCommentModal(${c.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteComment(${c.id})">Delete</button>
      </div>
    </div>`).join('');
}

// ── TASK MODAL ──
function openTaskModal(id=null) {
  editingId.task = id;
  const t = id ? state.tasks.find(t=>t.id===id) : null;
  const projectOptions = state.projects.map(p =>
    `<option value="${p.id}" ${t?.project===p.id?'selected':''}>${escHtml(p.name)}</option>`).join('');

  openModal(id ? 'Edit Task' : 'New Task', `
    <div class="field"><label>Title</label><input id="f-title" value="${escHtml(t?.title||'')}" placeholder="Task title"/></div>
    <div class="field"><label>Description</label><textarea id="f-desc" placeholder="Describe the task…">${escHtml(t?.description||'')}</textarea></div>
    <div class="field"><label>Project</label>
      <select id="f-project"><option value="">— No project —</option>${projectOptions}</select>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="field"><label>Priority</label>
        <select id="f-priority">
          <option value="L" ${t?.priority==='L'?'selected':''}>Low</option>
          <option value="M" ${t?.priority==='M'||!t?'selected':''}>Medium</option>
          <option value="H" ${t?.priority==='H'?'selected':''}>High</option>
          <option value="C" ${t?.priority==='C'?'selected':''}>Critical</option>
        </select>
      </div>
      <div class="field"><label>Status</label>
        <select id="f-status">
          <option value="B" ${t?.status==='B'?'selected':''}>Backlog</option>
          <option value="P" ${t?.status==='P'||!t?'selected':''}>In Progress</option>
          <option value="D" ${t?.status==='D'?'selected':''}>Done</option>
        </select>
      </div>
    </div>
    <div class="field"><label>Due Date</label>
      <input type="datetime-local" id="f-due" value="${t?.due_date ? t.due_date.slice(0,16) : ''}"/>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
      <button class="btn btn-primary" onclick="saveTask()">Save Task</button>
    </div>`);
}

async function saveTask() {
  const title = document.getElementById('f-title').value.trim();
  const description = document.getElementById('f-desc').value.trim();
  const project = document.getElementById('f-project').value || null;
  const priority = document.getElementById('f-priority').value;
  const status = document.getElementById('f-status').value;
  const due_date = document.getElementById('f-due').value || null;
  if (!title) return toast('Title is required', 'error');
  if (!description) return toast('Description is required', 'error');

  const body = { title, description, priority, status };
  if (project) body.project = parseInt(project);
  if (due_date) body.due_date = new Date(due_date).toISOString();

  const id = editingId.task;
  const res = await apiFetch(`${API}/api/tasks/${id ? id+'/' : ''}`, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(body)
  });
  if (!res.ok) { const d=await res.json(); return toast(JSON.stringify(d),'error'); }
  document.getElementById('modal-overlay').classList.remove('open');
  toast(id ? 'Task updated' : 'Task created');
  await loadAll();
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  const res = await apiFetch(`${API}/api/tasks/${id}/`, { method: 'DELETE' });
  if (res.ok || res.status===204) { toast('Task deleted'); await loadAll(); }
  else toast('Failed to delete task','error');
}

// ── PROJECT MODAL ──
function openProjectModal(id=null) {
  editingId.project = id;
  const p = id ? state.projects.find(p=>p.id===id) : null;
  openModal(id ? 'Edit Project' : 'New Project', `
    <div class="field"><label>Name</label><input id="fp-name" value="${escHtml(p?.name||'')}" placeholder="Project name" maxlength="50"/></div>
    <div class="field"><label>Description</label><textarea id="fp-desc" placeholder="What is this project about?">${escHtml(p?.description||'')}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
      <button class="btn btn-primary" onclick="saveProject()">Save Project</button>
    </div>`);
}

async function saveProject() {
  const name = document.getElementById('fp-name').value.trim();
  const description = document.getElementById('fp-desc').value.trim();
  if (!name) return toast('Name is required','error');
  if (!description) return toast('Description is required','error');
  const id = editingId.project;
  const res = await apiFetch(`${API}/api/projects/${id ? id+'/' : ''}`, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify({ name, description })
  });
  if (!res.ok) { const d=await res.json(); return toast(JSON.stringify(d),'error'); }
  document.getElementById('modal-overlay').classList.remove('open');
  toast(id ? 'Project updated' : 'Project created');
  await loadAll();
}

async function deleteProject(id) {
  if (!confirm('Delete this project? All related tasks will also be deleted.')) return;
  const res = await apiFetch(`${API}/api/projects/${id}/`, { method: 'DELETE' });
  if (res.ok || res.status===204) { toast('Project deleted'); await loadAll(); }
  else toast('Failed to delete project','error');
}

// ── COMMENT MODAL ──
function openCommentModal(id=null) {
  editingId.comment = id;
  const c = id ? state.comments.find(c=>c.id===id) : null;
  const taskOptions = state.tasks.map(t =>
    `<option value="${t.id}" ${c?.task===t.id?'selected':''}>${escHtml(t.title)}</option>`).join('');
  openModal(id ? 'Edit Comment' : 'New Comment', `
    <div class="field"><label>Task</label>
      <select id="fc-task"><option value="">— Select task —</option>${taskOptions}</select>
    </div>
    <div class="field"><label>Comment</label><textarea id="fc-content" placeholder="Write your comment…">${escHtml(c?.content||'')}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
      <button class="btn btn-primary" onclick="saveComment()">Save Comment</button>
    </div>`);
}

async function saveComment() {
  const task = document.getElementById('fc-task').value;
  const content = document.getElementById('fc-content').value.trim();
  if (!task) return toast('Please select a task','error');
  if (!content) return toast('Comment cannot be empty','error');
  const id = editingId.comment;
  const res = await apiFetch(`${API}/api/comments/${id ? id+'/' : ''}`, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify({ task: parseInt(task), content })
  });
  if (!res.ok) { const d=await res.json(); return toast(JSON.stringify(d),'error'); }
  document.getElementById('modal-overlay').classList.remove('open');
  toast(id ? 'Comment updated' : 'Comment added');
  await loadAll();
}

async function deleteComment(id) {
  if (!confirm('Delete this comment?')) return;
  const res = await apiFetch(`${API}/api/comments/${id}/`, { method: 'DELETE' });
  if (res.ok || res.status===204) { toast('Comment deleted'); await loadAll(); }
  else toast('Failed to delete comment','error');
}

// ── USER INFO ──
async function loadUserInfo() {
  // Decode JWT to get user info
  try {
    const tk = token();
    if (!tk) return;
    const payload = JSON.parse(atob(tk.split('.')[1]));
    // Try to get email from token
    const email = payload.email || payload.user_id || 'User';
    document.getElementById('user-name').textContent = email;
    document.getElementById('user-email').textContent = '';
    document.getElementById('user-avatar').textContent = String(email)[0].toUpperCase();
  } catch(e) { document.getElementById('user-name').textContent = 'User'; }
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── INIT ──
loadUserInfo();
loadAll();
