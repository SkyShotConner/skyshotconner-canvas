import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

const old="function Home({nav,products}:{nav:(x:string)=>void;products:Product[]})"
const next="function Home({nav,products,siteImages,siteImagesReady}:{nav:(x:string)=>void;products:Product[];siteImages?:Record<string,string>;siteImagesReady?:boolean})"

if(s.includes(old)){
  s=s.replace(old,next)
  fs.writeFileSync(file,s)
  console.log('Home props fixed')
}else if(s.includes(next)){
  console.log('Home props already fixed')
}else{
  throw new Error('Home component signature not found')
}
