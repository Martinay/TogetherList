import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { EnterNameStep, AddParticipantsStep } from './wizard-steps'

type WizardStep = 'name' | 'participants'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

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
            const response = await fetch(`${API_BASE_URL}/api/v1/list/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    creator: creatorName,
                    participants: participants,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to create list')
            }

            const data: CreateListResponse = await response.json()

            // Store creator name in localStorage for this list
            localStorage.setItem(`list-${data.listId}-username`, creatorName)

            navigate(`/list/${data.listId}`, { replace: true })
        } catch (error) {
            console.error('Error creating list:', error)
            setIsCreating(false)
        }
    }

    return (
        <main className="wizard">
            <div className="wizard__content">
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
