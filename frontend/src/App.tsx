import { Routes, Route } from 'react-router-dom'
import LandingPage from './features/create-list/LandingPage'
import ListPage from './features/view-list/ListPage'
import CreateListPage from './features/create-list/CreateListPage'

function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/list/new" element={<CreateListPage />} />
            <Route path="/list/:id" element={<ListPage />} />
        </Routes>
    )
}

export default App
