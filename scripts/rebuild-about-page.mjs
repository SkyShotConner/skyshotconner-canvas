import fs from 'node:fs'

const file = 'app/[[...slug]]/page.tsx'
let s = fs.readFileSync(file, 'utf8')

const start = s.indexOf('function About(')
const end = s.indexOf('function SimplePage(', start)
if (start < 0 || end < 0) throw new Error('Unable to locate About component')

const about = `function About(){
 const supabase=useMemo(()=>createClient(),[])
 const [images,setImages]=useState<Record<string,string>>({})
 useEffect(()=>{if(!supabase)return;supabase.from('site_images').select('key,image_url').in('key',['about_hero','about_main','about_secondary']).then(({data})=>{if(data)setImages(Object.fromEntries(data.map((x:any)=>[x.key,x.image_url||''])))})},[supabase])
 const image=(key:string)=>images[key]||''
 return <main className="about-page">
  <section className="about-new-hero">
   {image('about_hero')&&<img className="about-new-hero-image" src={image('about_hero')} alt="Conner behind SkyShotConner photography"/>}
   <div className="about-new-hero-shade"/>
   <div className="about-new-hero-copy">
    <div className="eyebrow">SkyShotConner / About</div>
    <h1>BEHIND<br/>THE LENS.</h1>
    <p>Photography, aviation and the story behind every SkyShotConner artwork.</p>
   </div>
   <div className="about-new-hero-index">01 / THE STORY</div>
  </section>

  <section className="about-new-paper">
   <div className="about-new-container">
    <div className="about-new-intro">
     <div className="eyebrow">Hi, I'm Conner.</div>
     <h2>I'm an 18-year-old photographer from South Africa and the person behind SkyShotConner.</h2>
     <div className="about-new-copy"><p>Photography for me isn't simply about taking a technically perfect photograph. It's about capturing a moment that might never happen in exactly the same way again — an aircraft breaking through the light, wildlife looking directly into the lens, or a landscape that makes you stop for a second and just look.</p><p>But my journey didn't actually begin with a camera.</p></div>
    </div>

    <div className="about-new-quote"><span>02 / AVIATION</span><strong>It started<br/>with aviation.</strong></div>

    <div className="about-new-split">
     <div className="about-new-copy about-new-copy-large"><p>My passion for aviation truly took off in 2024.</p><p>I wasn't someone who had spent my entire childhood knowing every aircraft type and registration. I was still learning. I got aircraft wrong, asked questions, made mistakes and slowly became completely fascinated by the world of aviation.</p><p>Then I picked up a camera.</p><p>What started as photographing aircraft quickly became something much bigger. I began learning how light, movement, composition and timing could turn an ordinary photograph of an aircraft into something that actually made me feel something.</p><p>Thousands of photographs later, aviation photography has taken me to airshows, airports and aviation museums, introduced me to incredible people and organisations, and given me opportunities I never imagined having when I started.</p></div>
     <figure className="about-new-figure">{image('about_main')?<img src={image('about_main')} alt="SkyShotConner aviation photography journey"/>:<div className="about-image-placeholder">Add About Main Image in Admin</div>}<figcaption>From curiosity to a life built around looking up.</figcaption></figure>
    </div>

    <div className="about-new-dark">
     <div className="about-new-dark-number">03</div>
     <div className="about-new-dark-content"><div className="eyebrow">From photograph to artwork</div><h2>What if these photographs didn't have to stay on a screen?</h2><div className="about-new-dark-grid"><p>I wanted my photography to become something physical — something you could hang on a wall, give as a gift, or keep because the aircraft, animal or place in that photograph means something to you.</p><p>That's why I started turning my work into canvas artwork. Every photograph sold through SkyShotConner was originally captured through my own lens. I personally select the images that become artwork and prepare them for print.</p></div><div className="about-new-statement">Some photographs never make it into the collection.<br/><b>The ones that do have earned their place.</b></div></div>
    </div>

    <div className="about-new-split about-new-split-reverse">
     <figure className="about-new-figure about-new-figure-wide">{image('about_secondary')?<img src={image('about_secondary')} alt="SkyShotConner nature and wildlife photography"/>:<div className="about-image-placeholder">Add About Secondary Image in Admin</div>}<figcaption>Aviation at the heart. Nature and wildlife through the same lens.</figcaption></figure>
     <div className="about-new-section-text"><div className="eyebrow">04 / More than aviation</div><h2>Capture something worth remembering.</h2><div className="about-new-copy"><p>Aircraft will always be at the heart of SkyShotConner, but photography has taught me to look beyond the sky.</p><p>Today my work also includes nature and wildlife photography.</p><p>The subjects may change, but the idea behind them doesn't.</p></div></div>
    </div>

    <div className="about-new-ending">
     <div className="eyebrow">05 / The story is only beginning</div>
     <h2>SkyShotConner is still young.<br/><em>So am I.</em></h2>
     <div className="about-new-ending-grid"><div className="about-new-copy"><p>I'm still learning, still photographing, still experimenting and still chasing the next image that makes me stop while editing and think, <i>that's the one.</i></p><p>When you buy a SkyShotConner artwork, you're not buying an image pulled from a stock library or produced by a massive company.</p></div><div className="about-new-copy"><p>You're buying a photograph captured by a young South African photographer who was actually standing behind the camera when that moment happened.</p><p>And knowing that something I captured could eventually end up hanging on somebody else's wall is something I don't think I'll ever take for granted.</p></div></div>
     <div className="about-new-signoff"><strong>Conner Spies</strong><span>Photographer & Founder</span><span>SkyShotConner</span></div>
    </div>
   </div>
  </section>
 </main>
}
`

s = s.slice(0,start) + about + s.slice(end)
fs.writeFileSync(file,s)
console.log('Editorial About page rebuilt')
