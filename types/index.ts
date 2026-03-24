export type Priority = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
export type Workload = 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'NONE'
export type Status = 'ACTIVE' | 'COMPLETED'

export interface Task {
  id: string
  title: string
  priority: Priority
  dueDate: string | null // ISO date YYYY-MM-DD
  workload: Workload
  note: string | null
  status: Status
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ParsedTask {
  title: string
  priority: Priority
  dueDate: string | null
  workload: Workload
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}
