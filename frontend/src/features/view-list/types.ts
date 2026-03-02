export interface Item {
    id: string
    title: string
    completed: boolean
    completed_by?: string
    completed_at?: string
    assigned_to?: string
    created_by: string
    created_at: string
}

export interface ListState {
    name: string
    participants: string[]
    items: Record<string, Item>
}
