/* Alpine components for the public site. Each page uses only what it needs. */
const jpost=(u,b)=>fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json());
const money=n=>Math.round(n||0).toLocaleString();

document.addEventListener('DOMContentLoaded',()=>{
  const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in')),{threshold:.1});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  // Housecall Pro: booking links open its popup when the widget script has loaded; otherwise they just follow the link (new tab)
  const bookUrl=document.body.dataset.bookUrl;
  if(bookUrl)document.addEventListener('click',e=>{const a=e.target.closest('a[href]');
    if(a&&a.href===bookUrl&&window.HCPWidget&&typeof HCPWidget.openModal==='function'){e.preventDefault();HCPWidget.openModal()}});
  document.querySelectorAll('a[href^="http"]').forEach(a=>{if(a.host!==location.host){a.target='_blank';a.rel='noopener'}});
  
});

function counters(items){return{stats:items.map(s=>({...s,now:0})),
  init(){this.stats.forEach(s=>{const t0=performance.now();const f=t=>{const p=Math.min(1,(t-t0)/1800);s.now=s.to*(1-Math.pow(1-p,3));if(p<1)requestAnimationFrame(f)};setTimeout(()=>requestAnimationFrame(f),300)})},
  fmt(s){if(s.text)return s.text;return s.fmt.replace('{v}',s.dec?s.now.toFixed(s.dec):Math.round(s.now).toLocaleString())}}}

function hero(){return{mode:'cool',target:68,current:74,
  get dialLen(){return 20+((this.target-60)/25)*385},
  init(){
    setInterval(()=>{if(this.current!==this.target){this.current=+(this.current+Math.sign(this.target-this.current)*Math.min(.5,Math.abs(this.target-this.current))).toFixed(1)}},350);
    this.airflow()},
  setMode(m){this.mode=m;document.body.classList.toggle('heat',m==='heat');this.target=m==='cool'?68:72;this.current=m==='cool'?76:64},
  bump(n){this.target=Math.max(60,Math.min(85,this.target+n))},
  airflow(){
    const c=this.$refs.air,x=c.getContext('2d'),dpr=devicePixelRatio||1;let W,H,ps=[],mx=-999,my=-999;
    const fit=()=>{W=c.width=c.offsetWidth*dpr;H=c.height=c.offsetHeight*dpr;ps=Array.from({length:Math.min(220,W/8)},()=>({x:Math.random()*W,y:Math.random()*H,v:.6+Math.random()*1.6}))};
    fit();addEventListener('resize',fit);
    c.parentElement.addEventListener('mousemove',e=>{const r=c.getBoundingClientRect();mx=(e.clientX-r.left)*dpr;my=(e.clientY-r.top)*dpr});
    const loop=()=>{const heat=this.mode==='heat';
      x.fillStyle=heat?'rgba(13,9,7,.16)':'rgba(6,11,20,.16)';x.fillRect(0,0,W,H);
      const hue=heat?'255,138,61':getComputedStyle(document.body).getPropertyValue('--glow').trim()||'56,214,255',t=Date.now()/2600;
      for(const p of ps){
        let a=Math.sin(p.y/160+t)*.6+Math.sin(p.x/300-t)*.4;if(heat)a=-Math.PI/2*.6+a*.5-.4+Math.sin(p.x/90+t*2)*.5;
        const dy=p.y-my,d=Math.hypot(p.x-mx,dy);if(d<200)a+=(dy>0?.9:-.9)*(1-d/200);
        const ox=p.x,oy=p.y;p.x+=Math.cos(a)*p.v*2*dpr;p.y+=Math.sin(a)*p.v*2*dpr;
        x.strokeStyle=`rgba(${hue},${.15+p.v*.18})`;x.lineWidth=p.v*dpr;x.beginPath();x.moveTo(ox,oy);x.lineTo(p.x,p.y);x.stroke();
        if(p.x>W||p.x<0||p.y>H||p.y<0){p.x=heat?Math.random()*W:0;p.y=heat?H:Math.random()*H}}
      requestAnimationFrame(loop)};loop()}}}

function estimator(){return{est:{sqft:2400,home_type:'home',stories:2,efficiency:'high',ductwork:false},res:null,money,
  init(){this.calc()},async calc(){this.res=await jpost('/api/estimate',this.est)}}}

function chat(names){return{open:false,names,msgs:[{who:'bot',text:"Hi! I'm the assistant. What's your system doing?"}],draft:'',typing:false,suggest:null,
  async ask(q){const text=(q||this.draft).trim();if(!text)return;this.draft='';this.suggest=null;this.msgs.push({who:'me',text});this.typing=true;this.scroll();
    const r=await jpost('/api/chat',{message:text});setTimeout(()=>{this.typing=false;this.msgs.push({who:'bot',text:r.reply});this.suggest=r.service;this.scroll()},650)},
  scroll(){this.$nextTick(()=>{const e=this.$refs.msgs;e.scrollTop=e.scrollHeight})}}}

function tracker(initial){return{code:initial||'',job:null,err:'',poll:null,
  init(){if(this.code)this.lookup()},
  idx(){return this.job.steps.indexOf(this.job.status)},pct(){return Math.max(0,this.idx())/(this.job.steps.length-1)*100},
  fmt(t){const h=+t.slice(0,2);return (h%12||12)+':00 '+(h<12?'AM':'PM')},
  async lookup(){this.err='';clearInterval(this.poll);const code=this.code.trim();if(!code)return;
    const go=async()=>{const r=await fetch('/api/track/'+encodeURIComponent(code));if(r.ok)this.job=await r.json();else{this.job=null;this.err='No job found with that code.';clearInterval(this.poll)}};
    await go();if(this.job)this.poll=setInterval(go,4000)}}}


/* Work gallery: filter + enlarge (plain JS, no framework dependency) */
document.addEventListener('click',e=>{
  const fb=e.target.closest('.filters button[data-f]');
  if(fb){const f=fb.dataset.f;fb.parentElement.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===fb));
    document.querySelectorAll('.shot').forEach(s=>{s.hidden=!(f==='all'||s.dataset.cat===f)});return}
  const shot=e.target.closest('.shot');
  if(shot){const img=shot.querySelector('img'),cap=shot.querySelector('figcaption');
    const lb=document.createElement('div');lb.className='lb';lb.innerHTML='<button class="lb-x" aria-label="Close">✕</button><figure><img><figcaption></figcaption></figure>';
    lb.querySelector('img').src=(img.currentSrc||img.src).replace('-sq.jpg','.jpg');lb.querySelector('img').alt=img.alt;lb.querySelector('figcaption').textContent=cap?cap.textContent:'';
    document.body.appendChild(lb);return}
  const lb=e.target.closest('.lb');if(lb)lb.remove();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.lb').forEach(l=>l.remove());
  if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('shot')){e.preventDefault();e.target.click()}});
