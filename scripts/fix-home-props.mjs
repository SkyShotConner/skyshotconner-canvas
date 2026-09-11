import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

// finalize-storefront makes the image map optional, so the helper must accept
// the optional value instead of forcing every Home call to pass a map.
s=s.replace(
  "function siteImage(images:Record<string,string>,key:string,fallback:string)",
  "function siteImage(images:Record<string,string>|undefined,key:string,fallback:string)"
)

const old="function Home({nav,products}:{nav:(x:string)=>void;products:Product[]})"
const next="function Home({nav,products,siteImages,siteImagesReady}:{nav:(x:string)=>void;products:Product[];siteImages?:Record<string,string>;siteImagesReady?:boolean})"

if(s.includes(old)){
  s=s.replace(old,next)
}

fs.writeFileSync(file,s)
console.log('Home props fixed')
