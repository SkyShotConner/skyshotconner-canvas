import fs from 'node:fs'

const file='app/[[...slug]]/page.tsx'
let s=fs.readFileSync(file,'utf8')

const productStart=s.indexOf('function ProductCard(')
const shopStart=s.indexOf('function Shop(',productStart)
const productPageStart=s.indexOf('function ProductPage(',shopStart)
if(productStart<0||shopStart<0||productPageStart<0) throw new Error('Collection components not found')

const productFn=`function ProductCard({p,nav,small=false,layout}:{p:Product;nav:(x:string)=>void;small?:boolean;layout?:'landscape'|'portrait'}){const role=layout||p.orientation||'landscape';return <button className={'product-card '+(small?'small ':'')+'collection-'+role} onClick={()=>nav('/product/'+p.slug)}><div className={'product-image-wrap '+role}><img src={imgFor(p)} alt={p.name} loading="lazy"/><span className="image-index">01 / 02</span></div><div className="product-meta"><div className="product-name">{p.name}</div><div className="product-sub">{p.short_description||'Premium aviation canvas artwork'}</div><div className="card-price-list">{CANVAS_SIZES.map(size=><span key={size}><b>{size}</b> {money(CANVAS_PRICES[size])}</span>)}</div><div className="product-card-note">Canvas / Six sizes</div></div></button>}
`

const shopFn=`function Shop({products,nav,query,setQuery,filter,setFilter,filterOpen,setFilterOpen,categories}:{products:Product[];nav:(x:string)=>void;query:string;setQuery:(x:string)=>void;filter:string;setFilter:(x:string)=>void;filterOpen:boolean;setFilterOpen:(x:boolean)=>void;categories:string[]}){return <main className="page container"><div className="collection-intro"><div><div className="eyebrow">SkyShotConner</div><h1 className="page-title">THE<br/>COLLECTION.</h1></div><p>Premium aviation photography, printed as fine wall art. Explore the collection by aircraft, orientation or edition.</p></div><div className="toolbar"><span>{products.length} artworks</span><div className="shop-controls"><div className="shop-search"><Search size={13}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="SEARCH THE COLLECTION" aria-label="Search the collection"/></div><div className="filter-wrap"><button className="filter-button" onClick={()=>setFilterOpen(!filterOpen)}><SlidersHorizontal size={13}/> Filter <ChevronDown size={12}/></button>{filterOpen&&<div className="filter-menu">{categories.map(c=><button key={c} className={filter===c?'active':''} onClick={()=>{setFilter(c);setFilterOpen(false)}}>{c}</button>)}</div>}</div></div></div><div className="shop-grid">{products.length?products.map((p,i)=><ProductCard key={p.id} p={p} nav={nav} layout={i%5<2?'landscape':'portrait'}/>):<div className="notice empty-search">No artworks match your search. Try another aircraft, category or title.</div>}</div></main>}
`

s=s.slice(0,productStart)+productFn+shopFn+s.slice(productPageStart)
fs.writeFileSync(file,s)
console.log('Collection layout rebuilt from scratch')
