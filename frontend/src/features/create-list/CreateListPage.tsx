import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { EnterNameStep, AddParticipantsStep } from './wizard-steps'
import { apiPost } from '../../api/client'

type WizardStep = 'name' | 'participants'

interface CreateListResponse {
    listId: string
}

function CreateListPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState<WizardStep>('name')
    const [creatorName, setCreatorName] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    const handleNameSubmit = (name: string) => {
        setCreatorName(name)
        setStep('participants')
    }

    const handleBack = () => {
        setStep('name')
    }

    const handleCreate = async (participants: string[]) => {
        setIsCreating(true)

        try {
            const data = await apiPost<CreateListResponse>('/list/create', {
                creator: creatorName,
                participants: participants,
            })

            // Store creator name in localStorage for this list
            localStorage.setItem(`list-${data.listId}-username`, creatorName)

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
                    {step === 'name' && (
                        <EnterNameStep key="name" onNext={handleNameSubmit} />
                    )}
                    {step === 'participants' && (
                        <AddParticipantsStep
                            key="participants"
                            creatorName={creatorName}
                            onBack={handleBack}
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
