import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ListPage from './pages/ListPage'
import CreateListPage from './pages/CreateListPage'

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
