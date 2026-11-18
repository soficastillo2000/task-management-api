import { useEffect, useMemo, useState, type FormEvent, type DragEvent } from 'react'
import { Activity, ArrowUpRight, Check, CheckCheck, Circle, ClipboardList, LayoutDashboard, ListTodo, LoaderCircle, Pencil, Plus, Search, Sparkles, Trash2, X } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import './App.css'

type TaskStatus = 'todo' | 'in_progress' | 'done'
type TaskPriority = 'low' | 'medium' | 'high'
type Task = {
  id: number
  title: string
  completed: boolean
  status: TaskStatus
  priority: TaskPriority
}
const kanbanColumns: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
]
type Filter = 'all' | 'active' | 'done'
const API_URL = import.meta.env.VITE_API_URL ?? ''

async function request(path: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!response.ok) throw new Error(`Request failed (${response.status})`)
  return response.status === 204 ? null : response.json()
}

export default function App() {
  const [taskView, setTaskView] = useState<'list' | 'board'>('list');

  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [section, setSection] = useState<'overview' | 'tasks'>('overview')

  async function loadTasks() {
    try {
      setError('')
      const data = await request('/tasks')
      if (!Array.isArray(data)) throw new Error('Invalid response')
      setTasks(data)
    } catch {
      setError('Could not load tasks. Check the API connection and try again.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadTasks() }, [])

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = title.trim()
    if (!value || saving) return
    setSaving(true)
    try {
      const created = await request('/tasks', { method: 'POST', body: JSON.stringify({ title: value }) })
      setTasks(previous => [...previous, created])
      setTitle('')
      setError('')
    } catch { setError('Could not create the task.') }
    finally { setSaving(false) }
  }

  async function changeTask(
    task: Task,
    changes: Partial<Pick<Task, 'status' | 'priority'>>
  ) {
    if (busyId !== null) return
    setBusyId(task.id)
    try {
      const updated = await request(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify(changes),
      })
      setTasks(previous =>
        previous.map(item => item.id === task.id ? updated : item)
      )
      setError('')
    } catch {
      setError('Could not update task. Please retry.')
    } finally {
      setBusyId(null)
    }
  }

  function dropTask(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault()
    const id = Number(event.dataTransfer.getData('text/plain'))
    const task = tasks.find(item => item.id === id)
    if (task && task.status !== status) {
      void changeTask(task, { status })
    }
  }

  async function toggleTask(task: Task) {
    if (busyId !== null) return
    setBusyId(task.id)
    try {
      const updated = await request(`/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ completed: !task.completed, status: task.completed ? 'todo' : 'done' }) })
      setTasks(previous => previous.map(item => item.id === task.id ? updated : item))
      setError('')
    } catch { setError('Could not update the task.') }
    finally { setBusyId(null) }
  }

  function openEdit(task: Task) { setEditing(task);
   setEditTitle(task.title) }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing || busyId !== null || !editTitle.trim()) return
    const task = editing
    if (editTitle.trim() === task.title) { setEditing(null); return }
    setBusyId(task.id)
    try {
      const updated = await request(`/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ title: editTitle.trim() }) })
      setTasks(previous => previous.map(item => item.id === task.id ? updated : item))
      setEditing(null)
      setError('')
    } catch { setError('Could not edit the task.') }
    finally { setBusyId(null) }
  }

  async function deleteTask(task: Task) {
    if (busyId !== null || !window.confirm(`Delete “${task.title}”?`)) return
    setBusyId(task.id)
    try {
      await request(`/tasks/${task.id}`, { method: 'DELETE' })
      setTasks(previous => previous.filter(item => item.id !== task.id))
      setError('')
    } catch { setError('Could not delete the task.') }
    finally { setBusyId(null) }
  }

  const completed = tasks.filter(task => task.completed).length
  const active = tasks.length - completed
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0
  const visible = useMemo(() => tasks.filter(task =>
    (filter === 'all' || (filter === 'done' ? task.completed : !task.completed)) &&
    task.title.toLowerCase().includes(search.toLowerCase().trim())
  ), [tasks, filter, search])
  const chartData = [{ name: 'Completed', value: completed }, { name: 'Remaining', value: active }]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><CheckCheck size={23} strokeWidth={2.6} /></div><span>taskflow<span className="brand-period">.</span><small>WORKSPACE</small></span></div>
        <div className="sidebar-caption">MAIN MENU</div>
        <nav aria-label="Main navigation">
          <button className={`nav-link ${section === 'overview' ? 'nav-selected' : ''}`} onClick={() => setSection('overview')}><LayoutDashboard size={18} /> Overview</button>
          <button className={`nav-link ${section === 'tasks' ? 'nav-selected' : ''}`} onClick={() => { setSection('tasks'); document.getElementById('task-section')?.scrollIntoView({ behavior: 'smooth' }) }}><ListTodo size={18} /> My tasks <span className="nav-count">{tasks.length}</span></button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-note"><Sparkles size={18}/><strong>Stay in your flow</strong><p>Small steps. Big progress. Keep building momentum.</p></div>
        <div className="sidebar-profile"><div className="profile-avatar">TF</div><div><strong>Demo workspace</strong><span>TaskFlow Pro</span></div><Circle size={10} fill="#46d6a2" color="#46d6a2" /></div>
      </aside>

      <div className="workspace">
        <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <strong>{section === 'overview' ? 'Overview' : 'My tasks'}</strong></div><div className="topbar-right"><span className="live-indicator"/> Live dashboard <span className="topbar-divider"/> <div className="top-avatar">TF</div></div></header>
        <main className="content">
          <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={13}/> YOUR PRODUCTIVITY HQ</div><h1>Make today <span>count.</span></h1><p>One workspace. Clear priorities. Real progress.</p></div><div className="today-pill"><Activity size={16}/> Focus mode</div></div>

          <div className="metric-grid">
            <div className="metric-card"><div className="metric-top"><span>Total tasks</span><span className="metric-icon purple-icon"><ClipboardList size={19}/></span></div><strong>{loading ? '—' : tasks.length}</strong><div className="metric-bottom">Everything in your workspace <ArrowUpRight size={15}/></div></div>
            <div className="metric-card"><div className="metric-top"><span>In progress</span><span className="metric-icon amber-icon"><Activity size={19}/></span></div><strong>{loading ? '—' : active}</strong><div className="metric-bottom">Keep the momentum going <ArrowUpRight size={15}/></div></div>
            <div className="metric-card"><div className="metric-top"><span>Completed</span><span className="metric-icon green-icon"><CheckCheck size={19}/></span></div><strong>{loading ? '—' : completed}</strong><div className="metric-bottom">Wins worth celebrating <ArrowUpRight size={15}/></div></div>
          </div>

          <div className="insights-grid">
            <section className="focus-card"><div className="focus-content"><span className="focus-tag"><Sparkles size={13}/> WEEKLY MOTIVATION</span><h2>Progress starts<br/>with one task.</h2><p>Every checkmark brings you closer to your goals. You've got this.</p><button onClick={() => document.getElementById('new-task')?.focus()}>Create a task <ArrowUpRight size={16}/></button></div><div className="focus-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-center"><Check size={43}/></div></div></section>
            <section className="chart-card"><div className="card-heading"><div><h2>Completion rate</h2><p>Your productivity snapshot</p></div><span className="chart-badge">All time</span></div><div className="chart-body"><div className="donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={tasks.length ? chartData : [{ name: 'No tasks', value: 1 }]} innerRadius={66} outerRadius={83} paddingAngle={tasks.length && active && completed ? 4 : 0} dataKey="value" stroke="none"><Cell fill={tasks.length ? '#9879ff' : '#292a42'}/>{tasks.length && <Cell fill="#34354e"/>}</Pie><Tooltip contentStyle={{ background: '#202137', border: '1px solid #383951', borderRadius: 12, color: '#fff' }} /></PieChart></ResponsiveContainer><div className="donut-label"><strong>{progress}%</strong><span>complete</span></div></div><div className="chart-legend"><div><span className="legend-dot legend-purple"/> Completed <strong>{completed}</strong></div><div><span className="legend-dot legend-gray"/> Remaining <strong>{active}</strong></div></div></div></section>
          </div>

          <section className="tasks-panel" id="task-section"><div className="panel-heading"><div><div className="eyebrow">YOUR WORKSPACE</div><h2>My tasks <span>{tasks.length}</span></h2><p>Stay organized and keep things moving.</p></div></div>
            <form className="create-form" onSubmit={addTask}><div className="create-plus"><Plus size={20}/></div><input id="new-task" aria-label="New task title" placeholder="What needs to get done?" maxLength={255} value={title} onChange={event => setTitle(event.target.value)}/><button type="submit" disabled={saving || !title.trim()}>{saving ? <LoaderCircle size={17} className="spin"/> : <Plus size={17}/>} Add task</button></form>
            <div className="kanban-view-toggle"><button type="button" onClick={() => setTaskView("list")} aria-pressed={taskView === "list"}>List</button><button type="button" onClick={() => setTaskView("board")} aria-pressed={taskView === "board"}>Board</button></div><div className="task-toolbar"><div className="filter-tabs">{([['all','All tasks'],['active','In progress'],['done','Completed']] as const).map(([value,label]) => <button key={value} className={filter === value ? 'tab active-tab' : 'tab'} onClick={() => setFilter(value)}>{label}</button>)}</div><label className="search-box"><Search size={17}/><input aria-label="Search tasks" placeholder="Search tasks..." value={search} onChange={event => setSearch(event.target.value)}/>{search && <button aria-label="Clear search" onClick={() => setSearch('')}><X size={14}/></button>}</label></div>
            {error && <div className="error-message" role="alert">{error} <button onClick={() => { setLoading(true); void loadTasks() }}>Retry</button></div>}
            {taskView === 'board' ? (
              <div className="kanban-board">
                {kanbanColumns.map(column => {
                  const items = visible.filter(task => task.status === column.status)
                  return (
                    <section
                      key={column.status}
                      className="kanban-column"
                      onDragOver={event => event.preventDefault()}
                      onDrop={event => dropTask(event, column.status)}
                    >
                      <div className="kanban-heading">
                        <h3>{column.label}</h3>
                        <span>{items.length}</span>
                      </div>
                      {loading ? (
                        <p className="kanban-empty">Loading tasks...</p>
                      ) : items.length === 0 ? (
                        <p className="kanban-empty">Drop a task here</p>
                      ) : items.map(task => (
                        <article
                          key={task.id}
                          className="kanban-card"
                          draggable={busyId === null}
                          onDragStart={event => {
                            event.dataTransfer.setData('text/plain', String(task.id))
                            event.dataTransfer.effectAllowed = 'move'
                          }}
                        >
                          <div className="kanban-card-top">
                            <span className={`kanban-priority priority-${task.priority}`}>
                              {task.priority}
                            </span>
                            <div>
                              <button aria-label={`Edit ${task.title}`} onClick={() => openEdit(task)}>
                                <Pencil size={15}/>
                              </button>
                              <button aria-label={`Delete ${task.title}`} onClick={() => void deleteTask(task)}>
                                <Trash2 size={15}/>
                              </button>
                            </div>
                          </div>
                          <strong>{task.title}</strong>
                          <div className="kanban-card-bottom">
                            <select
                              aria-label={`Status of ${task.title}`}
                              value={task.status}
                              disabled={busyId !== null}
                              onChange={event => void changeTask(task, {
                                status: event.target.value as TaskStatus
                              })}
                            >
                              {kanbanColumns.map(option => (
                                <option key={option.status} value={option.status}>{option.label}</option>
                              ))}
                            </select>
                            <select
                              aria-label={`Priority of ${task.title}`}
                              value={task.priority}
                              disabled={busyId !== null}
                              onChange={event => void changeTask(task, {
                                priority: event.target.value as TaskPriority
                              })}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                        </article>
                      ))}
                    </section>
                  )
                })}
              </div>
            ) : (
            <>{loading ? <div className="empty-state"><LoaderCircle className="spin" size={25}/><p>Loading your tasks...</p></div> : visible.length === 0 ? <div className="empty-state"><div className="empty-icon"><ClipboardList size={27}/></div><h3>{tasks.length ? 'No matching tasks' : 'A fresh start!'}</h3><p>{tasks.length ? 'Try a different search or filter.' : 'Add your first task and start making progress.'}</p></div> : <div className="task-list">{visible.map(task => <div className="task-row" key={task.id}><button disabled={busyId !== null} className={`task-toggle ${task.completed ? 'checked' : ''}`} onClick={() => void toggleTask(task)} aria-label={`${task.completed ? 'Mark incomplete' : 'Complete'} ${task.title}`}>{task.completed && <Check size={14} strokeWidth={3}/>}</button><span className={`task-title ${task.completed ? 'is-done' : ''}`}>{task.title}</span><span className={`task-status ${task.completed ? 'status-done' : 'status-active'}`}><span/>{task.completed ? 'Completed' : 'In progress'}</span><button disabled={busyId !== null} className="row-action" title="Edit task" aria-label={`Edit ${task.title}`} onClick={() => openEdit(task)}><Pencil size={16}/></button><button disabled={busyId !== null} className="row-action danger" title="Delete task" aria-label={`Delete ${task.title}`} onClick={() => void deleteTask(task)}><Trash2 size={16}/></button></div>)}</div>}
            </>)}
            <div className="task-footer"><span>Showing {visible.length} of {tasks.length} tasks</span><span>Powered by NestJS + PostgreSQL</span></div>
          </section>
          <footer className="page-footer">TaskFlow Pro <span>✦</span> Built with React, TypeScript, NestJS & PostgreSQL</footer>
        </main>
      </div>
      {editing && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && busyId === null) setEditing(null) }}><div className="edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-heading"><div className="modal-header"><div><div className="eyebrow">TASK DETAILS</div><h2 id="edit-heading">Edit task</h2></div><button aria-label="Close dialog" onClick={() => setEditing(null)} disabled={busyId !== null}><X size={19}/></button></div><form onSubmit={saveEdit}><label htmlFor="edit-title">Task name</label><input id="edit-title" autoFocus maxLength={255} value={editTitle} onChange={event => setEditTitle(event.target.value)}/><div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setEditing(null)} disabled={busyId !== null}>Cancel</button><button type="submit" className="save-button" disabled={!editTitle.trim() || busyId !== null}>{busyId !== null ? 'Saving...' : 'Save changes'}</button></div></form></div></div>}
    </div>
  )
}
