export const landingTitle = 'TogetherList — Shared lists without sign-up'
export const landingDescription = 'Create a free shared list, share its link and collaborate in your browser. Connect a compatible MCP agent to plan and update the same list with your group.'
export const landingUrl = 'https://togetherlist.eu/'
export const socialImage = 'https://togetherlist.eu/social-card.png'
export function landingSchema(faq: { question: string; answer: string }[]) {
    return [
        { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'TogetherList', url: landingUrl, description: landingDescription, applicationCategory: 'ProductivityApplication', operatingSystem: 'Web browser', offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' } },
        { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(({ question, answer }) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) },
    ]
}
