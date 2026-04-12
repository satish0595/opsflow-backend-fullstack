import { useEffect, useMemo, useState } from 'react'
import api from './api'

const initialOrder = {
  customer: '',
  title: '',
  description: '',
  amount: '',
  status: 'PENDING',
}

const initialCustomer = {
  name: '',
  email: '',
}

export default function App() {
  const [stats, setStats] = useState(null)
  const [customers, setCustomers] = useState([])
  const [orders, setOrders] = useState([])
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState(initialOrder)
  const [customerForm, setCustomerForm] = useState(initialCustomer)
  const [loading, setLoading] = useState(false)
  const [customerLoading, setCustomerLoading] = useState(false)
  const [taskMessage, setTaskMessage] = useState('')
  const [customerMessage, setCustomerMessage] = useState('')

  const activeTask = useMemo(
    () => tasks.find((task) => task.status !== 'SUCCESS' && task.status !== 'FAILURE'),
    [tasks]
  )

  const loadAll = async () => {
    const [statsRes, customersRes, ordersRes, tasksRes] = await Promise.all([
      api.get('/dashboard/stats/'),
      api.get('/customers/'),
      api.get('/orders/'),
      api.get('/reports/tasks/'),
    ])

    const customersData = customersRes.data.results || customersRes.data
    const ordersData = ordersRes.data.results || ordersRes.data

    setStats(statsRes.data)
    setCustomers(customersData)
    setOrders(ordersData)
    setTasks(tasksRes.data)
  }

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    if (!activeTask) return

    const interval = setInterval(async () => {
      const response = await api.get(`/reports/tasks/${activeTask.id}/`)
      setTasks((prev) =>
        prev.map((task) => (task.id === activeTask.id ? response.data : task))
      )
    }, 1500)

    return () => clearInterval(interval)
  }, [activeTask])

  const createCustomer = async (event) => {
    event.preventDefault()
    setCustomerLoading(true)
    setCustomerMessage('')

    try {
      const response = await api.post('/customers/', customerForm)
      const createdCustomer = response.data

      setCustomerForm(initialCustomer)
      setCustomerMessage('Customer created successfully.')

      await loadAll()

      if (createdCustomer?.id) {
        setForm((prev) => ({
          ...prev,
          customer: createdCustomer.id,
        }))
      }
    } catch (error) {
      console.error('Failed to create customer:', error)
      setCustomerMessage('Failed to create customer. Check backend validation.')
    } finally {
      setCustomerLoading(false)
    }
  }

  const createOrder = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      await api.post('/orders/', {
        ...form,
        customer: Number(form.customer),
        amount: Number(form.amount),
      })
      setForm(initialOrder)
      await loadAll()
    } catch (error) {
      console.error('Failed to create order:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerReport = async () => {
    const response = await api.post('/reports/generate/')
    setTaskMessage('Background report started. Celery worker is processing it.')
    setTasks((prev) => [response.data, ...prev])
  }

  return (
    <div className="page">
      <header>
        <h1>OpsFlow</h1>
        <p>Backend-heavy demo: Django + DRF + PostgreSQL + Redis + Celery + React</p>
      </header>

      <section className="grid stats-grid">
        <Card
          title="Customers"
          value={stats?.total_customers ?? '-'}
          subtitle={stats ? `Cached: ${stats.cached ? 'Yes' : 'No'}` : ''}
        />
        <Card title="Orders" value={stats?.total_orders ?? '-'} />
        <Card title="Revenue" value={stats ? `€${stats.total_revenue}` : '-'} />
        <Card
          title="Order Statuses"
          value={
            stats
              ? Object.entries(stats.orders_per_status || {})
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(' | ')
              : '-'
          }
        />
      </section>

      <section className="grid two-col">
        <div className="panel">
          <h2>Create customer</h2>
          <form onSubmit={createCustomer} className="form">
            <input
              placeholder="Customer name"
              value={customerForm.name}
              onChange={(e) =>
                setCustomerForm({ ...customerForm, name: e.target.value })
              }
              required
            />
            <input
              placeholder="Customer email"
              type="email"
              value={customerForm.email}
              onChange={(e) =>
                setCustomerForm({ ...customerForm, email: e.target.value })
              }
              required
            />
            <button disabled={customerLoading}>
              {customerLoading ? 'Saving...' : 'Create Customer'}
            </button>
          </form>
          {customerMessage && <p className="muted">{customerMessage}</p>}
        </div>

        <div className="panel">
          <h2>Create order</h2>
          <form onSubmit={createOrder} className="form">
            <select
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
              required
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>

            {customers.length === 0 && (
              <p className="muted">No customers yet. Create a customer first.</p>
            )}

            <input
              placeholder="Order title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <input
              placeholder="Amount"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="FAILED">FAILED</option>
            </select>
            <button disabled={loading || customers.length === 0}>
              {loading ? 'Saving...' : 'Create Order'}
            </button>
          </form>
        </div>
      </section>

      <section className="grid two-col">
        <div className="panel">
          <h2>Generate async report</h2>
          <p>
            This is the key backend concept demo. The API returns quickly, while
            Celery finishes heavy work in the background.
          </p>
          <button onClick={triggerReport}>Run Report Job</button>
          {taskMessage && <p className="muted">{taskMessage}</p>}
          {tasks[0] && (
            <div className="task-box">
              <p><strong>Latest task status:</strong> {tasks[0].status}</p>
              <p><strong>Progress:</strong> {tasks[0].progress}%</p>
              {tasks[0].summary && <pre>{tasks[0].summary}</pre>}
            </div>
          )}
        </div>

        <div className="panel">
          <h2>Customers</h2>
          {customers.length === 0 ? (
            <p className="muted">No customers available.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.id}</td>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="panel">
        <h2>Orders</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.title}</td>
                <td>{order.customer_name}</td>
                <td>€{order.amount}</td>
                <td>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function Card({ title, value, subtitle }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p className="value">{value}</p>
      {subtitle ? <p className="muted">{subtitle}</p> : null}
    </div>
  )
}