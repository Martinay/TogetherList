import { useTranslation } from 'react-i18next'
import { useState } from 'react'

interface ShareButtonProps {
    listId: string
}

function ShareButton({ listId }: ShareButtonProps) {
    const { t } = useTranslation()
    const [copied, setCopied] = useState(false)

    const shareUrl = `${window.location.origin}/list/${listId}`

    const handleShare = async () => {
        // Check if the native Share API is available
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'TogetherList',
                    text: t('share.message'),
                    url: shareUrl,
                })
                return
            } catch (err) {
                // User cancelled or share failed, fall through to clipboard
                if ((err as Error).name === 'AbortError') {
                    return
                }
            }
        }

        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy to clipboard:', err)
        }
    }

    return (
        <button
            className="share-button"
            onClick={handleShare}
            aria-label={t('share.button')}
        >
            <svg
                className="share-button__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span className="share-button__text">
                {copied ? t('share.copied') : t('share.button')}
            </span>
        </button>
    )
}

export default ShareButton
