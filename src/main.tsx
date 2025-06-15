import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Other routes */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);

