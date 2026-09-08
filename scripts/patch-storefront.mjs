import fs from 'node:fs'
const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')
s=s.replace("const CANVAS_PRICES:Record<string,number>={A5:349,A4:449,A3:549,A2:749,A1:1099}\nconst CANVAS_SIZES=['A5','A4','A3','A2','A1']\nconst FRAME_PRICES:Record<string,number>={Unframed:0,Black:150,White:100,'Natural Wood':250}","const CANVAS_PRICES:Record<string,number>={A5:349,A4:449,A3:549,A2:749,A1:1099,A0:1799}\nconst CANVAS_SIZES=['A5','A4','A3','A2','A1','A0']")
s=s.replace("function canvasPrice(size:string,frame:string){return (CANVAS_PRICES[size]||349)+(FRAME_PRICES[frame]||0)}","function canvasPrice(size:string,_frame:string){return CANVAS_PRICES[size]||349}")
s=s.replace("[selectedSize,setSelectedSize]=useState('A4'),[selectedFrame,setSelectedFrame]=useState('Black')","[selectedSize,setSelectedSize]=useState('A4'),[selectedFrame,setSelectedFrame]=useState('Unframed')")
s=s.replace('Four aviation artworks. Five canvas sizes.','Four aviation artworks. Six canvas sizes.')
s=s.replace('Canvas / five sizes · Frames available','Canvas · Six sizes · Unframed')
s=s.replace('{i.size} · {i.frame} · Qty {i.quantity}','{i.size} · Qty {i.quantity}')
const start=s.indexOf('function ProductPage('), end=s.indexOf('function Cart(',start)
if(start<0||end<0) throw new Error('ProductPage not found')
const fn=`function ProductPage({product,selectedSize,setSelectedSize,selectedFrame,setSelectedFrame,add,wished,toggleWish}:{product:Product;selectedSize:string;setSelectedSize:(x:string)=>void;selectedFrame:string;setSelectedFrame:(x:string)=>void;add:(p:Product)=>void;wished:boolean;toggleWish:()=>void}){const total=canvasPrice(selectedSize,'Unframed');return <main className="product-page container"><div className="product-layout"><div className="gallery">{[...product.images,...product.images].slice(0,2).map((x,i)=><img key={i} src={x.startsWith('http')?x:storageUrl(x)} alt={product.name}/>)}</div><div className="product-info"><div className="eyebrow">{product.category||'Aviation Art'}</div><h1>{product.name}</h1><div className="price">{money(total)}</div><p>{product.description||product.short_description||'A cinematic aviation photograph, printed on premium canvas and prepared for display.'}</p><div className="options"><div className="option-title">Canvas size</div><div className="option-row">{CANVAS_SIZES.map(x=><button className={'option '+(selectedSize===x?'active':'')} onClick={()=>setSelectedSize(x)} key={x}>{x}<small>{money(CANVAS_PRICES[x])}</small></button>)}</div></div><button className="primary" onClick={()=>add(product)}>Add to bag · {money(total)}</button><button className="secondary" onClick={toggleWish}>{wished?'Remove from wishlist':'Save to wishlist'} <Heart size={13}/></button><div className="notice" style={{marginTop:20}}>Made to order · Nationwide delivery R95.</div></div></div></main>}`
s=s.slice(0,start)+fn+s.slice(end)
fs.writeFileSync(file,s)
console.log('Storefront patch applied')
