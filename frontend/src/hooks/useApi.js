import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

// ─── Analytics ───────────────────────────────────────────────────────────────
export function useAnalyticsSummary(departmentKey = null) {
  return useQuery({
    queryKey: ['analytics', 'summary', departmentKey],
    queryFn: () =>
      api.get('/analytics/summary', { params: departmentKey ? { category: departmentKey } : {} })
        .then(r => r.data),
    staleTime: 30_000,
  })
}

// ─── Departments ──────────────────────────────────────────────────────────────
export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then(r => r.data),
    staleTime: 5 * 60_000,
  })
}

// ─── Issues ───────────────────────────────────────────────────────────────────
export function useIssues({ priority, status, category, skip = 0, limit = 50 } = {}) {
  return useQuery({
    queryKey: ['issues', { priority, status, category, skip, limit }],
    queryFn: () => {
      const params = {}
      if (priority && priority !== 'All') params.priority = priority.toLowerCase()
      if (status && status !== 'All') params.status = status.toLowerCase().replace(' ', '_')
      if (category && category !== 'All') params.category = category
      params.skip = skip
      params.limit = limit
      return api.get('/issues', { params }).then(r => r.data)
    },
    staleTime: 15_000,
  })
}

export function useIssueDetail(id) {
  return useQuery({
    queryKey: ['issue', id],
    queryFn: () => api.get(`/issues/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useUpdateIssue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.patch(`/issues/${id}`, payload).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['issue', id] })
      qc.invalidateQueries({ queryKey: ['issues'] })
    },
  })
}

export function useResolveIssue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }) =>
      api.post(`/issues/${id}/resolve`, null, { params: note ? { note } : {} }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issues'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

// ─── Complaints ───────────────────────────────────────────────────────────────
export function useMyComplaints() {
  return useQuery({
    queryKey: ['complaints', 'mine'],
    queryFn: () => api.get('/complaints/mine').then(r => r.data),
    staleTime: 15_000,
  })
}

export function useComplaints({ category, status, priority, skip = 0, limit = 50 } = {}) {
  return useQuery({
    queryKey: ['complaints', { category, status, priority, skip, limit }],
    queryFn: () => {
      const params = {}
      if (category && category !== 'All') params.category = category
      if (status && status !== 'All') params.status = status.toLowerCase().replace(' ', '_')
      if (priority && priority !== 'All') params.priority = priority.toLowerCase()
      params.skip = skip
      params.limit = limit
      return api.get('/complaints', { params }).then(r => r.data)
    },
    staleTime: 15_000,
  })
}

export function useComplaintDetail(id) {
  return useQuery({
    queryKey: ['complaint', id],
    queryFn: () => api.get(`/complaints/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useSubmitComplaint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post('/complaints', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complaints'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useUpdateComplaintStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, note }) =>
      api.patch(`/complaints/${id}/status`, { status, note }).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['complaint', id] })
      qc.invalidateQueries({ queryKey: ['complaints'] })
    },
  })
}

export function useRateComplaint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, rating, feedback }) =>
      api.post(`/complaints/${id}/rate`, { rating, feedback }).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['complaint', id] })
      qc.invalidateQueries({ queryKey: ['complaints', 'mine'] })
    },
  })
}

// ─── Map ──────────────────────────────────────────────────────────────────────
export function useNearbyIssues(category = null) {
  return useQuery({
    queryKey: ['map', 'nearby', category],
    queryFn: () =>
      api.get('/map/nearby', { params: category ? { category } : {} })
        .then(r => r.data),
    staleTime: 30_000,
  })
}

export function useMapIssues(departmentKey = null) {
  return useQuery({
    queryKey: ['map', 'issues', departmentKey],
    queryFn: () =>
      api.get('/map/issues', { params: departmentKey ? { category: departmentKey } : {} })
        .then(r => r.data),
    staleTime: 30_000,
  })
}

export function useMapHotspots(departmentKey = null) {
  return useQuery({
    queryKey: ['map', 'hotspots', departmentKey],
    queryFn: () =>
      api.get('/map/hotspots', { params: departmentKey ? { category: departmentKey } : {} })
        .then(r => r.data),
    staleTime: 30_000,
  })
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }) =>
      api.post('/auth/login', { email, password }).then(r => r.data),
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload) => api.post('/auth/register', payload).then(r => r.data),
  })
}

export function useDemoUsers() {
  return useQuery({
    queryKey: ['demo-users'],
    queryFn: () => api.get('/auth/demo-users').then(r => r.data),
    staleTime: Infinity,
  })
}
