import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebase.js'

import App from '../App.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'

import Home from '../pages/Home.jsx'
import About from '../pages/About.jsx'
import Experience from '../pages/Experience.jsx'
import Internships from '../pages/Internships.jsx'
import Skills from '../pages/Skills.jsx'
import Projects from '../pages/Projects.jsx'
import { Education } from '../pages/Education.jsx'
import Resume from '../pages/Resume.jsx'
import Certifications from '../pages/Certifications.jsx'
import Contact from '../pages/Contact.jsx'

import AdminLogin from '../pages/AdminLogin.jsx'
import AdminDashboard from '../pages/AdminDashboard.jsx'

const ADMIN_UID = 'PuosNYo4JCOhP8vJCSHcSAxQ9Rt2'

function ProtectedAdminRoute() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthChecked(true)
    })

    return unsubscribe
  }, [])

  if (!authChecked) {
    return <p>Checking login...</p>
  }

  if (!user || user.uid !== ADMIN_UID) {
    return <Navigate to="/admin" replace />
  }

  return <AdminDashboard />
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/internships" element={<Internships />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/education" element={<Education />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="/certifications" element={<Certifications />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      <Route path="/admin" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={<ProtectedAdminRoute />}
      />
      <Route path="/legacy" element={<App />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
