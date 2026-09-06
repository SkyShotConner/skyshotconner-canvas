const demoProducts=[
 {id:'demo-1',name:'Aviation Collection — Coming Soon',description:'Your first SkyShotConner Canvas will appear here.',price:0,image:''},
 {id:'demo-2',name:'Aircraft Portrait — Coming Soon',description:'Premium aviation photography on canvas.',price:0,image:''},
 {id:'demo-3',name:'Airshow Collection — Coming Soon',description:'Bring the airshow home.',price:0,image:''},
 {id:'demo-4',name:'Classic Aviation — Coming Soon',description:'Timeless aircraft photography.',price:0,image:''}
];

function getCart(){try{return JSON.parse(localStorage.getItem('ssc_canvas_cart')||'[]')}catch{return[]}}
function setCart(c){localStorage.setItem('ssc_canvas_cart',JSON.stringify(c));updateCartCount()}
function updateCartCount(){const n=getCart().reduce((s,p)=>s+(p.qty||1),0);document.querySelectorAll('#cartCount').forEach(e=>e.textContent=n)}
function productCard(p){return `<article class="product-card"><a href="product.html?id=${encodeURIComponent(p.id)}" style="text-decoration:none;color:inherit"><div class="product-image">${p.image?`<img src="${p.image}" alt="${p.name}" loading="lazy">`:'✈'}</div><div class="product-info"><h3>${p.name}</h3><p>${p.description||''}</p>${p.price?`<span class="price">R ${Number(p.price).toLocaleString('en-ZA')}</span>`:'<span class="price">Coming soon</span>'}</div></a></article>`}
function renderDemo(){const el=document.querySelector('#featuredProducts');if(el)el.innerHTML=demoProducts.map(productCard).join('')}
function setupNav(){const b=document.querySelector('.menu-toggle'),n=document.querySelector('.main-nav');if(b)b.addEventListener('click',()=>n.classList.toggle('open'))}
document.addEventListener('DOMContentLoaded',()=>{setupNav();updateCartCount();renderDemo();const y=document.querySelector('#year');if(y)y.textContent=new Date().getFullYear();setTimeout(()=>document.querySelector('#loader')?.classList.add('hidden'),450)});
