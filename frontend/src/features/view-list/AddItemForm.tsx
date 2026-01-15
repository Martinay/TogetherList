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
        <form className="add-item-form" onSubmit={handleSubmit}>
            <input
                type="text"
                className="add-item-form__input"
                placeholder={t('list.addItem.placeholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isAdding}
            />
            <button
                type="submit"
                className="add-item-form__button"
                disabled={!title.trim() || isAdding}
            >
                {isAdding ? t('list.addItem.adding') : t('list.addItem.button')}
            </button>
        </form>
    )
}

export default AddItemForm
