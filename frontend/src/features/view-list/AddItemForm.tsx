import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { addItem } from './api'

interface AddItemFormProps {
    listId: string
    createdBy: string
    onItemAdded: () => void
}

function AddItemForm({ listId, createdBy, onItemAdded }: AddItemFormProps) {
    const { t } = useTranslation()
    const [title, setTitle] = useState('')
    const [isAdding, setIsAdding] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()

        const trimmedTitle = title.trim()
        if (!trimmedTitle || isAdding) return

        setIsAdding(true)
        try {
            await addItem(listId, trimmedTitle, createdBy)
            setTitle('')
            onItemAdded()
        } catch (error) {
            console.error('Failed to add item:', error)
        } finally {
            setIsAdding(false)
        }
    }

    return (
        <form className="flex gap-2 mb-6" onSubmit={handleSubmit}>
            <input
                type="text"
                className="flex-1 p-4 text-base font-[inherit] bg-bg-card border border-border-medium rounded-xl text-text-primary outline-none transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.05)] placeholder:text-stone-400 focus:border-accent-primary focus:shadow-[0_0_0_3px_var(--color-accent-glow)]"
                placeholder={t('list.addItem.placeholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isAdding}
            />
            <button
                type="submit"
                className="px-6 py-4 text-base font-semibold text-white bg-gradient-to-br from-accent-primary to-accent-secondary rounded-xl cursor-pointer transition-all duration-250 shadow-[0_4px_12px_var(--color-accent-glow)] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_6px_16px_var(--color-accent-glow)]"
                disabled={!title.trim() || isAdding}
            >
                {isAdding ? t('list.addItem.adding') : t('list.addItem.button')}
            </button>
        </form>
    )
}

export default AddItemForm
