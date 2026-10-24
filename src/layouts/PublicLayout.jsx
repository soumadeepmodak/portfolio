
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}

export default PublicLayout
