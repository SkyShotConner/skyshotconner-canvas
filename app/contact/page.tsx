import Link from 'next/link'

export default function ContactPage(){
  return <main className="info-page container">
    <div className="info-hero"><div className="eyebrow">SkyShotConner / Contact</div><h1 className="page-title">LET'S TALK<br/>AVIATION.</h1><p>Questions about an artwork, an order, a collaboration or something aviation-related? Get in touch.</p></div>
    <section className="info-grid">
      <div className="info-card"><span className="eyebrow">Email</span><h2>Conner Aviation</h2><p>For customer support, artwork enquiries, collaborations and general questions.</p><a className="info-link" href="mailto:conneraviation18@gmail.com">conneraviation18@gmail.com ↗</a></div>
      <div className="info-card"><span className="eyebrow">Response</span><h2>We're here to help.</h2><p>Please include your order number where relevant. For artwork enquiries, tell us which aircraft or piece you are asking about.</p><Link className="secondary" href="/shop">Explore the collection</Link></div>
    </section>
  </main>
}
