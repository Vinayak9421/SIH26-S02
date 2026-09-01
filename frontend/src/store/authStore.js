import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      role: null,
      name: null,
      email: null,
      departmentKey: null,
      departmentId: null,

      login: (data) => set({
        token: data.access_token,
        role: data.role,
        name: data.name,
        email: data.email,
        departmentKey: data.department_key || null,
        departmentId: data.department_id || null,
      }),

      logout: () => set({
        token: null,
        role: null,
        name: null,
        email: null,
        departmentKey: null,
        departmentId: null,
      }),

      isAuthenticated: () => !!get().token,
      isSuperAdmin: () => get().role === 'super_admin',
      isDeptAdmin: () => get().role === 'department_admin',
      isCitizen: () => get().role === 'citizen',
    }),
    {
      name: 'civic-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
