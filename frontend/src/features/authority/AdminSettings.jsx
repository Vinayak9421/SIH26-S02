import { useState } from 'react'
import { AuthorityLayout } from '../../components/layout'
import { StatusBadge } from '../../components/ui'

const departments = [
  { id: 1, name: 'Waste Management', key: 'waste',    desc: 'Handles garbage collection and disposal', active: true,  admins: 3 },
  { id: 2, name: 'Roads & Infrastructure', key: 'roads', desc: 'Road maintenance and construction',    active: true,  admins: 2 },
  { id: 3, name: 'Water Supply',    key: 'water',   desc: 'Water distribution and plumbing issues', active: true,  admins: 2 },
  { id: 4, name: 'Electricity',     key: 'elec',    desc: 'Power supply and street lighting',       active: true,  admins: 1 },
  { id: 5, name: 'Drainage',        key: 'drain',   desc: 'Stormwater and sewage management',       active: false, admins: 1 },
]

const users = [
  { id: 1, name: 'Admin User',    email: 'admin@civic.in',    role: 'Super Admin',      dept: '–',                status: 'Active',   created: 'Sep 01, 2026' },
  { id: 2, name: 'Rohan Gupta',   email: 'rohan@civic.in',    role: 'Department Admin', dept: 'Waste Management', status: 'Active',   created: 'Sep 02, 2026' },
  { id: 3, name: 'Priya Sharma',  email: 'priya@civic.in',    role: 'Department Admin', dept: 'Roads',            status: 'Active',   created: 'Sep 03, 2026' },
  { id: 4, name: 'Arjun Mehta',   email: 'arjun@civic.in',    role: 'Citizen',          dept: '–',                status: 'Active',   created: 'Sep 04, 2026' },
  { id: 5, name: 'Sita Devi',     email: 'sita@civic.in',     role: 'Citizen',          dept: '–',                status: 'Active',   created: 'Sep 05, 2026' },
  { id: 6, name: 'Vijay Kumar',   email: 'vijay@civic.in',    role: 'Department Admin', dept: 'Water Supply',     status: 'Suspended',created: 'Aug 20, 2026' },
]

const roleBadge = {
  'Super Admin':      'bg-purple-50 text-purple-700 border-purple-200',
  'Department Admin': 'bg-blue-50 text-blue-700 border-blue-200',
  'Citizen':          'bg-gray-100 text-gray-600 border-gray-200',
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('departments')
  const [depts, setDepts] = useState(departments)
  const [userSearch, setUserSearch] = useState('')

  const toggleActive = (id) => {
    setDepts(prev => prev.map(d => d.id === id ? { ...d, active: !d.active } : d))
  }

  const filteredUsers = users.filter(u =>
    !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  return (
    <AuthorityLayout>
      <div className="space-y-lg max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-headline-lg text-on-surface font-semibold">Admin Settings</h1>
            <p className="text-body-md text-on-surface-variant mt-xs">Manage departments and user access control</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant/30 gap-sm">
          {['departments', 'users'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-sm px-sm text-label-md font-semibold border-b-2 transition-all capitalize ${activeTab === tab ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Departments Tab */}
        {activeTab === 'departments' && (
          <div className="space-y-md">
            <div className="flex justify-end">
              <button className="bg-primary-container text-on-primary text-label-md font-semibold px-md py-sm rounded-md hover:shadow-md transition-all flex items-center gap-sm">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                + Add Department
              </button>
            </div>
            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Department Name</th>
                    <th className="hidden md:table-cell">Category Key</th>
                    <th className="hidden lg:table-cell">Description</th>
                    <th>Active</th>
                    <th className="hidden md:table-cell">Admins</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {depts.map(dept => (
                    <tr key={dept.id}>
                      <td>
                        <span className="font-medium text-on-surface">{dept.name}</span>
                      </td>
                      <td className="hidden md:table-cell">
                        <code className="bg-surface-container px-sm py-[1px] rounded text-body-sm text-on-surface-variant">{dept.key}</code>
                      </td>
                      <td className="hidden lg:table-cell text-on-surface-variant max-w-[200px] truncate">{dept.desc}</td>
                      <td>
                        {/* Toggle */}
                        <button
                          onClick={() => toggleActive(dept.id)}
                          className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${dept.active ? 'bg-primary-container' : 'bg-outline-variant'}`}
                        >
                          <span className={`absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${dept.active ? 'left-[22px]' : 'left-[2px]'}`} />
                        </button>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="bg-surface-container text-on-surface text-label-md font-semibold px-sm py-[2px] rounded-full">{dept.admins}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-sm">
                          <button className="p-[4px] text-primary-container hover:bg-primary-container/10 rounded transition-colors" title="Edit">
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                          </button>
                          <button className="p-[4px] text-error hover:bg-error/10 rounded transition-colors" title="Delete">
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-md">
            <div className="flex flex-wrap items-center justify-between gap-sm">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <span className="absolute left-sm top-1/2 -translate-y-1/2 material-symbols-outlined text-outline" style={{ fontSize: '18px' }}>search</span>
                <input type="text" placeholder="Search users..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-[36px] pr-md py-[7px] border border-outline-variant rounded-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
              <button className="bg-primary-container text-on-primary text-label-md font-semibold px-md py-sm rounded-md hover:shadow-md transition-all flex items-center gap-sm">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
                + Invite Admin
              </button>
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th className="hidden md:table-cell">Department</th>
                    <th>Status</th>
                    <th className="hidden lg:table-cell">Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-sm">
                          <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container font-semibold text-body-sm shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-body-md text-on-surface font-medium">{user.name}</p>
                            <p className="text-body-sm text-on-surface-variant">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-sm py-[2px] rounded-full text-label-md font-semibold border ${roleBadge[user.role]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="hidden md:table-cell text-on-surface-variant">{user.dept}</td>
                      <td><StatusBadge status={user.status} /></td>
                      <td className="hidden lg:table-cell text-on-surface-variant">{user.created}</td>
                      <td>
                        <div className="flex items-center gap-xs">
                          <button className="text-primary-container text-label-md font-semibold hover:underline whitespace-nowrap">Change Role</button>
                          <span className="text-outline">·</span>
                          <button className={`text-label-md font-semibold hover:underline whitespace-nowrap ${user.status === 'Active' ? 'text-error' : 'text-green-700'}`}>
                            {user.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AuthorityLayout>
  )
}
