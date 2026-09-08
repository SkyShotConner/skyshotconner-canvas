'use client'
import InfoShell from '@/app/components/InfoShell'
import Link from 'next/link'
import { FormEvent, useState } from 'react'

export default function ContactPage(){
 const [name,setName]=useState(''),[subject,setSubject]=useState(''),[message,setMessage]=useState('')
 const submit=(e:FormEvent)=>{e.preventDefault();const body=`Name: ${name}\n\n${message}`;window.location.href=`mailto:conneraviation18@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
 return <InfoShell><main className="info-page container"><div className="info-hero"><div className="eyebrow">SkyShotConner / Contact</div><h1 className="page-title">LET'S TALK<br/>AVIATION.</h1><p>Questions about an artwork, an order, a collaboration or something aviation-related? Send us a message.</p></div><section className="contact-layout"><form className="contact-form" onSubmit={submit}><label>Name<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label><label>Subject<input required value={subject} onChange={e=>setSubject(e.target.value)} placeholder="What can we help with?"/></label><label>Message<textarea required value={message} onChange={e=>setMessage(e.target.value)} placeholder="Write your message..." rows={8}/></label><button className="primary" type="submit">Open email ↗</button><p className="form-note">Your email app will open with the recipient, subject and message pre-filled.</p></form><div className="info-card contact-side"><span className="eyebrow">Email</span><h2>Conner Aviation</h2><p>For customer support, artwork enquiries, collaborations and general questions.</p><a className="info-link" href="mailto:conneraviation18@gmail.com">conneraviation18@gmail.com ↗</a><Link className="secondary" href="/shop">Explore the collection</Link></div></section></main></InfoShell>
}
