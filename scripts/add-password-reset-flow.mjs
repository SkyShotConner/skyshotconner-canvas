import fs from 'node:fs'

const file = 'app/[[...slug]]/page.tsx'
let s = fs.readFileSync(file, 'utf8')

// Always send password recovery emails back to the production password-reset page.
// This prevents Supabase from falling back to the old Vercel deployment URL.
const resetRedirect = 'https://skyshotconner.co.za/reset-password'
const pattern = /resetPasswordForEmail\(\s*email\s*(?:,\s*\{[^{}]*\})?\s*\)/g
s = s.replace(pattern, `resetPasswordForEmail(email,{redirectTo:'${resetRedirect}'})`)

fs.writeFileSync(file, s)

const cssFile = 'app/globals.css'
let css = fs.readFileSync(cssFile, 'utf8')

const resetCss = `

/* Password reset page */
.auth-page{min-height:100svh;padding:150px 20px 100px;display:grid;place-items:center;background:#0a0a09}.auth-card{width:min(560px,100%);padding:52px 48px;border:1px solid #292a26;background:#10110f}.auth-card h1{font-size:clamp(38px,6vw,64px);line-height:.95;font-weight:300;letter-spacing:-.05em;margin:18px 0}.auth-intro{color:#999;line-height:1.8;font-size:13px;margin:0 0 34px}.auth-form{display:grid;gap:18px}.auth-form label{display:grid;gap:8px;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#8d8b86}.auth-form input{background:#0b0c0a;border:1px solid #30302c;color:#eee;padding:15px;outline:none;width:100%;font-size:13px;letter-spacing:0}.auth-form input:focus{border-color:#777}.auth-form input:disabled{opacity:.5}.auth-submit{width:100%;padding:17px;border:1px solid #eee;background:#eee;color:#0a0a09;letter-spacing:.18em;text-transform:uppercase;font-size:10px}.auth-submit:disabled{opacity:.45;cursor:not-allowed}.auth-message{padding:13px 14px;border:1px solid #343530;font-size:11px;line-height:1.6}.auth-message.error{color:#d1aaa4;border-color:#493432}.auth-message.success{color:#bfcab9;border-color:#374033;margin-top:10px}.auth-footer{margin-top:42px;padding-top:18px;border-top:1px solid #292a26;color:#4f504b;font-size:9px;letter-spacing:.18em;text-transform:uppercase;text-align:center}@media(max-width:600px){.auth-page{padding:110px 16px 60px}.auth-card{padding:36px 24px}.auth-card h1{font-size:42px}}
`

if (!css.includes('/* Password reset page */')) {
  fs.writeFileSync(cssFile, css + resetCss)
}

console.log('Password reset flow applied')
