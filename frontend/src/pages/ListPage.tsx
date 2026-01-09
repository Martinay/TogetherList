import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function ListPage() {
    const { id } = useParams<{ id: string }>()
    const { t } = useTranslation()

    return (
        <div className="list-page">
            <p>{t('list.placeholder')}</p>
            <code className="list-page__id">{id}</code>
        </div>
    )
}

export default ListPage
