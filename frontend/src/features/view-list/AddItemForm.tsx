import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

interface AddItemFormProps {
    listId: string
    onItemAdded: () => void
}

function AddItemForm({ listId, onItemAdded }: AddItemFormProps) {
    const { t } = useTranslation()
    const [title, setTitle] = useState('')
    const [isAdding, setIsAdding] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()

        const trimmedTitle = title.trim()
        if (!trimmedTitle || isAdding) return

        setIsAdding(true)
        try {
            const response = await fetch(`http://localhost:8080/api/v1/list/${listId}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: trimmedTitle }),
            })

            if (response.ok) {
                setTitle('')
                onItemAdded()
            }
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
