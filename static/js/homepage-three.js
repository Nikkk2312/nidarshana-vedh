/* ============================================
   NAVAGRAHA TRANSIT MAP — Geocentric · Elliptical
   Sidereal positions — computed live from date
   ============================================ */

(function () {
  'use strict';

  var canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;
  var isMobile = window.innerWidth < 768;

  /* ── Navagraha Data ─────────────────────────── */
  var navagrahas = [
    {
      name:'Surya', nameEn:'Sun', symbol:'☉',
      sign:'Meena', signEn:'Pisces', degree:7, longitude:337,
      nakshatra:'Uttara Bhadrapada', pada:2, nkRuler:'Saturn', nkDeity:'Ahir Budhnya',
      signify:'Soul · Authority · Father · Vitality · Government',
      nature:'Malefic (Krura) · Hot · Dry · Masculine', element:'Fire (Agni Tattva)',
      gemstone:'Ruby (Manikya)', day:'Sunday (Ravivaar)', deity:'Lord Surya / Aditya',
      transitIn:'Mar 15', transitOut:'Apr 14',
      status:'', dignityNote:'Friendly sign (Jupiter-ruled Pisces)',
      yogas:'Conjunct Saturn (causing Shani combustion) & exalted Venus — powerful stellium in Pisces',
      transit:'Sun in Pisces — spiritual reflection, surrender of ego before the solar new year in Aries. The soul seeks stillness.',
      color:0xFFAA33, orbit:1.8, size:0.18, texType:'sun'
    },
    {
      name:'Chandra', nameEn:'Moon', symbol:'☽',
      sign:'Mesha', signEn:'Aries', degree:17, longitude:17,
      nakshatra:'Bharani', pada:2, nkRuler:'Venus', nkDeity:'Yama (God of Death)',
      signify:'Mind · Emotions · Mother · Nourishment · Intuition',
      nature:'Benefic · Cool · Moist · Feminine', element:'Water (Jala Tattva)',
      gemstone:'Pearl (Moti)', day:'Monday (Somvaar)', deity:'Lord Shiva / Chandra Dev',
      transitIn:'Mar 21', transitOut:'Mar 23',
      status:'', dignityNote:'Friendly sign · Fast transit (~2.25 days per sign)',
      yogas:'',
      transit:'Moon in Bharani — emotionally intense, themes of transformation. Yama nakshatra demands confronting what must end to begin anew.',
      color:0xE8DCC8, orbit:0.85, size:0.07, texType:'moon'
    },
    {
      name:'Budha', nameEn:'Mercury', symbol:'☿',
      sign:'Kumbha', signEn:'Aquarius', degree:9, longitude:309,
      nakshatra:'Shatabhisha', pada:1, nkRuler:'Rahu', nkDeity:'Varuna',
      signify:'Intelligence · Speech · Commerce · Logic · Adaptability',
      nature:'Dual-natured · Adopts nature of conjunct planets', element:'Earth (Prithvi Tattva)',
      gemstone:'Emerald (Panna)', day:'Wednesday (Budhvaar)', deity:'Lord Vishnu',
      transitIn:'Feb 3', transitOut:'Apr 11',
      status:'Stationed Direct ⟳\nWas retrograde Feb 26 – Mar 20',
      dignityNote:'Friendly sign (Saturn-ruled) · Extended stay due to retrograde',
      yogas:'Budh-Rahu conjunction — unconventional intellect, risk of miscommunication\nTriple conjunction with Mars + Rahu — volatile mental energy',
      transit:'Mercury just stationed direct. Barely moving, regathering strength. In Rahu\'s nakshatra Shatabhisha — healing through unconventional knowledge.',
      color:0x5A8A6C, orbit:1.3, size:0.045, texType:'mercury'
    },
    {
      name:'Shukra', nameEn:'Venus', symbol:'♀',
      sign:'Meena', signEn:'Pisces', degree:25, longitude:355,
      nakshatra:'Revati', pada:3, nkRuler:'Mercury', nkDeity:'Pushan (Nourisher)',
      signify:'Love · Beauty · Marriage · Arts · Luxury · Creativity',
      nature:'Benefic (Saumya) · Cool · Moist · Feminine', element:'Water (Jala Tattva)',
      gemstone:'Diamond (Heera)', day:'Friday (Shukravaar)', deity:'Goddess Lakshmi',
      transitIn:'Mar 2', transitOut:'Mar 26',
      status:'EXALTED ✦ Near peak exaltation (27° Pisces)',
      dignityNote:'Sign of exaltation — Venus at absolute peak power',
      yogas:'Shukra-Shani yoga — exalted love meets karmic discipline\nSun-Venus-Saturn stellium in Pisces',
      transit:'Venus at near-peak exaltation in Pisces — the most auspicious Venus placement possible. Devotion, art, and unconditional love reach their zenith.',
      color:0xF0E6D0, orbit:2.2, size:0.06, texType:'venus', special:'Exalted ✦'
    },
    {
      name:'Mangal', nameEn:'Mars', symbol:'♂',
      sign:'Kumbha', signEn:'Aquarius', degree:21, longitude:321,
      nakshatra:'Purva Bhadrapada', pada:1, nkRuler:'Jupiter', nkDeity:'Aja Ekapada',
      signify:'Energy · Courage · Siblings · Property · Warfare · Ambition',
      nature:'Malefic (Krura) · Hot · Dry · Masculine', element:'Fire (Agni Tattva)',
      gemstone:'Red Coral (Moonga)', day:'Tuesday (Mangalvaar)', deity:'Lord Hanuman',
      transitIn:'Feb 23', transitOut:'Apr 2',
      status:'', dignityNote:'Neutral sign (Saturn-ruled, slightly unfriendly for Mars)',
      yogas:'ANGARAK YOGA ⚠ Mars-Rahu conjunction — amplified aggression, sudden events\nIn Jupiter\'s nakshatra — aggression channeled through wisdom',
      transit:'Mars + Rahu = Angarak Yoga in Aquarius — volatile, transformative. Revolutionary energy demanding an outlet. Technology and reform favored.',
      color:0xCC3322, orbit:2.8, size:0.06, texType:'mars'
    },
    {
      name:'Guru', nameEn:'Jupiter', symbol:'♃',
      sign:'Mithuna', signEn:'Gemini', degree:20, longitude:80,
      nakshatra:'Punarvasu', pada:1, nkRuler:'Jupiter', nkDeity:'Aditi (Mother of Gods)',
      signify:'Wisdom · Expansion · Children · Fortune · Dharma · Teaching',
      nature:'Benefic (Saumya) · Hot · Moist · Masculine', element:'Ether (Akasha Tattva)',
      gemstone:'Yellow Sapphire (Pukhraj)', day:'Thursday (Guruvaar)', deity:'Lord Brihaspati',
      transitIn:'Dec 5, 2025', transitOut:'Jun 2, 2026',
      status:'Stationed Direct ⟳\nWas retrograde Nov 11 – Mar 10',
      dignityNote:'Enemy sign (Mercury-ruled) · Own nakshatra gives partial strength',
      yogas:'Jupiter in own nakshatra Punarvasu — self-strengthening despite sign weakness\nNext: enters Cancer (exaltation) Jun 2 — once-in-12-years event',
      transit:'Jupiter direct in Punarvasu — wisdom "returning again" (literal meaning). Intellectual growth resuming after 4-month introspective retrograde.',
      color:0xE0C564, orbit:3.5, size:0.11, texType:'jupiter'
    },
    {
      name:'Shani', nameEn:'Saturn', symbol:'♄',
      sign:'Meena', signEn:'Pisces', degree:4, longitude:334,
      nakshatra:'Uttara Bhadrapada', pada:1, nkRuler:'Saturn', nkDeity:'Ahir Budhnya',
      signify:'Karma · Discipline · Longevity · Delays · Detachment · Justice',
      nature:'Malefic (Krura) · Cold · Dry · Neutral', element:'Air (Vayu Tattva)',
      gemstone:'Blue Sapphire (Neelam)', day:'Saturday (Shanivaar)', deity:'Shani Dev / Kaal Bhairav',
      transitIn:'Mar 29, 2025', transitOut:'Jun 3, 2027',
      status:'COMBUST ☀ Within Sun\'s orb (Mar 7 – Apr 13)',
      dignityNote:'Neutral sign · Own nakshatra · Long 2-year transit through Pisces',
      yogas:'Combust by Sun — karmic lessons temporarily obscured by ego\nConjunct exalted Venus — karmic relationships, financial discipline',
      transit:'Saturn combust in own nakshatra — the karmic teacher is hidden but still working. Dissolution of old structures across 2025-2027. Deep spiritual discipline required.',
      color:0x556677, orbit:4.0, size:0.09, texType:'saturn'
    },
    {
      name:'Rahu', nameEn:'North Node', symbol:'☊',
      sign:'Kumbha', signEn:'Aquarius', degree:16, longitude:316,
      nakshatra:'Shatabhisha', pada:3, nkRuler:'Rahu', nkDeity:'Varuna (God of Oceans)',
      signify:'Obsession · Foreign · Technology · Illusion · Ambition · Unconventional',
      nature:'Malefic · Shadow Planet (Chhaya Graha)', element:'Vayu (Air)',
      gemstone:'Hessonite Garnet (Gomed)', day:'Saturday', deity:'Goddess Durga',
      transitIn:'May 29, 2025', transitOut:'Nov 25, 2026',
      status:'Always Retrograde ⟲\nOwn sign + Own nakshatra = Maximum power',
      dignityNote:'Exceptionally powerful — co-ruler of Aquarius + own nakshatra Shatabhisha',
      yogas:'Angarak Yoga with Mars · Budh-Rahu conjunction\nTriple conjunction (Mars-Mercury-Rahu) — volatile, transformative axis',
      transit:'Rahu in own sign + own nakshatra = peak Rahu intensity. AI, technology, disruption, foreign connections, and breaking all conventions amplified to maximum.',
      color:0x7755AA, orbit:4.6, size:0.065, texType:'rahu', isShadow:true
    },
    {
      name:'Ketu', nameEn:'South Node', symbol:'☋',
      sign:'Simha', signEn:'Leo', degree:16, longitude:136,
      nakshatra:'Purva Phalguni', pada:1, nkRuler:'Venus', nkDeity:'Bhaga (God of Fortune)',
      signify:'Liberation · Spirituality · Past Lives · Detachment · Moksha',
      nature:'Malefic · Shadow Planet (Chhaya Graha)', element:'Agni (Fire)',
      gemstone:"Cat's Eye (Lehsunia)", day:'Tuesday', deity:'Lord Ganesha',
      transitIn:'May 29, 2025', transitOut:'Nov 25, 2026',
      status:'Always Retrograde ⟲\nPurva Phalguni Nakshatra (Venus-ruled)',
      dignityNote:'Sun-ruled sign — detachment from ego, authority, and worldly recognition',
      yogas:'Ketu alone in Leo — solitary spiritual force, no conjunctions\nOpposite Rahu: the Aquarius-Leo karmic axis is fully activated',
      transit:'Ketu dissolving ego in Leo — past-life leadership karma surfaces. What you once commanded, you must now release. Spiritual breakthroughs through surrender of pride.',
      color:0xAA8855, orbit:4.6, size:0.065, texType:'ketu', isShadow:true
    }
  ];

  /* ── Live Transit Update ──────────────────────── */
  // Map English planet names to navagraha array indices
  var PLANET_IDX = { Sun:0, Moon:1, Mercury:2, Venus:3, Mars:4, Jupiter:5, Saturn:6, Rahu:7, Ketu:8 };
  var _transitMonthYear = null;
  try {
    if (typeof TransitCalc !== 'undefined') {
      var transitData = TransitCalc.compute();
      _transitMonthYear = transitData.monthYear;
      var pos = transitData.positions;
      Object.keys(PLANET_IDX).forEach(function(name) {
        var idx = PLANET_IDX[name];
        var p = pos[name];
        if (!p) return;
        var d = navagrahas[idx];
        d.sign = p.sign;
        d.signEn = p.signEn;
        d.degree = p.degree;
        d.longitude = p.longitude;
        d.nakshatra = p.nakshatra;
        d.pada = p.pada;
        d.nkRuler = p.nkRuler;
        d.nkDeity = p.nkDeity;
        d.transitIn = p.transitIn;
        d.transitOut = p.transitOut;
        d.status = p.status;
        d.dignityNote = p.dignityNote;
        d.yogas = p.yogas;
        d.transit = p.transit;
        if (p.special) d.special = p.special;
        else delete d.special;
      });
      // Update subtitle
      var subtitle = document.querySelector('.hero-solar-title p');
      if (subtitle) subtitle.textContent = 'Live sidereal positions \u00b7 ' + transitData.monthYear + ' \u00b7 Hover to explore';
    }
  } catch (e) {
    // Fallback: keep hardcoded March 2026 data
    if (typeof console !== 'undefined') console.warn('TransitCalc error, using fallback data:', e);
  }
  var _transitMonth = _transitMonthYear || 'March 2026';

  /* ── Earth data for tooltip ──────────────────── */
  var earthData = {
    name:'Prithvi', nameEn:'Earth', symbol:'🜨',
    sign:'Centre', signEn:'Observer', degree:'—', longitude:0,
    nakshatra:'—', pada:'—', nkRuler:'—', nkDeity:'—',
    signify:'The Observer · Life · Consciousness · Karma\'s Stage · The Self',
    nature:'The reference point of all Jyotish calculations', element:'Pancha Tattva (All five)',
    gemstone:'—', day:'Every day', deity:'Bhumi Devi / Prithvi Mata',
    transitIn:'—', transitOut:'—',
    status:'GEOCENTRIC CENTRE\nAll planetary effects are measured from here',
    dignityNote:'In Jyotish, Earth is the observer — not a planet but the stage on which karmic forces play out. Every Dasha, every transit, every yoga is calculated from your position on this ground.',
    yogas:'',
    transit:'You are here. The cosmos revolves around the observer. Every chart is drawn from the moment and place of your birth on this Earth.',
    color:0x4488BB,
    isEarth:true
  };

  /* ── Rashis with details ────────────────────── */
  var rashis = [
    { sym:'♈', name:'Mesha', en:'Aries', start:0, ruler:'Mars', element:'Fire', quality:'Movable (Chara)', desc:'Initiative · Leadership · New beginnings' },
    { sym:'♉', name:'Vrishabha', en:'Taurus', start:30, ruler:'Venus', element:'Earth', quality:'Fixed (Sthira)', desc:'Stability · Wealth · Sensuality' },
    { sym:'♊', name:'Mithuna', en:'Gemini', start:60, ruler:'Mercury', element:'Air', quality:'Dual (Dvisvabhava)', desc:'Communication · Duality · Intellect' },
    { sym:'♋', name:'Karka', en:'Cancer', start:90, ruler:'Moon', element:'Water', quality:'Movable (Chara)', desc:'Nurturing · Emotion · Home' },
    { sym:'♌', name:'Simha', en:'Leo', start:120, ruler:'Sun', element:'Fire', quality:'Fixed (Sthira)', desc:'Authority · Creativity · Self-expression' },
    { sym:'♍', name:'Kanya', en:'Virgo', start:150, ruler:'Mercury', element:'Earth', quality:'Dual (Dvisvabhava)', desc:'Analysis · Service · Precision' },
    { sym:'♎', name:'Tula', en:'Libra', start:180, ruler:'Venus', element:'Air', quality:'Movable (Chara)', desc:'Balance · Relationships · Justice' },
    { sym:'♏', name:'Vrischika', en:'Scorpio', start:210, ruler:'Mars', element:'Water', quality:'Fixed (Sthira)', desc:'Transformation · Mystery · Depth' },
    { sym:'♐', name:'Dhanu', en:'Sagittarius', start:240, ruler:'Jupiter', element:'Fire', quality:'Dual (Dvisvabhava)', desc:'Wisdom · Expansion · Dharma' },
    { sym:'♑', name:'Makara', en:'Capricorn', start:270, ruler:'Saturn', element:'Earth', quality:'Movable (Chara)', desc:'Discipline · Ambition · Structure' },
    { sym:'♒', name:'Kumbha', en:'Aquarius', start:300, ruler:'Saturn', element:'Air', quality:'Fixed (Sthira)', desc:'Innovation · Humanitarianism · Detachment' },
    { sym:'♓', name:'Meena', en:'Pisces', start:330, ruler:'Jupiter', element:'Water', quality:'Dual (Dvisvabhava)', desc:'Spirituality · Surrender · Compassion' }
  ];

  /* ── Ellipse geometry — more symmetrical ─────── */
  var EX = 1.0, EZ = 0.55;
  function ePos(angle, r) { return { x: Math.cos(angle)*r*EX, z: Math.sin(angle)*r*EZ }; }

  /* ── Scene ──────────────────────────────────── */
  var scene = new THREE.Scene();

  // Use OrthographicCamera-like perspective to prevent zoom distortion
  var cam = new THREE.PerspectiveCamera(38, canvas.clientWidth/canvas.clientHeight, 0.1, 1000);
  cam.position.set(0, 6.5, 9.5);
  cam.lookAt(0, -0.5, 0);

  var renderer = new THREE.WebGLRenderer({ canvas:canvas, antialias:true, alpha:true });
  renderer.setClearColor(0x000000, 0);

  /* ── Textures ──────────────────────────────── */
  function planetTex(type) {
    var s=256, c=document.createElement('canvas'); c.width=s; c.height=s;
    var x=c.getContext('2d'), g;
    if(type==='sun'){
      g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
      g.addColorStop(0,'#FFFFFF'); g.addColorStop(0.1,'#FFEE88'); g.addColorStop(0.28,'#FFAA33');
      g.addColorStop(0.5,'#DD7711'); g.addColorStop(0.78,'#AA4400'); g.addColorStop(1,'#662200');
      x.fillStyle=g; x.fillRect(0,0,s,s);
      for(var i=0;i<500;i++){x.beginPath();x.arc(Math.random()*s,Math.random()*s,Math.random()*6+1,0,Math.PI*2);
        x.fillStyle=Math.random()>0.5?'rgba(255,220,80,'+(Math.random()*0.3)+')':'rgba(200,80,0,'+(Math.random()*0.22)+')';x.fill();}
    } else if(type==='moon'){
      g=x.createRadialGradient(s*0.38,s*0.36,0,s/2,s/2,s/2);
      g.addColorStop(0,'#FAF5ED'); g.addColorStop(0.45,'#D8D0C0'); g.addColorStop(1,'#A09080');
      x.fillStyle=g; x.fillRect(0,0,s,s);
      for(var j=0;j<30;j++){var cr=Math.random()*14+3;x.beginPath();x.arc(Math.random()*s,Math.random()*s,cr,0,Math.PI*2);
        x.fillStyle='rgba(110,100,85,'+(Math.random()*0.3+0.08)+')';x.fill();}
    } else if(type==='mercury'){
      g=x.createRadialGradient(s*0.4,s*0.4,0,s/2,s/2,s/2);
      g.addColorStop(0,'#8ABB8C'); g.addColorStop(0.5,'#5A8A6C'); g.addColorStop(1,'#3A5A4C');
      x.fillStyle=g; x.fillRect(0,0,s,s);
      for(var k=0;k<35;k++){x.beginPath();x.arc(Math.random()*s,Math.random()*s,Math.random()*5+1,0,Math.PI*2);
        x.fillStyle='rgba(40,60,40,'+(Math.random()*0.22)+')';x.fill();}
    } else if(type==='venus'){
      g=x.createRadialGradient(s*0.4,s*0.35,0,s/2,s/2,s/2);
      g.addColorStop(0,'#FFFFF5'); g.addColorStop(0.35,'#F5ECD8'); g.addColorStop(0.7,'#D4C4A8'); g.addColorStop(1,'#B0A080');
      x.fillStyle=g; x.fillRect(0,0,s,s);
      for(var m=0;m<20;m++){x.beginPath();x.ellipse(Math.random()*s,Math.random()*s,Math.random()*22+6,Math.random()*5+2,Math.random()*Math.PI,0,Math.PI*2);
        x.fillStyle='rgba(255,255,245,'+(Math.random()*0.14)+')';x.fill();}
    } else if(type==='mars'){
      g=x.createRadialGradient(s*0.42,s*0.4,0,s/2,s/2,s/2);
      g.addColorStop(0,'#DD6644'); g.addColorStop(0.45,'#BB4422'); g.addColorStop(1,'#882211');
      x.fillStyle=g; x.fillRect(0,0,s,s);
      for(var n=0;n<50;n++){x.beginPath();x.arc(Math.random()*s,Math.random()*s,Math.random()*7+2,0,Math.PI*2);
        x.fillStyle='rgba(100,30,10,'+(Math.random()*0.22)+')';x.fill();}
    } else if(type==='jupiter'){
      for(var b=0;b<s;b+=2){var bv=Math.sin(b*0.052)*0.3+0.5;
        x.fillStyle='rgb('+Math.floor(220*bv+35)+','+Math.floor(190*bv+25)+','+Math.floor(80*bv+25)+')';x.fillRect(0,b,s,2);}
      x.beginPath();x.ellipse(s*0.58,s*0.52,24,14,0.12,0,Math.PI*2);x.fillStyle='rgba(180,120,50,0.35)';x.fill();
    } else if(type==='saturn'){
      for(var sb=0;sb<s;sb+=2){var sv=Math.sin(sb*0.042)*0.3+0.38;
        x.fillStyle='rgb('+Math.floor(85*sv+35)+','+Math.floor(100*sv+40)+','+Math.floor(120*sv+50)+')';x.fillRect(0,sb,s,2);}
    }
    return new THREE.CanvasTexture(c);
  }

  function glowTex(a) {
    var s=256,c=document.createElement('canvas');c.width=s;c.height=s;var x=c.getContext('2d');
    var g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
    g.addColorStop(0,'rgba(255,255,255,'+a+')'); g.addColorStop(0.15,'rgba(255,255,255,'+(a*0.45)+')');
    g.addColorStop(0.4,'rgba(255,255,255,'+(a*0.08)+')'); g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=g;x.fillRect(0,0,s,s); return new THREE.CanvasTexture(c);
  }

  function smokeTex() {
    var s=256,c=document.createElement('canvas');c.width=s;c.height=s;var x=c.getContext('2d');
    for(var i=0;i<30;i++){
      var g=x.createRadialGradient(s/2+Math.random()*60-30,s/2+Math.random()*60-30,0,s/2,s/2,s/2*(0.4+Math.random()*0.4));
      g.addColorStop(0,'rgba(255,255,255,'+(0.15+Math.random()*0.15)+')');
      g.addColorStop(0.5,'rgba(255,255,255,'+(0.03+Math.random()*0.05)+')');
      g.addColorStop(1,'rgba(255,255,255,0)');
      x.fillStyle=g;x.fillRect(0,0,s,s);
    }
    return new THREE.CanvasTexture(c);
  }

  var gBright=glowTex(1.0), gSoft=glowTex(0.55), smokeMap=smokeTex();

  /* ── Stars ─────────────────────────────────── */
  var SC=isMobile?400:1400, sG=new THREE.BufferGeometry(), sP=new Float32Array(SC*3), sCl=new Float32Array(SC*3);
  var gP=[[0.77,0.60,0.17],[0.83,0.69,0.22],[0.88,0.77,0.39],[0.93,0.88,0.80],[0.55,0.44,0.12]];
  for(var si=0;si<SC;si++){var s3=si*3;sP[s3]=(Math.random()-0.5)*50;sP[s3+1]=(Math.random()-0.5)*30;sP[s3+2]=(Math.random()-0.5)*25-10;
    var gc=gP[Math.floor(Math.random()*gP.length)];sCl[s3]=gc[0];sCl[s3+1]=gc[1];sCl[s3+2]=gc[2];}
  sG.setAttribute('position',new THREE.BufferAttribute(sP,3));
  sG.setAttribute('color',new THREE.BufferAttribute(sCl,3));
  var starMesh = new THREE.Points(sG,new THREE.PointsMaterial({size:0.03,vertexColors:true,transparent:true,opacity:0.6,sizeAttenuation:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  scene.add(starMesh);

  /* ── Solar System Group ────────────────────── */
  var sol = new THREE.Group();
  sol.rotation.x = 0.1;
  scene.add(sol);

  /* ── Earth at center ───────────────────────── */
  var earthG=new THREE.SphereGeometry(0.06,16,16);
  var earthTex = (function(){
    var s=128,c=document.createElement('canvas');c.width=s;c.height=s;var x=c.getContext('2d');
    var g=x.createRadialGradient(s*0.4,s*0.38,0,s/2,s/2,s/2);
    g.addColorStop(0,'#6BAADD');g.addColorStop(0.5,'#3377AA');g.addColorStop(1,'#1A4466');
    x.fillStyle=g;x.fillRect(0,0,s,s);
    for(var i=0;i<8;i++){x.beginPath();x.arc(Math.random()*s,Math.random()*s,Math.random()*20+8,0,Math.PI*2);
      x.fillStyle='rgba(60,140,80,'+(Math.random()*0.3+0.15)+')';x.fill();}
    return new THREE.CanvasTexture(c);
  })();
  var earthMesh = new THREE.Mesh(earthG,new THREE.MeshBasicMaterial({map:earthTex}));
  sol.add(earthMesh);
  // Earth halo
  var ehMat=new THREE.SpriteMaterial({map:gSoft,color:0x4488BB,blending:THREE.AdditiveBlending,transparent:true,opacity:0.7,depthWrite:false});
  var eh=new THREE.Sprite(ehMat);eh.scale.set(0.45,0.45,1);sol.add(eh);
  // Earth label
  (function(){var c=document.createElement('canvas');c.width=512;c.height=64;var x=c.getContext('2d');
    x.fillStyle='#68AADD';x.font='600 40px Outfit, Arial, sans-serif';x.textAlign='center';x.textBaseline='middle';
    x.fillText('🜨 Prithvi (Earth)',256,32);
    var t=new THREE.CanvasTexture(c);
    var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));
    sp.position.set(0,0.22,0);sp.scale.set(0.85,0.14,1);sol.add(sp);
  })();

  /* ── Zodiac Divisions ──────────────────────── */
  var outerR = 5.5;

  // Store rashi label world positions for hover detection
  var rashiLabels = [];

  rashis.forEach(function(r){
    var a=r.start*Math.PI/180;
    var i=ePos(a,0.3),o=ePos(a,outerR);
    var lg=new THREE.BufferGeometry();
    lg.setAttribute('position',new THREE.Float32BufferAttribute([i.x,0,i.z,o.x,0,o.z],3));
    sol.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0xC49A2C,transparent:true,opacity:0.3,depthWrite:false})));

    // Rashi label
    var ma=(r.start+15)*Math.PI/180, lp=ePos(ma, outerR+0.65);
    var lc=document.createElement('canvas');lc.width=256;lc.height=160;var lx=lc.getContext('2d');
    lx.fillStyle='#E8CC66';lx.font='bold 52px serif';lx.textAlign='center';lx.textBaseline='top';
    lx.fillText(r.sym,128,2);
    lx.fillStyle='#E0C060';lx.font='700 22px Outfit, Arial, sans-serif';
    lx.fillText(r.name,128,62);
    lx.fillStyle='#C8A850';lx.font='500 16px Outfit, Arial, sans-serif';
    lx.fillText(r.ruler+' · '+r.element,128,90);
    var lt=new THREE.CanvasTexture(lc);
    var ls=new THREE.Sprite(new THREE.SpriteMaterial({map:lt,transparent:true,depthWrite:false}));
    ls.position.set(lp.x,0,lp.z);ls.scale.set(1.4,0.85,1);sol.add(ls);

    // Store for hover detection
    rashiLabels.push({ sprite:ls, data:r });
  });

  // Outer ellipse
  (function(){var pts=[];for(var i=0;i<=256;i++){var a=(i/256)*Math.PI*2,p=ePos(a,outerR);pts.push(p.x,0,p.z);}
    var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
    sol.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:0xC49A2C,transparent:true,opacity:0.45,depthWrite:false})));
  })();

  // Orbit ellipses
  navagrahas.forEach(function(p){
    var pts=[];for(var i=0;i<=128;i++){var a=(i/128)*Math.PI*2,ep=ePos(a,p.orbit);pts.push(ep.x,0,ep.z);}
    var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
    sol.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:0xC49A2C,transparent:true,opacity:p.isShadow?0.15:0.2,depthWrite:false})));
  });

  /* ── Planet Meshes ─────────────────────────── */
  var planets = [];

  navagrahas.forEach(function(d){
    var grp = new THREE.Group();
    grp.userData = d;

    if (d.isShadow) {
      for (var si=0; si<5; si++) {
        var sMat = new THREE.SpriteMaterial({
          map: smokeMap, color: d.color,
          blending: THREE.AdditiveBlending, transparent: true,
          opacity: 0.45 + si * 0.08, depthWrite: false
        });
        var ss = new THREE.Sprite(sMat);
        var scale = d.size * (3 + si * 1.5);
        ss.scale.set(scale, scale, 1);
        ss.position.set((Math.random()-0.5)*0.03, (Math.random()-0.5)*0.03, 0);
        ss.userData = { smokeLayer: true, baseRot: Math.random()*Math.PI*2, speed: 0.15+Math.random()*0.2 };
        grp.add(ss);
      }
      var coreGeo = new THREE.SphereGeometry(d.size*0.3, 12, 12);
      var coreMat = new THREE.MeshBasicMaterial({color:d.color, transparent:true, opacity:0.85, blending:THREE.AdditiveBlending, depthWrite:false});
      grp.add(new THREE.Mesh(coreGeo, coreMat));
    } else {
      var tex = planetTex(d.texType);
      var geo = new THREE.SphereGeometry(d.size, 32, 32);
      var mat = new THREE.MeshBasicMaterial({ map:tex });
      var mesh = new THREE.Mesh(geo, mat);
      grp.add(mesh);

      var hMat = new THREE.SpriteMaterial({
        map: d.texType==='sun'?gBright:gSoft, color:d.color,
        blending:THREE.AdditiveBlending, transparent:true,
        opacity: d.texType==='sun'?0.9:0.7, depthWrite:false
      });
      var halo=new THREE.Sprite(hMat);
      var hs=d.texType==='sun'?1.4:d.size*4.5;
      halo.scale.set(hs,hs,1); grp.add(halo);

      if(d.texType==='sun'){
        var cMat=new THREE.SpriteMaterial({map:gSoft,color:0xFFCC44,blending:THREE.AdditiveBlending,transparent:true,opacity:0.25,depthWrite:false});
        var co=new THREE.Sprite(cMat);co.scale.set(2.8,2.8,1);grp.add(co);
      }
      if(d.texType==='saturn'){
        var srG=new THREE.RingGeometry(d.size*1.5,d.size*2.4,64);
        var srM=new THREE.MeshBasicMaterial({color:0x8899AA,transparent:true,opacity:0.9,side:THREE.DoubleSide,depthWrite:false});
        var sr=new THREE.Mesh(srG,srM);sr.rotation.x=Math.PI*0.35;grp.add(sr);
      }
    }

    // Position
    var a=d.longitude*Math.PI/180, ep=ePos(a,d.orbit);
    grp.position.set(ep.x, 0, ep.z);

    sol.add(grp);
    planets.push({ grp:grp, data:d });
  });

  /* ── Planet Name Labels ────────────────────── */
  planets.forEach(function(pm){
    var lc=document.createElement('canvas');lc.width=512;lc.height=64;var x=lc.getContext('2d');
    x.fillStyle=pm.data.isShadow?'#C8BEB4':'#F0E6D0';
    x.font='600 40px Outfit, Arial, sans-serif';x.textAlign='center';x.textBaseline='middle';
    x.fillText(pm.data.symbol+' '+pm.data.name,256,32);
    var t=new THREE.CanvasTexture(lc);
    var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));
    sp.position.set(0, pm.data.isShadow ? pm.data.size*2+0.15 : pm.data.size+0.16, 0);
    sp.scale.set(0.85,0.14,1); pm.grp.add(sp);
  });

  /* ── Raycaster + Tooltip ───────────────────── */
  var ray=new THREE.Raycaster(), mouse=new THREE.Vector2(-10,-10);
  var tip=document.getElementById('planet-tooltip'), hovered=null;
  var mouseClientX=0, mouseClientY=0;

  canvas.addEventListener('mousemove',function(e){
    var r=canvas.getBoundingClientRect();
    mouse.x=((e.clientX-r.left)/r.width)*2-1;
    mouse.y=-((e.clientY-r.top)/r.height)*2+1;
    mouseClientX=e.clientX; mouseClientY=e.clientY;
    if(tip){
      var tx=e.clientX+18, ty=e.clientY-10;
      if(tx+380>window.innerWidth)tx=e.clientX-380;
      if(ty+450>window.innerHeight)ty=window.innerHeight-460;
      if(ty<10)ty=10;
      tip.style.left=tx+'px';tip.style.top=ty+'px';
    }
  });
  canvas.addEventListener('mouseleave',function(){mouse.set(-10,-10);if(tip)tip.classList.remove('visible');hovered=null;document.body.style.cursor='';});

  function buildPlanetTip(d){
    var hex = d.isEarth ? '#4488BB' : '#'+d.color.toString(16).padStart(6,'0');
    var sp=d.special?'<span class="planet-special">'+d.special+'</span>':'';
    var st=d.status?'<div class="planet-status">'+d.status.replace(/\n/g,'<br>')+'</div>':'';
    var yg='';
    if(d.yogas){yg='<div class="planet-yogas">';d.yogas.split('\n').forEach(function(y){yg+='<div class="planet-yoga-item">'+y+'</div>';});yg+='</div>';}

    // For Earth, skip position/nakshatra rows
    if(d.isEarth){
      return '<div class="planet-tooltip-header">'+
        '<span class="planet-symbol" style="color:'+hex+'">'+d.symbol+'</span>'+
        '<div class="planet-tooltip-names"><span class="planet-name">'+d.name+'</span><span class="planet-name-en">'+d.nameEn+'</span></div>'+
      '</div>'+st+
      '<div class="planet-dignity">'+d.dignityNote+'</div>'+
      '<p class="planet-transit">'+d.transit+'</p>'+
      '<div class="planet-details">'+
        '<div class="planet-detail-row"><span class="planet-detail-label">Nature</span><span>'+d.nature+'</span></div>'+
        '<div class="planet-detail-row"><span class="planet-detail-label">Element</span><span>'+d.element+'</span></div>'+
        '<div class="planet-detail-row"><span class="planet-detail-label">Deity</span><span>'+d.deity+'</span></div>'+
      '</div>'+
      '<span class="planet-tooltip-hint">Geocentric reference point · Jyotish</span>';
    }

    return '<div class="planet-tooltip-header">'+
      '<span class="planet-symbol" style="color:'+hex+'">'+d.symbol+'</span>'+
      '<div class="planet-tooltip-names"><span class="planet-name">'+d.name+'</span><span class="planet-name-en">'+d.nameEn+'</span></div>'+sp+
    '</div>'+st+
    '<div class="planet-position">'+
      '<span class="planet-sign">'+d.sign+' ('+d.signEn+') '+d.degree+'°</span>'+
      '<span class="planet-transit-dates">'+d.transitIn+' → '+d.transitOut+'</span>'+
    '</div>'+
    '<div class="planet-nakshatra">'+d.nakshatra+' · Pada '+d.pada+' <span class="nk-ruler">Ruler: '+d.nkRuler+' · Deity: '+d.nkDeity+'</span></div>'+
    '<div class="planet-dignity">'+d.dignityNote+'</div>'+
    '<div class="planet-details">'+
      '<div class="planet-detail-row"><span class="planet-detail-label">Nature</span><span>'+d.nature+'</span></div>'+
      '<div class="planet-detail-row"><span class="planet-detail-label">Element</span><span>'+d.element+'</span></div>'+
      '<div class="planet-detail-row"><span class="planet-detail-label">Gemstone</span><span>'+d.gemstone+'</span></div>'+
      '<div class="planet-detail-row"><span class="planet-detail-label">Day</span><span>'+d.day+'</span></div>'+
      '<div class="planet-detail-row"><span class="planet-detail-label">Deity</span><span>'+d.deity+'</span></div>'+
    '</div>'+
    '<p class="planet-signify">'+d.signify+'</p>'+yg+
    '<p class="planet-transit">'+d.transit+'</p>'+
    '<span class="planet-tooltip-hint">Sidereal transit · ' + _transitMonth + ' · Geocentric</span>';
  }

  function buildRashiTip(r){
    // Find planets currently in this rashi
    var planetsInSign = [];
    navagrahas.forEach(function(p){
      if(p.sign === r.name || p.signEn === r.en) planetsInSign.push(p.symbol+' '+p.name);
    });
    var planetsStr = planetsInSign.length ? planetsInSign.join(', ') : 'No planets currently transiting';

    return '<div class="planet-tooltip-header">'+
      '<span class="planet-symbol" style="color:#C49A2C;font-size:2rem">'+r.sym+'</span>'+
      '<div class="planet-tooltip-names"><span class="planet-name">'+r.name+'</span><span class="planet-name-en">'+r.en+' · '+r.start+'° – '+(r.start+30)+'°</span></div>'+
    '</div>'+
    '<div class="planet-details" style="margin-top:0.5rem">'+
      '<div class="planet-detail-row"><span class="planet-detail-label">Ruler</span><span>'+r.ruler+'</span></div>'+
      '<div class="planet-detail-row"><span class="planet-detail-label">Element</span><span>'+r.element+'</span></div>'+
      '<div class="planet-detail-row"><span class="planet-detail-label">Quality</span><span>'+r.quality+'</span></div>'+
      '<div class="planet-detail-row"><span class="planet-detail-label">Signifies</span><span>'+r.desc+'</span></div>'+
    '</div>'+
    '<div class="planet-dignity" style="margin-top:0.4rem">Current transits: '+planetsStr+'</div>'+
    '<span class="planet-tooltip-hint">Sidereal zodiac · Nirayana</span>';
  }

  function checkHover(){
    ray.setFromCamera(mouse,cam);

    // Check Earth first
    var earthWp=new THREE.Vector3();
    earthMesh.getWorldPosition(earthWp);
    var earthDist=ray.ray.distanceToPoint(earthWp);
    if(earthDist<0.3){
      if(hovered!=='earth'){
        hovered='earth';
        if(tip){tip.innerHTML=buildPlanetTip(earthData);tip.classList.add('visible');}
        document.body.style.cursor='pointer';
      }
      return;
    }

    // Check planets
    var closest=null, cd=Infinity;
    planets.forEach(function(pm){
      var wp=new THREE.Vector3(); pm.grp.getWorldPosition(wp);
      var dist=ray.ray.distanceToPoint(wp);
      var th=pm.data.isShadow?pm.data.size*6:Math.max(pm.data.size*4.5,0.28);
      if(dist<th&&dist<cd){cd=dist;closest=pm;}
    });
    if(closest){
      if(hovered!==closest){
        hovered=closest;
        if(tip){tip.innerHTML=buildPlanetTip(closest.data);tip.classList.add('visible');}
        document.body.style.cursor='pointer';
      }
      return;
    }

    // Check zodiac labels
    var closestRashi=null, crd=Infinity;
    rashiLabels.forEach(function(rl){
      var wp=new THREE.Vector3(); rl.sprite.getWorldPosition(wp);
      var dist=ray.ray.distanceToPoint(wp);
      if(dist<0.4&&dist<crd){crd=dist;closestRashi=rl;}
    });
    if(closestRashi){
      if(hovered!==closestRashi){
        hovered=closestRashi;
        if(tip){tip.innerHTML=buildRashiTip(closestRashi.data);tip.classList.add('visible');}
        document.body.style.cursor='pointer';
      }
      return;
    }

    // Nothing hovered
    if(hovered){
      hovered=null;if(tip)tip.classList.remove('visible');document.body.style.cursor='';
    }
  }

  /* ── Mouse Parallax (camera-based, no sol rotation) ── */
  var mX=0,mY=0,tX=0,tY=0;
  var baseCamX=0, baseCamZ=9.5, baseCamY=6.5;
  document.addEventListener('mousemove',function(e){tX=(e.clientX/window.innerWidth-0.5)*2;tY=(e.clientY/window.innerHeight-0.5)*2;});

  /* ── Animation ─────────────────────────────── */
  var clock=new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    var t=clock.getElapsedTime();
    mX+=(tX-mX)*0.015; mY+=(tY-mY)*0.015;

    // Subtle camera sway instead of rotating sol — keeps ellipse shape stable
    cam.position.x = baseCamX + mX * 0.4;
    cam.position.y = baseCamY + mY * 0.15;
    cam.lookAt(0, -0.5, 0);

    planets.forEach(function(pm,i){
      if(pm.data.isShadow){
        pm.grp.children.forEach(function(child){
          if(child.userData&&child.userData.smokeLayer){
            child.material.rotation=t*child.userData.speed+child.userData.baseRot;
            child.material.opacity=0.4+Math.sin(t*0.8+child.userData.baseRot)*0.12;
          }
        });
      } else {
        if(pm.grp.children[0]&&pm.grp.children[0].rotation) pm.grp.children[0].rotation.y=t*(0.12+i*0.03);
        if(pm.data.texType==='sun'){var p=1+Math.sin(t*0.8)*0.012;pm.grp.scale.set(p,p,p);}
      }
      pm.grp.position.y=Math.sin(t*0.3+i*1.2)*0.01;
    });

    // Gentle Earth rotation
    earthMesh.rotation.y=t*0.05;

    starMesh.rotation.y=t*0.003+mX*0.02;
    checkHover();
    renderer.render(scene,cam);
  }
  animate();

  /* ── Resize — stays sharp at any browser zoom level ── */
  function onResize(){
    // clientWidth/Height give CSS pixel dimensions
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if(w===0||h===0) return;

    cam.aspect = w / h;

    // Adjust camera distance based on aspect ratio
    if(w/h > 1.6) {
      baseCamY = 6.0; baseCamZ = 8.5; cam.fov = 38;
    } else if(w/h > 1.2) {
      baseCamY = 6.5; baseCamZ = 9.5; cam.fov = 38;
    } else if(w/h > 0.8) {
      baseCamY = 8.0; baseCamZ = 11.5; cam.fov = 36;
    } else {
      baseCamY = 9.5; baseCamZ = 13.5; cam.fov = 34;
    }
    cam.position.set(baseCamX, baseCamY, baseCamZ);
    cam.lookAt(0, -0.5, 0);
    cam.updateProjectionMatrix();

    // Let Three.js handle buffer sizing — setPixelRatio uses devicePixelRatio
    // which changes on browser zoom, so the buffer scales up automatically
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h, false);
  }

  window.addEventListener('resize', onResize);
  // Initial sizing
  onResize();

  var hero=document.querySelector('.hero-cosmic');
  if(hero){new IntersectionObserver(function(e){if(!e[0].isIntersecting)clock.stop();else clock.start();},{threshold:0}).observe(hero);}
})();
