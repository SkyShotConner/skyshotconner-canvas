import './admin-nav.css'
import './site-images.css'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>
    <div className="admin-section-nav">
      <a href="/admin">Products</a>
      <a href="/admin/site-images">Website images</a>
    </div>
    {children}
  </>
}
