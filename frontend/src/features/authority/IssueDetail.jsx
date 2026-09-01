import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthorityLayout } from '../../components/layout'
import { PriorityBadge, StatusBadge, CategoryBadge, AiTag } from '../../components/ui'

const issueData = {
  id: 'ISS-441',
  title: 'Missed Garbage Collection Ward 12',
  category: 'Sanitation',
  priority: 'Critical',
  status: 'Open',
  department: 'Waste Management',
  location: 'Ward 12, Delhi - 110001',
  aiConf: 96,
  aiReasoning: ['12+ linked complaints in same area', 'Reported health risk keywords detected', '3+ days with no resolution', 'High density residential zone', 'Previous similar issue resolved by Waste Mgmt'],
  linkedComplaints: [
    { id: '#CID-8821', citizen: 'Arjun Mehta', date: 'Oct 24', desc: 'Ward 12 mein school ke paas teen din se kachra nahi uthaya gaya' },
    { id: '#CID-8834', citizen: 'Priya Sharma', date: 'Oct 24', desc: 'Garbage overflowing in our lane for 3 days' },
    { id: '#CID-8851', citizen: 'Mohammed Ali', date: 'Oct 25', desc: 'Strong smell from garbage bin near park entrance' },
    { id: '#CID-8860', citizen: 'Sita Devi', date: 'Oct 25', desc: 'Stray dogs attracting due to uncollected garbage' },
  ],
  activityLog: [
    { type: 'ai', text: 'Complaint #CID-8821 auto-linked by AI (conf: 96%)', time: 'Oct 24, 09:12' },
    { type: 'ai', text: 'Priority escalated to Critical: health risk detected', time: 'Oct 24, 09:15' },
    { type: 'system', text: 'Routed to Waste Management Department', time: 'Oct 24, 09:15' },
    { type: 'human', text: 'Department Admin acknowledged issue', time: 'Oct 25, 11:30' },
    { type: 'ai', text: '3 more complaints auto-linked overnight', time: 'Oct 25, 08:00' },
  ]
}

export default function IssueDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const issue = issueData
  const [status, setStatus] = useState(issue.status)
  const [note, setNote] = useState('')

  return (
    <AuthorityLayout>
      <div className="space-y-lg max-w-5xl">
        {/* Back + Title */}
        <div>
          <button onClick={() => navigate('/authority/issues')} className="flex items-center gap-xs text-body-md text-on-surface-variant hover:text-on-surface mb-sm transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Back to Issue Queue
          </button>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-md">
            <div>
              <div className="flex items-center gap-sm mb-xs">
                <span className="font-mono text-label-md text-on-surface-variant font-semibold">{issue.id}</span>
                <PriorityBadge priority={issue.priority} />
              </div>
              <h1 className="text-headline-lg text-on-surface font-semibold">{issue.title}</h1>
              <div className="flex flex-wrap gap-sm mt-sm">
                <CategoryBadge category={issue.category} />
                <AiTag label={`${issue.department}`} confidence={issue.aiConf} />
                <span className="text-body-sm text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>location_on</span>
                  {issue.location}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-sm shrink-0">
              <StatusBadge status={status} />
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="border border-primary-container text-primary-container rounded-md px-sm py-[6px] text-label-md font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-primary-container"
              >
                <option>Open</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2-column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
          {/* Left col */}
          <div className="lg:col-span-2 space-y-md">
            {/* AI Analysis */}
            <div className="glass-card rounded-xl p-md space-y-sm">
              <h2 className="text-headline-md text-on-surface font-semibold flex items-center gap-sm">
                <span className="material-symbols-outlined text-[#7c4dff]" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                AI Analysis
              </h2>
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-sm">
                <div className="flex items-center justify-between mb-sm">
                  <span className="text-body-md text-on-surface font-semibold">Recommended Department</span>
                  <span className="text-headline-md text-[#7c4dff] font-bold">{issue.aiConf}%</span>
                </div>
                <p className="text-body-lg text-on-surface font-bold">{issue.department}</p>
              </div>
              <div>
                <p className="text-label-md text-on-surface-variant font-semibold mb-sm">Why this classification?</p>
                <ul className="space-y-[6px]">
                  {issue.aiReasoning.map(r => (
                    <li key={r} className="flex items-start gap-sm text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-[#7c4dff] shrink-0 mt-[1px]" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Linked Complaints */}
            <div className="glass-card rounded-xl p-md space-y-sm">
              <h2 className="text-headline-md text-on-surface font-semibold">
                Linked Complaints
                <span className="ml-sm bg-primary/10 text-primary text-label-md font-bold px-sm py-[2px] rounded-full">{issue.linkedComplaints.length}</span>
              </h2>
              <div className="space-y-sm">
                {issue.linkedComplaints.map(c => (
                  <div key={c.id} className="flex items-start gap-sm p-sm bg-surface-container-low rounded-lg border border-outline-variant/20">
                    <span className="font-mono text-label-md text-primary-container font-semibold shrink-0">{c.id}</span>
                    <div className="flex-1">
                      <p className="text-body-sm text-on-surface-variant">{c.citizen} · {c.date}</p>
                      <p className="text-body-md text-on-surface italic">"{c.desc}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add note */}
            <div className="glass-card rounded-xl p-md space-y-sm">
              <h2 className="text-headline-md text-on-surface font-semibold">Add Internal Note</h2>
              <textarea
                rows={3}
                placeholder="Add an internal update or action note..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full rounded-md border border-outline-variant bg-white px-md py-sm text-body-md text-on-surface resize-none focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 placeholder:text-outline"
              />
              <button className="bg-primary-container text-on-primary text-label-md font-semibold px-md py-sm rounded-md hover:shadow-md transition-all">
                Post Note
              </button>
            </div>
          </div>

          {/* Right col */}
          <div className="space-y-md">
            {/* Mini Map */}
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 h-40 flex items-center justify-center relative">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, #93c5fd 0, #93c5fd 1px, transparent 0, transparent 30px), repeating-linear-gradient(90deg, #93c5fd 0, #93c5fd 1px, transparent 0, transparent 30px)',
                  backgroundSize: '30px 30px'
                }} />
                <div className="z-10 text-center">
                  <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '40px', fontVariationSettings: "'FILL' 1" }}>location_on</span>
                  <p className="text-body-sm text-primary font-medium">Ward 12, Delhi</p>
                </div>
              </div>
              <div className="px-md py-sm text-body-sm text-on-surface-variant">{issue.location}</div>
            </div>

            {/* Activity Log */}
            <div className="glass-card rounded-xl p-md">
              <h3 className="text-headline-md text-on-surface font-semibold mb-md">Activity Log</h3>
              <div className="space-y-sm">
                {issue.activityLog.map((log, i) => (
                  <div key={i} className="flex items-start gap-sm border-b border-outline-variant/20 pb-sm last:border-0">
                    <span className={`material-symbols-outlined shrink-0 mt-[1px] ${log.type === 'ai' ? 'text-[#7c4dff]' : log.type === 'human' ? 'text-primary-container' : 'text-on-surface-variant'}`}
                      style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>
                      {log.type === 'ai' ? 'auto_awesome' : log.type === 'human' ? 'person' : 'settings'}
                    </span>
                    <div>
                      <p className="text-body-sm text-on-surface">{log.text}</p>
                      <p className="text-body-sm text-on-surface-variant">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthorityLayout>
  )
}
