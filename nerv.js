/* NERV OS shared runtime: clock, sfx, boot, ticker */
(function(){
  const NERV = window.NERV = {};

  /* ---- sound (WebAudio, opt-in, persisted) ---- */
  let ac = null;
  NERV.soundOn = () => localStorage.getItem('nerv-sound') !== '0';  // sound ON by default
  NERV.toggleSound = () => {
    localStorage.setItem('nerv-sound', NERV.soundOn() ? '0' : '1');
    paintSoundBtns();
    if (NERV.soundOn()) blip(880, .05);
  };
  /* ---- theme (amber default, green phosphor alt) ---- */
  NERV.theme = () => localStorage.getItem('nerv-theme') === 'green' ? 'green' : 'amber';
  NERV.applyTheme = () => {
    document.documentElement.classList.toggle('green', NERV.theme() === 'green');
    document.querySelectorAll('[data-theme-btn]').forEach(b=>{
      b.textContent = 'SIGNAL ' + (NERV.theme() === 'green' ? 'PHOSPHOR' : 'AMBER');
    });
  };
  NERV.toggleTheme = () => {
    localStorage.setItem('nerv-theme', NERV.theme() === 'green' ? 'amber' : 'green');
    NERV.applyTheme();
    blip(NERV.theme() === 'green' ? 990 : 660, .06);
  };
  function ctx(){ if(!ac){ try{ ac = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return ac; }
  function blip(freq, dur, type, gain){
    if(!NERV.soundOn()) return;
    const c = ctx(); if(!c) return;
    if(c.state === 'suspended') c.resume();
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(gain || .04, c.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + (dur || .05));
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + (dur || .05));
  }
  NERV.blip = blip;
  NERV.siren = function(seconds){
    // works even if sound toggle is off? No — respect toggle, but alarms force-enable sound per UI flow.
    const c = ctx(); if(!c) return;
    if(c.state === 'suspended') c.resume();
    const end = c.currentTime + (seconds || 6);
    let t = c.currentTime;
    while(t < end){
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(660, t);
      o.frequency.setValueAtTime(520, t + .18);
      g.gain.setValueAtTime(.06, t);
      g.gain.setValueAtTime(.06, t + .34);
      g.gain.exponentialRampToValueAtTime(.0001, t + .36);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + .38);
      t += .4;
    }
  };
  NERV.chime = function(){
    const c = ctx(); if(!c) return;
    if(c.state === 'suspended') c.resume();
    [523.25, 659.25, 783.99].forEach((f,i)=>{
      const o = c.createOscillator(), g = c.createGain();
      o.type='sine'; o.frequency.value=f;
      const t = c.currentTime + i*.14;
      g.gain.setValueAtTime(.07, t);
      g.gain.exponentialRampToValueAtTime(.0001, t + .5);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t+.55);
    });
  };

  function paintSoundBtns(){
    document.querySelectorAll('[data-sound-btn]').forEach(b=>{
      b.textContent = 'SOUND ' + (NERV.soundOn() ? 'ON' : 'OFF');
    });
  }

  /* ---- status clock ---- */
  function two(n){ return String(n).padStart(2,'0'); }
  NERV.two = two;
  function tickClock(){
    const d = new Date();
    document.querySelectorAll('[data-clock]').forEach(el=>{
      el.textContent = two(d.getHours())+':'+two(d.getMinutes())+':'+two(d.getSeconds());
    });
    document.querySelectorAll('[data-date]').forEach(el=>{
      el.textContent = d.getFullYear()+'.'+two(d.getMonth()+1)+'.'+two(d.getDate());
    });
  }
  setInterval(tickClock, 1000);

  /* ---- shell builder ---- */
  NERV.shell = function(active, subtitle){
    document.body.classList.add('crt');
    const apps = [
      ['index.html','HUB','ハブ'],
      ['clock.html','CHRONO','時計'],
      ['timer.html','YASHIMA','作戦'],
      ['todo.html','DIRECTIVE','任務'],
      ['notes.html','LOG','記録'],
      ['calc.html','MAGI','演算'],
      ['weather.html','ATMO','気象'],
    ];
    const pre = '';
    const top = document.createElement('div');
    top.className = 'topbar';
    top.innerHTML =
      '<a class="brand" href="'+pre+'index.html"><span class="fig glow">NERV</span><span class="jp">特務機関 OS v2.0</span></a>' +
      '<nav>' + apps.map(a=>{
        const href = pre + a[0];
        const on = (active === a[1]) ? ' class="on"' : '';
        return '<a'+on+' href="'+href+'" data-nav>'+a[1]+'</a>';
      }).join('') + '</nav>' +
      '<div class="sys"><span class="dot"></span><b data-clock>--:--:--</b><span data-date></span>' +
      '<button class="btn" data-sound-btn style="padding:4px 8px;font-size:9px"></button>' +
      '<button class="btn" data-theme-btn style="padding:4px 8px;font-size:9px"></button></div>';
    document.body.prepend(top);

    const tick = document.createElement('div');
    tick.className = 'ticker';
    tick.innerHTML = '<span>NERV HEADQUARTERS — CENTRAL DOGMA ONLINE — MAGI SYSTEM NOMINAL — SYNCH RATE STABLE — A.T. FIELD INTEGRITY 100% — INTERNAL POWER SUPPLY ACTIVE — UNTIL NEXT SORTIE, MAINTAIN CONDITION GREEN — 特務機関ネルフ本部 — 第3新東京市 — </span>';
    document.body.appendChild(tick);

    document.querySelectorAll('[data-nav]').forEach(a=>{
      a.addEventListener('click', ()=> blip(1200, .04));
    });
    top.querySelector('[data-sound-btn]').addEventListener('click', NERV.toggleSound);
    top.querySelector('[data-theme-btn]').addEventListener('click', NERV.toggleTheme);
    paintSoundBtns();
    NERV.applyTheme();
    // global tactile blip on every .btn press
    document.addEventListener('click', e=>{
      const b = e.target.closest('.btn');
      if(b && !b.hasAttribute('data-sound-btn') && !b.hasAttribute('data-theme-btn')) blip(b.classList.contains('danger')?420:(b.classList.contains('warn')?760:1080), .03);
    });
    tickClock();

    // vertical margin captions
    ['left','right'].forEach(side=>{
      const v = document.createElement('div');
      v.className = 'vcap ' + side;
      v.textContent = side === 'left' ? '特務機関ネルフ' : '実用端末群 ネルフ オーエス';
      document.body.appendChild(v);
    });

    // episode title-card element
    const tc = document.createElement('div');
    tc.className = 'tcard'; tc.id = 'tcard';
    tc.innerHTML = '<div class="no"></div><div class="jp"></div><div class="en"></div>';
    document.body.appendChild(tc);

    // title-card page transitions on module links
    const cards = {
      'index.html':   ['MODULE 00','起動','TERMINAL DOGMA'],
      'clock.html':   ['MODULE 01','時計','CHRONO'],
      'timer.html':   ['MODULE 02','作戦','YASHIMA'],
      'todo.html':    ['MODULE 03','任務','DIRECTIVE'],
      'notes.html':   ['MODULE 04','記録','FIELD LOG'],
      'calc.html':    ['MODULE 05','演算','MAGI CALC'],
      'weather.html': ['MODULE 06','気象','ATMO'],
    };
    document.querySelectorAll('.topbar nav a, a.tile, a.brand').forEach(a=>{
      a.addEventListener('click', e=>{
        const href = a.getAttribute('href') || '';
        const key = Object.keys(cards).find(k => href.endsWith(k));
        if(!key) return;
        e.preventDefault();
        const c = cards[key];
        tc.querySelector('.no').textContent = c[0];
        tc.querySelector('.jp').textContent = c[1];
        tc.querySelector('.en').textContent = c[2];
        tc.classList.add('on');
        blip(520, .08);
        setTimeout(()=>{ location.href = href; }, 300);
      });
    });

    // PWA
    if('serviceWorker' in navigator && location.protocol.startsWith('http')){
      const base = './';
      navigator.serviceWorker.register(base + 'sw.js').catch(()=>{});
    }

    // emergency overlay scaffold
    const emg = document.createElement('div');
    emg.className = 'emg'; emg.id = 'emg';
    emg.innerHTML = '<div class="word">EMERGENCY</div><div class="jpw">警報</div><div class="small dim" id="emg-sub"></div><button class="btn danger" id="emg-off">ACKNOWLEDGE — STOP ALARM</button>';
    document.body.appendChild(emg);
    emg.querySelector('#emg-off').addEventListener('click', ()=>{
      emg.classList.remove('on');
      if(NERV._alarmStop) NERV._alarmStop();
    });
  };

  NERV.alarm = function(label){
    const emg = document.getElementById('emg');
    if(!emg) return;
    emg.querySelector('#emg-sub').textContent = label || '';
    emg.classList.add('on');
    NERV.siren(30);
    let stopped = false;
    const iv = setInterval(()=>{ if(!stopped) NERV.siren(30); }, 30000);
    NERV._alarmStop = ()=>{ stopped = true; clearInterval(iv); };
  };

  /* ---- boot text ---- */
  NERV.boot = function(el, lines, done){
    let i = 0;
    el.innerHTML = '';
    function next(){
      if(i >= lines.length){ if(done) done(); return; }
      const div = document.createElement('div');
      div.textContent = lines[i++];
      el.appendChild(div);
      blip(1500, .015, 'square', .02);
      setTimeout(next, 60 + Math.random()*90);
    }
    next();
  };

  /* A.T. field ripple at a point */
  NERV.atField = function(x, y){
    const d = document.createElement('div');
    d.className = 'atf';
    d.style.left = x + 'px'; d.style.top = y + 'px';
    const oct = '30,1 70,1 99,30 99,70 70,99 30,99 1,70 1,30';
    for(let i=0;i<3;i++){
      d.innerHTML += '<svg viewBox="0 0 100 100"><polygon points="'+oct+'" fill="none" stroke="currentColor" stroke-width="4"/></svg>';
    }
    document.body.appendChild(d);
    blip(1560, .05); setTimeout(()=>blip(1180,.05), 90);
    setTimeout(()=>d.remove(), 1000);
  };
  NERV.atFieldOn = function(el){
    const r = el.getBoundingClientRect();
    NERV.atField(r.left + r.width/2, r.top + r.height/2);
  };

  NERV.store = {
    get(k, d){ try{ const v = JSON.parse(localStorage.getItem('nerv-'+k)); return v===null||v===undefined?d:v; }catch(e){ return d; } },
    set(k, v){ localStorage.setItem('nerv-'+k, JSON.stringify(v)); }
  };
})();
