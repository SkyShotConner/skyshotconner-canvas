/* SkyShotConner Canvas safety/fix layer */
(function(){
  'use strict';

  const SIZES=[['A5',349],['A4',449],['A3',549],['A2',749],['A1',1099],['A0',1799]];
  const money=v=>`R ${Number(v).toLocaleString('en-ZA')}`;
  let observer=null;
  let scheduled=false;
  let running=false;

  function patchCards(){
    document.querySelectorAll('.product-card').forEach(card=>{
      card.querySelector('.stock-label')?.remove();

      const choice=card.querySelector('.canvas-choice');
      if(choice && !choice.dataset.sscPatched){
        choice.dataset.sscPatched='1';
        choice.innerHTML='<span>CANVAS OPTIONS</span><div class="canvas-options">'+SIZES.map(([s,p])=>`<div class="canvas-option"><span>${s}</span><strong>${money(p)}</strong></div>`).join('')+'</div>';
      }

      const price=card.querySelector('.price');
      if(price && price.textContent.trim()!==`From ${money(SIZES[0][1])}`){
        price.textContent=`From ${money(SIZES[0][1])}`;
      }
    });
  }

  function patchAccount(){
    const root=document.querySelector('#accountBox');
    if(!root || !root.querySelector('.account-head')) return;

    root.querySelectorAll('.account-stat').forEach(stat=>{
      if(/total spent/i.test(stat.textContent))stat.remove();
    });

    const head=root.querySelector('.account-head');
    if(head && !head.querySelector('.account-email-row')){
      const p=head.querySelector('p');
      if(p){
        const email=p.textContent.trim();
        const row=document.createElement('div');
        row.className='account-email-row';
        const label=document.createElement('span');
        label.textContent=email;
        const badge=document.createElement('span');
        badge.className='unverified-badge';
        badge.textContent='✓ Email not verified';
        row.append(label,badge);
        p.replaceWith(row);

        window.supabase?.createClient && (async()=>{
          try{
            const c=window.supabase.createClient('https://xdkoutuetajwzwrjzehw.supabase.co','sb_publishable_K0r7cxL94PMJ5S0HM8aKfQ_cc73t2hu');
            const {data:{user}}=await c.auth.getUser();
            if(user?.email_confirmed_at){
              badge.className='verified-badge';
              badge.textContent='✓ Verified';
            }
          }catch(e){
            console.warn('Account verification check failed',e);
          }
        })();
      }
    }

    if(!root.querySelector('.instagram-card')){
      const grid=root.querySelector('.account-grid');
      if(grid){
        const card=document.createElement('div');
        card.className='instagram-card';
        card.innerHTML='<strong>Instagram</strong><br><a href="https://instagram.com/skyshotconner" target="_blank" rel="noopener">@skyshotconner</a>';
        grid.appendChild(card);
      }
    }
  }

  function patchAdmin(){
    const name=document.querySelector('#productName'),sku=document.querySelector('#productSku');
    if(name&&sku&&!sku.dataset.autoHook){
      sku.dataset.autoHook='1';
      const assign=()=>{
        if(!sku.value.trim() && name.value.trim()){
          sku.value='SSC-'+name.value.trim().toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,16)+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
        }
      };
      name.addEventListener('input',assign);
      name.addEventListener('blur',assign);
    }

    const stock=document.querySelector('#productStock');
    if(stock){
      const l=stock.closest('label');
      if(l)l.style.display='none';
    }
  }

  function run(){
    if(running) return;
    running=true;
    if(observer) observer.disconnect();
    try{
      patchCards();
      patchAccount();
      patchAdmin();
    }finally{
      running=false;
      if(observer && document.body) observer.observe(document.body,{childList:true,subtree:true});
    }
  }

  function scheduleRun(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      run();
    });
  }

  if(document.body){
    observer=new MutationObserver(scheduleRun);
    observer.observe(document.body,{childList:true,subtree:true});
    run();
  }else{
    document.addEventListener('DOMContentLoaded',()=>{
      observer=new MutationObserver(scheduleRun);
      observer.observe(document.body,{childList:true,subtree:true});
      run();
    },{once:true});
  }
})();
