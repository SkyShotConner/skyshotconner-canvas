import './admin-nav.css'
import './site-images.css'
import './orders/orders.css'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>
    <div className="admin-section-nav">
      <a href="/admin">Products</a>
      <a href="/admin/orders">Orders</a>
      <a href="/admin/special-collection">Special Collection</a>
      <a href="/admin/site-images">Website images</a>
      <a href="/admin/branding">Branding</a>
    </div>
    {children}
  </>
}
