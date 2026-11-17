import { useEffect, useState } from 'react'
import './App.css'

type Task = {
  id: number
  title: string
  completed: boolean
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function request(url: string, options?: RequestInit) {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    })
    if (!response.ok) throw new Error(`Request failed (${response.status})`)
    if (response.status === 204) return null
    return response.json()
  }

  async function loadTasks() {
    try {
      setError('')
      setTasks(await request('/tasks'))
    } catch {
      setError('Could not connect to the API. Make sure NestJS is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadTasks() }, [])

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = title.trim()
    if (!value || saving) return
    setSaving(true)
    try {
      const created = await request('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: value }),
      })
      setTasks(previous => [...previous, created])
      setTitle('')
      setError('')
    } catch {
      setError('Could not create the task.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleTask(task: Task) {
    try {
      const updated = await request(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !task.completed }),
      })
      setTasks(previous => previous.map(item => item.id === task.id ? updated : item))
      setError('')
    } catch {
      setError('Could not update the task.')
    }
  }

  async function editTask(task: Task) {
    const value = window.prompt('Edit task', task.title)?.trim()
    if (!value || value === task.title) return
    try {
      const updated = await request(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: value }),
      })
      setTasks(previous => previous.map(item => item.id === task.id ? updated : item))
      setError('')
    } catch {
      setError('Could not edit the task.')
    }
  }

  async function deleteTask(id: number) {
    try {
      await request(`/tasks/${id}`, { method: 'DELETE' })
      setTasks(previous => previous.filter(task => task.id !== id))
      setError('')
    } catch {
      setError('Could not delete the task.')
    }
  }

  const completed = tasks.filter(task => task.completed).length
  const active = tasks.length - completed
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0
  const visible = tasks.filter(task =>
    filter === 'all' || (filter === 'done' ? task.completed : !task.completed)
  )

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand"><span className="brand-icon">✓</span> taskflow<span className="brand-dot">.</span></div>
        <div className="nav-label">WORKSPACE</div>
        <div className="nav-item selected">▦ <span>Overview</span></div>
        <div className="nav-item">☑ <span>My tasks</span></div>
        <div className="sidebar-bottom">
          <div className="avatar">SC</div>
          <div><strong>My workspace</strong><small>Personal dashboard</small></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <span>Workspace <span className="breadcrumb">/ Overview</span></span>
          <span className="status"><span className="status-dot" /> Task Management</span>
        </header>

        <div className="content">
          <div className="heading">
            <div>
              <div className="eyebrow">YOUR PRODUCTIVITY SPACE</div>
              <h1>Make today count<span className="purple">.</span></h1>
              <p>Organize your tasks, stay focused, and keep moving forward.</p>
            </div>
            <div className="date-pill">✦ &nbsp; My dashboard</div>
          </div>

          <section className="stats">
            <div className="stat-card">
              <div className="stat-icon lavender">▦</div>
              <span>Total tasks</span>
              <strong>{tasks.length}</strong>
              <small>Everything on your list</small>
            </div>
            <div className="stat-card">
              <div className="stat-icon peach">◷</div>
              <span>In progress</span>
              <strong>{active}</strong>
              <small>Keep up the momentum</small>
            </div>
            <div className="stat-card">
              <div className="stat-icon mint">✓</div>
              <span>Completed</span>
              <strong>{completed}</strong>
              <small>Great work so far!</small>
            </div>
          </section>

          <section className="progress-card">
            <div className="progress-top">
              <div><strong>Your progress</strong><p>Every completed task is a step forward.</p></div>
              <strong className="progress-number">{progress}%</strong>
            </div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          </section>

          <section className="task-section">
            <div className="section-title"><div><h2>My tasks</h2><p>Keep track of what matters most.</p></div><span className="count">{tasks.length} tasks</span></div>

            <form className="add-form" onSubmit={addTask}>
              <span className="plus">＋</span>
              <input value={title} onChange={event => setTitle(event.target.value)} maxLength={255} placeholder="What do you need to get done?" aria-label="New task title" />
              <button type="submit" disabled={saving || !title.trim()}>{saving ? 'Adding...' : '+ Add task'}</button>
            </form>

            <div className="filters">
              {(['all', 'active', 'done'] as const).map(option => (
                <button key={option} className={filter === option ? 'filter active-filter' : 'filter'} onClick={() => setFilter(option)}>
                  {option === 'all' ? 'All tasks' : option === 'active' ? 'In progress' : 'Completed'}
                </button>
              ))}
            </div>

            {error && <div className="error" role="alert">{error}</div>}
            {loading ? <div className="empty">Loading tasks...</div> :
              visible.length === 0 ? <div className="empty">✦<h3>All clear!</h3><p>No tasks in this view yet.</p></div> :
              <div className="task-list">
                {visible.map(task => (
                  <div className="task-row" key={task.id}>
                    <input className="task-check" type="checkbox" checked={task.completed} onChange={() => void toggleTask(task)} aria-label={`Complete ${task.title}`} />
                    <span className={task.completed ? 'task-name finished' : 'task-name'}>{task.title}</span>
                    <span className={task.completed ? 'task-badge done' : 'task-badge pending'}>{task.completed ? 'Completed' : 'In progress'}</span>
                    <button className="icon-button" onClick={() => void editTask(task)} aria-label={`Edit ${task.title}`} title="Edit">✎</button>
                    <button className="icon-button delete" onClick={() => void deleteTask(task.id)} aria-label={`Delete ${task.title}`} title="Delete">×</button>
                  </div>
                ))}
              </div>
            }
          </section>
          <footer>Built with React, TypeScript, NestJS & PostgreSQL <span>✦</span></footer>
        </div>
      </main>
    </div>
  )
}
