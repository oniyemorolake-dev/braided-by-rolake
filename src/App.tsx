import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { BookingProvider } from './context/BookingContext'
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'
import { Home } from './pages/Home'
import { Services } from './pages/Services'
import { Gallery } from './pages/Gallery'
import { About } from './pages/About'
import { Booking } from './pages/Booking'
import { Admin } from './pages/Admin'
import { Status } from './pages/Status'
import { Reviews } from './pages/Reviews'
import { Policies } from './pages/Policies'
import { PrepAftercare } from './pages/PrepAftercare'

export default function App() {
  return (
    <BookingProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="about" element={<About />} />
            <Route path="policies" element={<Policies />} />
            <Route path="care" element={<PrepAftercare />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="book" element={<Booking />} />
            <Route path="status/:id" element={<Status />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </BookingProvider>
  )
}
