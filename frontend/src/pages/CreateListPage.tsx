import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'

function CreateListPage() {
    const navigate = useNavigate()

    useEffect(() => {
        // Generate UUID and redirect immediately
        const listId = uuidv4()
        navigate(`/list/${listId}`, { replace: true })
    }, [navigate])

    return null // Or a loading spinner if preferred
}

export default CreateListPage
