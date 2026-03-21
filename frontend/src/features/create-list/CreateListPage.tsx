import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { EnterNameStep, AddParticipantsStep } from './wizard-steps'
import { apiPost } from '../../api/client'

type WizardStep = 'listName' | 'creatorName' | 'participants'

interface CreateListResponse {
    listId: string
}

function CreateListPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState<WizardStep>('listName')
    const [listName, setListName] = useState('')
    const [creatorName, setCreatorName] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    const handleListNameSubmit = (name: string) => {
        setListName(name)
        setStep('creatorName')
    }

    const handleCreatorNameSubmit = (name: string) => {
        setCreatorName(name)
        setStep('participants')
    }

    const handleBackToCreator = () => {
        setStep('creatorName')
    }

    const handleCreate = async (participants: string[]) => {
        setIsCreating(true)

        try {
            const data = await apiPost<CreateListResponse>('/list/create', {
                name: listName,
                creator: creatorName,
                participants: participants,
            })

            // Store creator name in localStorage for this list
            localStorage.setItem(`list:${data.listId}:username`, creatorName)

            navigate(`/list/${data.listId}`, { replace: true })
        } catch (error) {
            console.error('Error creating list:', error)
            setIsCreating(false)
        }
    }

    return (
        <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Radial glow background */}
            <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,var(--color-accent-glow)_0%,transparent_50%)] opacity-60 animate-pulse" />

            <div className="relative z-10 w-full max-w-[400px]">
                <AnimatePresence mode="wait">
                    {step === 'listName' && (
                        <EnterNameStep
                            key="listName"
                            onNext={handleListNameSubmit}
                            titleKey="createList.step0Title"
                            placeholderKey="createList.step0Placeholder"
                            nextKey="createList.step0Next"
                        />
                    )}
                    {step === 'creatorName' && (
                        <EnterNameStep key="creatorName" onNext={handleCreatorNameSubmit} />
                    )}
                    {step === 'participants' && (
                        <AddParticipantsStep
                            key="participants"
                            creatorName={creatorName}
                            onBack={handleBackToCreator}
                            onCreate={handleCreate}
                            isCreating={isCreating}
                        />
                    )}
                </AnimatePresence>
            </div>
        </main>
    )
}

export default CreateListPage
