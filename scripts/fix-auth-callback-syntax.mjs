import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')
const broken="replace(/^\\?/,'))"
const fixed="replace(/^\\?/,'')"
if(s.includes(broken)){
  s=s.replaceAll(broken,fixed)
  fs.writeFileSync(file,s)
  console.log('Auth callback syntax repaired')
}else{
  console.log('Auth callback syntax already valid')
}
