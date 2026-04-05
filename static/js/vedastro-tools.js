// ===== VedAstro Tools | Nidarshana Vedh =====
var API = 'https://api.vedastro.org/api/Calculate';
var NOM = 'https://nominatim.openstreetmap.org/search';

var SIGNS_ORDER = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
var SIGN_ABBR = {Aries:'Ar',Taurus:'Ta',Gemini:'Ge',Cancer:'Cn',Leo:'Le',Virgo:'Vi',Libra:'Li',Scorpio:'Sc',Sagittarius:'Sg',Capricorn:'Cp',Aquarius:'Aq',Pisces:'Pi'};
var PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
var HOUSE_NAMES = ['1st (Lagna)','2nd (Dhana)','3rd (Sahaja)','4th (Sukha)','5th (Putra)','6th (Shatru)','7th (Kalatra)','8th (Ayu)','9th (Dharma)','10th (Karma)','11th (Labha)','12th (Vyaya)'];
var KARAKA_NAMES = ['AK','AmK','BK','MK','PuK','GK','DK','PiK'];
var KARAKA_FULL = {AK:'Atmakaraka (Soul)',AmK:'Amatyakaraka (Career)',BK:'Bhratrukaraka (Siblings)',MK:'Matrukaraka (Mother)',PuK:'Putrakaraka (Children)',GK:'Gnatikaraka (Obstacles)',DK:'Darakaraka (Spouse)',PiK:'Pitrukaraka (Father)'};
var SIGN_RULER = {Aries:'Mars',Taurus:'Venus',Gemini:'Mercury',Cancer:'Moon',Leo:'Sun',Virgo:'Mercury',Libra:'Venus',Scorpio:'Mars',Sagittarius:'Jupiter',Capricorn:'Saturn',Aquarius:'Saturn',Pisces:'Jupiter'};

// Planet info: abbreviation, English name, Hindi name
var PLANET_INFO = {
  Sun:{ab:'Su',en:'Sun',hi:'सूर्य (Surya)'},
  Moon:{ab:'Mo',en:'Moon',hi:'चन्द्र (Chandra)'},
  Mars:{ab:'Ma',en:'Mars',hi:'मंगल (Mangal)'},
  Mercury:{ab:'Me',en:'Mercury',hi:'बुध (Budh)'},
  Jupiter:{ab:'Ju',en:'Jupiter',hi:'बृहस्पति (Brihaspati)'},
  Venus:{ab:'Ve',en:'Venus',hi:'शुक्र (Shukra)'},
  Saturn:{ab:'Sa',en:'Saturn',hi:'शनि (Shani)'},
  Rahu:{ab:'Ra',en:'Rahu',hi:'राहु (Rahu)'},
  Ketu:{ab:'Ke',en:'Ketu',hi:'केतु (Ketu)'},
  Gulika:{ab:'Gu',en:'Gulika',hi:'गुलिक'},
  Maandi:{ab:'Md',en:'Maandi',hi:'माण्डी'},
  Dhuma:{ab:'Dh',en:'Dhuma',hi:'धूम'},
  Vyatipaata:{ab:'Vy',en:'Vyatipaata',hi:'व्यतीपात'},
  Parivesha:{ab:'Pv',en:'Parivesha',hi:'परिवेश'},
  Indrachaapa:{ab:'Ic',en:'Indrachaapa',hi:'इन्द्रचाप'},
  Upaketu:{ab:'Uk',en:'Upaketu',hi:'उपकेतु'},
  Kaala:{ab:'Ka',en:'Kaala',hi:'काल'},
  Mrityu:{ab:'Mr',en:'Mrityu',hi:'मृत्यु'},
  Arthaprahaara:{ab:'Ap',en:'Arthaprahaara',hi:'अर्थप्रहार'},
  Yamaghantaka:{ab:'Yg',en:'Yamaghantaka',hi:'यमघण्टक'}
};

// Upagrahas (sub-planets) - API names
var UPAGRAHAS = ['Gulika','Maandi','Dhuma','Vyatipaata','Parivesha','Indrachaapa','Upaketu','Kaala','Mrityu','Arthaprahaara','Yamaghantaka'];

var SUP = {'0':'\u2070','1':'\u00B9','2':'\u00B2','3':'\u00B3','4':'\u2074','5':'\u2075','6':'\u2076','7':'\u2077','8':'\u2078','9':'\u2079'};
function toSup(n){return String(n).split('').map(function(c){return SUP[c]||c;}).join('');}

var chartMeta = {};
var birthEp = ''; // stored for subsequent dasha drill-down calls

// ===== GRAHA DRISHTI (Planetary Aspects) =====
// Classical Vedic: all planets aspect 7th. Special aspects:
// Mars: 4th, 7th, 8th | Jupiter: 5th, 7th, 9th | Saturn: 3rd, 7th, 10th
// Rahu/Ketu: 5th, 7th, 9th
// Upagrahas inherit parent planet's aspects:
// Gulika/Maandi (Saturn): 3rd,7th,10th | Yamaghantaka (Jupiter): 5th,7th,9th
// Mrityu (Mars): 4th,7th,8th | Kaala (Sun): 7th | Arthaprahaara (Mercury): 7th
// Others: no aspects
var ASPECT_OFFSETS = {
  Mars:[3,6,7],Jupiter:[4,6,8],Saturn:[2,6,9],Rahu:[4,6,8],Ketu:[4,6,8],
  Gulika:[2,6,9],Maandi:[2,6,9],Yamaghantaka:[4,6,8],
  Mrityu:[3,6,7],Kaala:[6],Arthaprahaara:[6]
};
var NO_ASPECT_UPAGRAHAS = ['Dhuma','Vyatipaata','Parivesha','Indrachaapa','Upaketu'];
function getAspectHouses(name,houseIdx){
  if(NO_ASPECT_UPAGRAHAS.indexOf(name)!==-1)return [];
  var offsets=ASPECT_OFFSETS[name]||[6];
  return offsets.map(function(o){return (houseIdx+o)%12;});
}


// ===== INIT =====
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('[id$="-day"]').forEach(function(s){for(var i=1;i<=31;i++){var o=document.createElement('option');o.value=String(i).padStart(2,'0');o.textContent=i;s.appendChild(o);}});
  document.querySelectorAll('[id$="-year"]').forEach(function(s){var y=new Date().getFullYear();for(var i=y;i>=1920;i--){var o=document.createElement('option');o.value=i;o.textContent=i;s.appendChild(o);}});
  document.querySelectorAll('[id$="-hour"]').forEach(function(s){for(var i=1;i<=12;i++){var o=document.createElement('option');o.value=i;o.textContent=i;s.appendChild(o);}});
  document.querySelectorAll('[id$="-minute"]').forEach(function(s){for(var i=0;i<=59;i++){var o=document.createElement('option');o.value=String(i).padStart(2,'0');o.textContent=String(i).padStart(2,'0');s.appendChild(o);}});
  ['bc-place','male-place','female-place'].forEach(initPlaceAC);
});

// ===== PLACE AUTOCOMPLETE =====
function initPlaceAC(id){
  var inp=document.getElementById(id),sug=document.getElementById(id+'-suggestions');
  if(!inp||!sug)return;
  var timer=null;
  inp.addEventListener('input',function(){
    clearTimeout(timer);
    if(inp.value.trim().length<3){sug.innerHTML='';sug.style.display='none';return;}
    timer=setTimeout(function(){fetchPlaces(inp,sug);},350);
  });
  document.addEventListener('click',function(e){if(!inp.contains(e.target)&&!sug.contains(e.target))sug.style.display='none';});
  inp.addEventListener('keydown',function(e){
    var items=sug.querySelectorAll('.place-suggestion-item'),act=sug.querySelector('.active'),idx=Array.from(items).indexOf(act);
    if(e.key==='ArrowDown'){e.preventDefault();if(act)act.classList.remove('active');idx=(idx+1)%items.length;items[idx].classList.add('active');}
    else if(e.key==='ArrowUp'){e.preventDefault();if(act)act.classList.remove('active');idx=idx<=0?items.length-1:idx-1;items[idx].classList.add('active');}
    else if(e.key==='Enter'&&act){e.preventDefault();act.click();}
    else if(e.key==='Escape')sug.style.display='none';
  });
}
async function fetchPlaces(inp,sug){
  try{
    var r=await fetch(NOM+'?q='+encodeURIComponent(inp.value.trim())+'&format=json&addressdetails=1&limit=6&accept-language=en',{headers:{'User-Agent':'NidarshanaVedh/1.0'}});
    var data=await r.json();
    if(!data.length){sug.innerHTML='<div class="place-suggestion-empty">No places found</div>';sug.style.display='block';return;}
    sug.innerHTML=data.map(function(d){return '<div class="place-suggestion-item" data-lat="'+d.lat+'" data-lon="'+d.lon+'" data-name="'+d.display_name.replace(/"/g,'&quot;')+'"><span class="place-suggestion-name">'+d.display_name+'</span></div>';}).join('');
    sug.style.display='block';
    sug.querySelectorAll('.place-suggestion-item').forEach(function(item){item.addEventListener('click',function(){selectPlace(inp,item);sug.style.display='none';});});
  }catch(e){sug.innerHTML='<div class="place-suggestion-empty">Search unavailable</div>';sug.style.display='block';}
}
function selectPlace(inp,item){
  inp.value=item.getAttribute('data-name');
  var pfx=inp.id.replace('-place','');
  var latF=document.getElementById(pfx+'-place-lat'),lonF=document.getElementById(pfx+'-place-lon'),tzF=document.getElementById(pfx+'-timezone');
  if(latF)latF.value=item.getAttribute('data-lat');
  if(lonF)lonF.value=item.getAttribute('data-lon');
  detectTZ(item.getAttribute('data-lat'),item.getAttribute('data-lon'),tzF);
}
async function detectTZ(lat,lon,tzF){
  if(!tzF)return;
  try{var r=await fetch('https://timeapi.io/api/timezone/coordinate?latitude='+lat+'&longitude='+lon);if(r.ok){var d=await r.json();if(d.currentUtcOffset){var p=d.currentUtcOffset.split(':');tzF.value=p[0]+':'+p[1];return;}}}catch(e){}
  var off=Math.round(parseFloat(lon)/15),abs=Math.abs(off);tzF.value=(off>=0?'+':'-')+String(abs).padStart(2,'0')+':00';
}

// ===== DEV QUICK FILL =====
function quickFillTest(){
  document.getElementById('bc-name').value='Niket Jain';
  document.getElementById('bc-day').value='23';
  document.getElementById('bc-month').value='12';
  document.getElementById('bc-year').value='2000';
  document.getElementById('bc-hour').value='6';
  document.getElementById('bc-minute').value='20';
  document.getElementById('bc-ampm').value='PM';
  document.getElementById('bc-place').value='Dhrangadhra, Dhrangadhra Taluka, Surendranagar, Gujarat, 363300, India';
  document.getElementById('bc-place-lat').value='22.991';
  document.getElementById('bc-place-lon').value='71.487';
  document.getElementById('bc-timezone').value='+05:30';
}

// ===== TAB SWITCH =====
function switchTab(t){
  document.querySelectorAll('.tool-tab').forEach(function(e){e.classList.remove('active');});
  document.querySelectorAll('.tool-panel').forEach(function(e){e.classList.remove('active');});
  document.querySelector('[data-tab="'+t+'"]').classList.add('active');
  document.getElementById('panel-'+t).classList.add('active');
}

// ===== HELPERS =====
function getLocTime(pfx){
  var day=document.getElementById(pfx+'-day').value,month=document.getElementById(pfx+'-month').value,year=document.getElementById(pfx+'-year').value;
  var h=parseInt(document.getElementById(pfx+'-hour').value),m=document.getElementById(pfx+'-minute').value,ap=document.getElementById(pfx+'-ampm').value;
  if(ap==='PM'&&h!==12)h+=12;if(ap==='AM'&&h===12)h=0;
  var time=String(h).padStart(2,'0')+':'+m;
  var place=document.getElementById(pfx+'-place').value.trim();
  var tz=document.getElementById(pfx+'-timezone').value;
  return {day:day,month:month,year:year,time:time,place:place,tz:tz,lat:document.getElementById(pfx+'-place-lat').value,lon:document.getElementById(pfx+'-place-lon').value};
}
function locTimeStr(lt){return 'Location/'+encodeURIComponent(lt.place)+'/Time/'+lt.time+'/'+lt.day+'/'+lt.month+'/'+lt.year+'/'+lt.tz;}
function locTimeStrYear(lt,yr){return 'Location/'+encodeURIComponent(lt.place)+'/Time/'+lt.time+'/'+lt.day+'/'+lt.month+'/'+yr+'/'+lt.tz;}
function setLoading(id,on){var b=document.getElementById(id);b.disabled=on;b.querySelector('.btn-text').style.display=on?'none':'inline';b.querySelector('.btn-loader').style.display=on?'inline-flex':'none';}
function showError(id,msg){var e=document.getElementById(id);e.style.display='block';e.innerHTML='<div class="error-content"><h3>Something went wrong</h3><p>'+msg+'</p><p style="font-size:0.82rem;color:var(--ink-dim);margin-top:1rem;">The API may be temporarily unavailable. Try again or <a href="/consultation/">book a consultation</a>.</p></div>';}
function hideError(id){document.getElementById(id).style.display='none';}
async function callAPI(ep){
  var opts={};var apiKey=localStorage.getItem('vedastro_api_key');
  if(apiKey)opts.headers={'x-api-key':apiKey};
  var r=await fetch(API+'/'+ep,opts);if(!r.ok)throw new Error('API error '+r.status);
  var d=await r.json();
  if(d.Status!=='Pass'){var msg=(typeof d.Payload==='string')?d.Payload:'Calculation failed';var err=new Error(msg);err.isRateLimit=(msg.indexOf('rate limit')!==-1||msg.indexOf('Rate limit')!==-1);throw err;}
  return d.Payload;
}
function delay(ms){return new Promise(function(r){setTimeout(r,ms);});}
function showProgress(msg){var el=document.getElementById('bc-progress');if(el){el.style.display='block';el.textContent=msg;}}
function hideProgress(){var el=document.getElementById('bc-progress');if(el)el.style.display='none';}
async function batchedCalls(endpoints){
  var apiKey=localStorage.getItem('vedastro_api_key');
  var batchSize=apiKey?endpoints.length:5;
  var essential=['d1','house','hSign','ascDeg'];
  var data={};
  for(var b=0;b<Math.ceil(endpoints.length/batchSize);b++){
    var start=b*batchSize;
    var batch=endpoints.slice(start,start+batchSize);
    if(b>0&&!apiKey){
      for(var sec=62;sec>0;sec--){showProgress('API cooldown — resuming in '+sec+'s (batch '+(b+1)+'/'+Math.ceil(endpoints.length/batchSize)+')');await delay(1000);}
    }
    showProgress('Loading chart data... ('+Math.min(start+batchSize,endpoints.length)+'/'+endpoints.length+')');
    var results=await Promise.all(batch.map(function(e){
      return callAPI(e.ep).catch(function(err){
        if(essential.indexOf(e.key)!==-1)throw err;
        console.warn('Non-essential call failed ('+e.key+'):',err.message);
        return null;
      });
    }));
    batch.forEach(function(e,i){data[e.key]=results[i];});
  }
  // Retry failed essential calls once
  for(var i=0;i<endpoints.length;i++){
    var e=endpoints[i];
    if(data[e.key]===null&&essential.indexOf(e.key)!==-1){
      showProgress('Retrying essential data ('+e.key+')...');
      await delay(2000);
      data[e.key]=await callAPI(e.ep);
    }
  }
  return data;
}
function pick(arr,key){if(!Array.isArray(arr))return null;for(var i=0;i<arr.length;i++){if(arr[i][key]!==undefined)return arr[i][key];}return null;}
function showResults(title,sub){document.getElementById('tools-form-view').style.display='none';document.getElementById('tools-results-view').style.display='block';document.getElementById('results-title').textContent=title;document.getElementById('results-subtitle').textContent=sub;window.scrollTo({top:0,behavior:'smooth'});}
function backToForm(){document.getElementById('tools-results-view').style.display='none';document.getElementById('tools-form-view').style.display='block';document.getElementById('kundali-results').style.display='none';document.getElementById('compat-results').style.display='none';window.scrollTo({top:0,behavior:'smooth'});}
function pTitle(name){var i=PLANET_INFO[name];return i?(i.en+' — '+i.hi):name;}


// ===== NORTH INDIAN CHART SVG =====
function drawChart(containerId, houseSigns, housePlanets, planetDegrees, upaInHouse){
  var S=420;
  var TL=[0,0],TR=[S,0],BR=[S,S],BL=[0,S];
  var T=[S/2,0],R=[S,S/2],B=[S/2,S],L=[0,S/2];

  // House content centers — slightly adjusted for larger chart
  var textPos=[
    [S/2, S*0.22],[S*0.25, S*0.08],[S*0.08, S*0.24],
    [S*0.24, S/2],[S*0.08, S*0.76],[S*0.25, S*0.92],
    [S/2, S*0.78],[S*0.75, S*0.92],[S*0.92, S*0.76],
    [S*0.76, S/2],[S*0.92, S*0.24],[S*0.75, S*0.08]
  ];
  var hnPos=[
    [S/2, S*0.13],[S*0.37, S*0.03],[S*0.03, S*0.13],
    [S*0.13, S/2],[S*0.03, S*0.87],[S*0.37, S*0.97],
    [S/2, S*0.87],[S*0.63, S*0.97],[S*0.97, S*0.87],
    [S*0.87, S/2],[S*0.97, S*0.13],[S*0.63, S*0.03]
  ];

  chartMeta[containerId] = {textPos:textPos};

  var svg='<svg viewBox="0 0 '+S+' '+S+'" xmlns="http://www.w3.org/2000/svg" class="kundali-svg" id="svg-'+containerId+'">';
  svg+='<defs><marker id="ah-'+containerId+'" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#D44A2E" opacity="0.8"/></marker></defs>';
  svg+='<rect x="0" y="0" width="'+S+'" height="'+S+'" fill="none" stroke="#C49A2C" stroke-width="1.5"/>';
  [[TL,BR],[TR,BL]].forEach(function(ln){svg+='<line x1="'+ln[0][0]+'" y1="'+ln[0][1]+'" x2="'+ln[1][0]+'" y2="'+ln[1][1]+'" stroke="#C49A2C" stroke-width="0.8" opacity="0.5"/>';});
  svg+='<polygon points="'+T.join(',')+' '+R.join(',')+' '+B.join(',')+' '+L.join(',')+'" fill="none" stroke="#C49A2C" stroke-width="1.5"/>';

  var upaMap=upaInHouse||{};

  for(var i=0;i<12;i++){
    var x=textPos[i][0],y=textPos[i][1];
    var sign=houseSigns[i]||'';
    var abbr=SIGN_ABBR[sign]||sign.substring(0,2);
    var planets=housePlanets[i]||[];
    var upas=upaMap[i]||[];
    var degs=planetDegrees||{};
    var totalItems=planets.length+upas.length;

    // Determine if this is a diamond house (1,4,7,10) or triangle house
    var isDiamond=(i===0||i===3||i===6||i===9);
    var perRow=isDiamond?4:3;
    var upaPerRow=isDiamond?5:4;
    var pSpacing=isDiamond?32:28; // generous spacing between planets
    var uSpacing=isDiamond?24:22;

    var rashiNum=SIGNS_ORDER.indexOf(sign)+1;
    svg+='<text x="'+hnPos[i][0]+'" y="'+hnPos[i][1]+'" text-anchor="middle" class="chart-house-num">'+(rashiNum||'')+'</text>';

    // Adjust start Y: if house is crowded, start sign closer to top
    var signOffY=(totalItems>4)?-3:-6;
    svg+='<text x="'+x+'" y="'+(y+signOffY)+'" text-anchor="middle" class="chart-sign">'+abbr+'</text>';

    // Main planets — each planet is its own hoverable text element
    var rowY=y+signOffY+14;
    if(planets.length){
      for(var pi=0;pi<planets.length;pi+=perRow){
        var chunk=planets.slice(pi,pi+perRow);
        var startX=x-((chunk.length-1)*pSpacing)/2;
        chunk.forEach(function(p,ci){
          var info=PLANET_INFO[p];var ab=info?info.ab:p.substring(0,2);
          var deg=degs[p];
          if(deg!==undefined&&!isNaN(deg))ab+=toSup(String(Math.floor(parseFloat(deg))).padStart(2,'0'));
          var px=startX+ci*pSpacing;
          svg+='<text x="'+px+'" y="'+rowY+'" text-anchor="middle" class="chart-planets chart-planet-hover" data-planet="'+p+'" data-house="'+i+'" style="cursor:pointer">'+ab+'</text>';
        });
        rowY+=14;
      }
    }

    // Upagrahas — smaller, no degrees to save space
    if(upas.length){
      rowY+=2;
      for(var ui=0;ui<upas.length;ui+=upaPerRow){
        var uChunk=upas.slice(ui,ui+upaPerRow);
        var uStartX=x-((uChunk.length-1)*uSpacing)/2;
        uChunk.forEach(function(u,ci){
          var info=PLANET_INFO[u.name];var ab=info?info.ab:u.name.substring(0,2);
          var px=uStartX+ci*uSpacing;
          svg+='<text x="'+px+'" y="'+rowY+'" text-anchor="middle" class="chart-upa chart-planet-hover" data-planet="'+u.name+'" data-house="'+i+'" style="cursor:pointer">'+ab+'</text>';
        });
        rowY+=12;
      }
    }
  }

  svg+='<g class="aspect-arrows"></g></svg>';
  document.getElementById(containerId).innerHTML=svg;
}


// ===== ASPECT ARROWS =====
function showAspects(chartId, fromXY, toIdxes){
  clearAspects(chartId);
  var meta=chartMeta[chartId];if(!meta)return;
  var svgEl=document.getElementById('svg-'+chartId);if(!svgEl)return;
  var g=svgEl.querySelector('.aspect-arrows');if(!g)return;
  toIdxes.forEach(function(toIdx){
    var to=meta.textPos[toIdx];
    var line=document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',fromXY[0]);line.setAttribute('y1',fromXY[1]);
    line.setAttribute('x2',to[0]);line.setAttribute('y2',to[1]);
    line.setAttribute('stroke','#D44A2E');line.setAttribute('stroke-width','1.5');
    line.setAttribute('opacity','0.7');line.setAttribute('stroke-dasharray','4,3');
    line.setAttribute('marker-end','url(#ah-'+chartId+')');
    g.appendChild(line);
  });
}
function clearAspects(chartId){
  var svgEl=document.getElementById('svg-'+chartId);if(!svgEl)return;
  var g=svgEl.querySelector('.aspect-arrows');if(g)g.innerHTML='';
}

// Setup hover on individual planet labels in chart — arrows originate from planet position
function setupChartHover(chartId){
  var svgEl=document.getElementById('svg-'+chartId);if(!svgEl)return;
  svgEl.querySelectorAll('.chart-planet-hover').forEach(function(el){
    var pName=el.getAttribute('data-planet');
    var hIdx=parseInt(el.getAttribute('data-house'));
    var targets=getAspectHouses(pName,hIdx);
    el.addEventListener('mouseenter',function(){
      el.setAttribute('fill','#D44A2E');
      // Get planet's actual SVG position
      var px=parseFloat(el.getAttribute('x'));
      var py=parseFloat(el.getAttribute('y'));
      showAspects(chartId,[px,py],targets);
    });
    el.addEventListener('mouseleave',function(){
      if(el.classList.contains('chart-upa'))el.setAttribute('fill','#7A6F62');
      else el.removeAttribute('fill');
      clearAspects(chartId);
    });
  });
}


// ===== BIRTH CHART =====
async function generateBirthChart(e){
  e.preventDefault();hideError('bc-error');setLoading('bc-submit',true);showProgress('Preparing...');
  var name=document.getElementById('bc-name').value.trim();
  var lt=getLocTime('bc');
  var ep=locTimeStr(lt);

  try{
    // 10 core API calls (no upagrahas — saves 44 calls, avoids rate limits)
    var endpoints=[
      {key:'d1',ep:'PlanetRasiD1Sign/PlanetName/All/'+ep},
      {key:'nak',ep:'PlanetConstellation/PlanetName/All/'+ep},
      {key:'house',ep:'HousePlanetOccupiesBasedOnSign/PlanetName/All/'+ep},
      {key:'d9',ep:'PlanetNavamshaD9Sign/PlanetName/All/'+ep},
      {key:'retro',ep:'IsPlanetRetrograde/PlanetName/All/'+ep},
      {key:'combust',ep:'IsPlanetCombust/PlanetName/All/'+ep},
      {key:'avasta',ep:'PlanetAvasta/PlanetName/All/'+ep},
      {key:'hSign',ep:'HouseSignName/HouseName/All/'+ep},
      {key:'hNak',ep:'HouseConstellation/HouseName/All/'+ep},
      {key:'ascDeg',ep:'HouseRasiSign/HouseName/House1/'+ep}
    ];

    var data=await batchedCalls(endpoints);

    birthEp=ep;
    var h=document.getElementById('bc-hour').value,m=document.getElementById('bc-minute').value,ap=document.getElementById('bc-ampm').value;
    hideProgress();
    showResults('Kundali of '+name, lt.day+'/'+lt.month+'/'+lt.year+' at '+h+':'+m+' '+ap+' — '+lt.place);
    document.getElementById('kundali-results').style.display='block';
    renderKundali(data,lt);

    // Load dasha async (don't block chart rendering)
    var endYr=String(parseInt(lt.year)+100);
    document.getElementById('dasha-content').innerHTML='<p style="color:var(--ink-dim)">Loading Dasha data...</p>';
    var dashaWait=localStorage.getItem('vedastro_api_key')?0:62000;
    setTimeout(function(){
      callAPI('DasaAtRange/'+ep+'/'+ep+'/'+locTimeStrYear(lt,endYr)+'/Levels/2/PrecisionHours/720')
        .then(function(dashaData){renderCurrentDashaSummary(dashaData);renderDasha(dashaData);})
        .catch(function(){document.getElementById('dasha-content').innerHTML='<p style="color:var(--ink-dim)">Dasha data unavailable. Try refreshing.</p>';});
    },dashaWait);
  }catch(err){
    hideProgress();
    if(err.isRateLimit){
      showError('bc-error','VedAstro API rate limit reached (5 calls/min on free tier). Please wait 1 minute and try again.<br><br>For instant results, <a href="https://vedastro.org/Account.html" target="_blank">get a VedAstro API key</a> ($1/month) and enter it below the form.');
    }else{
      showError('bc-error',err.message||'Failed to generate. Check birth details and try again.');
    }
  }finally{setLoading('bc-submit',false);hideProgress();}
}


function renderKundali(data,lt){
  // === MAIN PLANETS (handle null from failed non-essential calls) ===
  var d1Arr=(data.d1&&data.d1.PlanetRasiD1Sign)||[];
  var nakArr=(data.nak&&data.nak.PlanetConstellation)||[];
  var houseArr=(data.house&&data.house.HousePlanetOccupiesBasedOnSign)||[];
  var d9Arr=(data.d9&&data.d9.PlanetNavamshaD9Sign)||[];
  var retroArr=(data.retro&&data.retro.IsPlanetRetrograde)||[];
  var combustArr=(data.combust&&data.combust.IsPlanetCombust)||[];
  var avastaArr=(data.avasta&&data.avasta.PlanetAvasta)||[];

  var planetData=[];
  PLANETS.forEach(function(name){
    var d1=pick(d1Arr,name),nak=pick(nakArr,name),house=pick(houseArr,name);
    var d9=pick(d9Arr,name),retro=pick(retroArr,name),comb=pick(combustArr,name);
    var avs=pick(avastaArr,name);

    var sign='',deg='',totalDeg=0;
    if(d1&&typeof d1==='object'){sign=d1.Name||'';if(d1.DegreesIn){deg=d1.DegreesIn.DegreeMinuteSecond||'';totalDeg=parseFloat(d1.DegreesIn.TotalDegrees)||0;}}
    var navSign='',navDeg=0;
    if(d9&&typeof d9==='object'){navSign=d9.Name||'';if(d9.DegreesIn)navDeg=parseFloat(d9.DegreesIn.TotalDegrees)||0;}

    planetData.push({name:name,sign:sign,degree:deg,totalDeg:totalDeg,nakshatra:nak||'',house:house||'',navSign:navSign,navDeg:navDeg,retro:(retro==='True'),combust:(comb==='True'),avastha:cleanAvastha(avs||'')});
  });

  // === ASCENDANT ===
  var ascDeg='',ascTotalDeg=0;
  try{var ar=data.ascDeg&&data.ascDeg.HouseRasiSign;if(ar&&ar.DegreesIn){ascDeg=ar.DegreesIn.DegreeMinuteSecond||'';ascTotalDeg=parseFloat(ar.DegreesIn.TotalDegrees)||0;}}catch(e){}

  // === HOUSES (lords derived from sign rulers — no extra API call needed) ===
  var hSignArr=(data.hSign&&data.hSign.HouseSignName)||[];
  var hNakArr=(data.hNak&&data.hNak.HouseConstellation)||[];

  var houses=[];
  for(var i=1;i<=12;i++){
    var hk='House'+i;
    var sign=pick(hSignArr,hk)||'';
    var lord=SIGN_RULER[sign]||'';
    houses.push({sign:sign,lord:lord,nakshatra:pick(hNakArr,hk)||'',planets:[]});
  }
  // Derive planets in each house from planet→house data
  planetData.forEach(function(p){
    var hIdx=parseInt(p.house.replace('House',''),10)-1;
    if(hIdx>=0&&hIdx<12)houses[hIdx].planets.push(p.name);
  });

  // D9 Lagna: derive mathematically from ascendant sign + degree (most reliable)
  var ascSign=houses[0].sign;
  var ascSIdx=SIGNS_ORDER.indexOf(ascSign);
  var ascD=ascTotalDeg||0;
  var pada=Math.floor(ascD/(30/9));if(pada>8)pada=8;
  // Navamsa start sign: movable(0)=same, fixed(1)=9th from, dual(2)=5th from
  var modality=ascSIdx%3;
  var startIdx=ascSIdx;
  if(modality===1)startIdx=(ascSIdx+8)%12;
  else if(modality===2)startIdx=(ascSIdx+4)%12;
  var d9LagnaSign=SIGNS_ORDER[(startIdx+pada)%12];
  var karakaMap=computeKaraka(planetData);

  // === COMPUTE PANCHANG ===
  var panchang=computePanchang(planetData,lt);

  // === RENDER SUMMARY & PANCHANG ===
  renderSummaryCard(planetData,houses,panchang);
  renderPanchang(panchang);

  // === RASHI CHART ===
  var rSigns=[],rPlanets=[],rDegs={};
  for(var i=0;i<12;i++){rSigns.push(houses[i].sign);rPlanets.push([]);}
  planetData.forEach(function(p){
    var hIdx=parseInt(p.house.replace('House',''),10)-1;
    if(hIdx>=0&&hIdx<12){rPlanets[hIdx].push(p.name);rDegs[p.name]=p.totalDeg;}
  });
  drawChart('rashi-chart',rSigns,rPlanets,rDegs);

  // === NAVAMSA CHART ===
  var d9Idx=SIGNS_ORDER.indexOf(d9LagnaSign);if(d9Idx===-1)d9Idx=0;
  var nSigns=[],nPlanets=[],nDegs={};
  for(var i=0;i<12;i++){nSigns.push(SIGNS_ORDER[(d9Idx+i)%12]);nPlanets.push([]);}
  planetData.forEach(function(p){
    if(!p.navSign)return;
    var sIdx=SIGNS_ORDER.indexOf(p.navSign);if(sIdx===-1)return;
    nPlanets[(sIdx-d9Idx+12)%12].push(p.name);nDegs[p.name]=p.navDeg;
  });
  drawChart('navamsa-chart',nSigns,nPlanets,nDegs);

  // === CHANDRA KUNDALI (Moon chart) ===
  var moonHouseIdx=-1;
  planetData.forEach(function(p){if(p.name==='Moon')moonHouseIdx=parseInt(p.house.replace('House',''),10)-1;});
  if(moonHouseIdx>=0){
    var cSigns=[],cPlanets=[];
    for(var i=0;i<12;i++){cSigns.push(houses[(moonHouseIdx+i)%12].sign);cPlanets.push([]);}
    planetData.forEach(function(p){
      var hIdx=parseInt(p.house.replace('House',''),10)-1;
      var rel=(hIdx-moonHouseIdx+12)%12;
      cPlanets[rel].push(p.name);
    });
    drawChart('chandra-chart',cSigns,cPlanets,rDegs);
    setupChartHover('chandra-chart');
  }

  // === SURYA KUNDALI (Sun chart) ===
  var sunHouseIdx=-1;
  planetData.forEach(function(p){if(p.name==='Sun')sunHouseIdx=parseInt(p.house.replace('House',''),10)-1;});
  if(sunHouseIdx>=0){
    var sSigns=[],sPlanets=[];
    for(var i=0;i<12;i++){sSigns.push(houses[(sunHouseIdx+i)%12].sign);sPlanets.push([]);}
    planetData.forEach(function(p){
      var hIdx=parseInt(p.house.replace('House',''),10)-1;
      var rel=(hIdx-sunHouseIdx+12)%12;
      sPlanets[rel].push(p.name);
    });
    drawChart('surya-chart',sSigns,sPlanets,rDegs);
    setupChartHover('surya-chart');
  }

  // === CHART HOVER ASPECTS ===
  setupChartHover('rashi-chart');
  setupChartHover('navamsa-chart');

  // === COMPUTE DOSHAS & YOGAS ===
  var mangalDosha=computeMangalDosha(planetData,houses);
  var kaalSarp=computeKaalSarpDosha(planetData);
  var moonSign=panchang?panchang.moonSign:'';
  var sadeSati=computeSadeSati(moonSign);
  var yogas=computeYogas(planetData,houses);
  yogas=computeExtendedYogas(planetData,houses,yogas);
  renderYogaDosha(yogas,mangalDosha,kaalSarp,sadeSati);

  // === PLANET TABLE (with Dignity column) ===
  var tbody=document.querySelector('#planets-table tbody');
  tbody.innerHTML='';

  // Ascendant row
  var ascNak=houses[0].nakshatra||'',ascNakName=ascNak,ascPada='';
  if(ascNak.indexOf(' - ')!==-1){var sp=ascNak.split(' - ');ascNakName=sp[0].trim();ascPada=sp[1].trim();}
  tbody.innerHTML+='<tr><td><strong title="Ascendant — लग्न (Lagna)">Ascendant</strong></td><td></td><td></td><td>'+houses[0].sign+'</td><td>'+fmtDeg(ascDeg)+'</td><td></td><td>'+ascNakName+'</td><td>'+ascPada+'</td><td></td><td></td></tr>';

  // Main planet rows
  planetData.forEach(function(p){
    var cMark=p.combust?'<span class="marker-combust" title="Combust — अस्त">C</span>':'';
    var rMark=p.retro?'<span class="marker-retro" title="Retrograde — वक्री">R</span>':'<span class="marker-direct" title="Direct — मार्गी">D</span>';
    if(p.name==='Rahu'||p.name==='Ketu'){cMark='';rMark='<span class="marker-retro" title="Retrograde — वक्री">R</span>';}
    var nakName=p.nakshatra,pada='';
    if(p.nakshatra.indexOf(' - ')!==-1){var sp=p.nakshatra.split(' - ');nakName=sp[0].trim();pada=sp[1].trim();}
    var karaka=karakaMap[p.name]||'';
    var karakaTitle=KARAKA_FULL[karaka]||'';
    var hIdx=parseInt(p.house.replace('House',''),10)-1;
    var dig=getDignity(p.name,p.sign,p.totalDeg);
    var digHtml=dig.status?'<span class="'+dig.cls+'">'+dig.status+'</span>':'';

    var tr=document.createElement('tr');
    tr.setAttribute('data-planet',p.name);
    tr.setAttribute('data-house-idx',hIdx);
    tr.innerHTML='<td><strong title="'+pTitle(p.name)+'">'+p.name+'</strong></td><td>'+cMark+'</td><td>'+rMark+'</td><td>'+p.sign+'</td><td>'+fmtDeg(p.degree)+'</td><td>'+digHtml+'</td><td>'+nakName+'</td><td>'+pada+'</td><td>'+(karakaTitle||'')+'</td><td title="'+p.avastha+'">'+p.avastha+'</td>';
    tbody.appendChild(tr);
  });

  // === HOUSE TABLE ===
  var htb=document.querySelector('#houses-table tbody');
  htb.innerHTML='';
  houses.forEach(function(h,i){
    var pls=rPlanets[i].length?rPlanets[i].join(', '):'—';
    htb.innerHTML+='<tr><td><strong>'+HOUSE_NAMES[i]+'</strong></td><td>'+h.sign+'</td><td>'+h.lord+'</td><td>'+h.nakshatra+'</td><td>'+pls+'</td></tr>';
  });

  // === ASHTAKAVARGA ===
  var lagnaIdx=SIGNS_ORDER.indexOf(houses[0].sign);
  var avData=computeAshtakavarga(planetData,lagnaIdx>=0?lagnaIdx:0);
  renderAshtakavarga(avData,houses);

  // === PLANET RELATIONSHIPS ===
  var rels=computeRelationships(planetData);
  renderRelationships(rels);

  // === PREDICTIONS ===
  var preds=computePredictions(planetData,houses,yogas,mangalDosha);
  renderPredictions(preds);

  // === REMEDIES ===
  renderRemedies(planetData);
}


// ===== HELPERS =====
function fmtDeg(raw){if(!raw)return '';return raw.replace(/\s*deg\s*/g,'° ');}
function cleanAvastha(raw){
  if(!raw)return '';
  var map={'KshuditaStarved':'Kshudita','MuditaDelighted':'Mudita','GarvitaProud':'Garvita','KshobhitaAgitated':'Kshobhita','LajjitaAshamed':'Lajjita','TrashitaThirsty':'Trashita'};
  return raw.split(',').map(function(s){s=s.trim();return map[s]||s;}).join(', ');
}
function computeKaraka(planets){
  var items=[];
  planets.forEach(function(p){if(p.name==='Ketu')return;var deg=p.totalDeg;if(p.name==='Rahu')deg=30-deg;if(deg<0)deg+=30;items.push({name:p.name,deg:deg});});
  items.sort(function(a,b){return b.deg-a.deg;});
  var map={};items.forEach(function(it,i){if(i<KARAKA_NAMES.length)map[it.name]=KARAKA_NAMES[i];});
  return map;
}


// ===== DIGNITY & FRIENDSHIP =====
var DIGNITY_DATA={
  Sun:{ex:'Aries',exDeg:10,db:'Libra',own:['Leo'],mt:'Leo',mtS:0,mtE:20},
  Moon:{ex:'Taurus',exDeg:3,db:'Scorpio',own:['Cancer'],mt:'Taurus',mtS:4,mtE:30},
  Mars:{ex:'Capricorn',exDeg:28,db:'Cancer',own:['Aries','Scorpio'],mt:'Aries',mtS:0,mtE:12},
  Mercury:{ex:'Virgo',exDeg:15,db:'Pisces',own:['Gemini','Virgo'],mt:'Virgo',mtS:16,mtE:20},
  Jupiter:{ex:'Cancer',exDeg:5,db:'Capricorn',own:['Sagittarius','Pisces'],mt:'Sagittarius',mtS:0,mtE:10},
  Venus:{ex:'Pisces',exDeg:27,db:'Virgo',own:['Taurus','Libra'],mt:'Libra',mtS:0,mtE:15},
  Saturn:{ex:'Libra',exDeg:20,db:'Aries',own:['Capricorn','Aquarius'],mt:'Aquarius',mtS:0,mtE:20},
  Rahu:{ex:'Taurus',db:'Scorpio',own:['Aquarius'],mt:null},
  Ketu:{ex:'Scorpio',db:'Taurus',own:['Scorpio'],mt:null}
};
var NAT_FRIENDS={
  Sun:{f:['Moon','Mars','Jupiter'],e:['Venus','Saturn'],n:['Mercury']},
  Moon:{f:['Sun','Mercury'],e:[],n:['Mars','Jupiter','Venus','Saturn']},
  Mars:{f:['Sun','Moon','Jupiter'],e:['Mercury'],n:['Venus','Saturn']},
  Mercury:{f:['Sun','Venus'],e:['Moon'],n:['Mars','Jupiter','Saturn']},
  Jupiter:{f:['Sun','Moon','Mars'],e:['Mercury','Venus'],n:['Saturn']},
  Venus:{f:['Mercury','Saturn'],e:['Sun','Moon'],n:['Mars','Jupiter']},
  Saturn:{f:['Mercury','Venus'],e:['Sun','Moon','Mars'],n:['Jupiter']},
  Rahu:{f:['Mercury','Venus','Saturn'],e:['Sun','Moon','Mars'],n:['Jupiter']},
  Ketu:{f:['Mars','Jupiter'],e:['Mercury','Venus'],n:['Sun','Moon','Saturn']}
};
function getDignity(planet,sign,deg){
  var d=DIGNITY_DATA[planet];if(!d)return{status:'',cls:''};
  // Check moolatrikona BEFORE exaltation when they share the same sign
  if(d.mt&&sign===d.mt){var inM=true;if(d.mtS!==undefined&&deg<d.mtS)inM=false;if(d.mtE!==undefined&&deg>d.mtE)inM=false;if(inM)return{status:'Moolatrikona',cls:'dignity-moola'};}
  if(sign===d.ex)return{status:'Exalted',cls:'dignity-exalted'};
  if(sign===d.db)return{status:'Debilitated',cls:'dignity-debilitated'};
  if(d.own&&d.own.indexOf(sign)!==-1)return{status:'Own Sign',cls:'dignity-own'};
  var lord=SIGN_RULER[sign];if(!lord||!NAT_FRIENDS[planet])return{status:'',cls:''};
  var nf=NAT_FRIENDS[planet];
  if(nf.f.indexOf(lord)!==-1)return{status:"Friend's Sign",cls:'dignity-friend'};
  if(nf.e.indexOf(lord)!==-1)return{status:"Enemy's Sign",cls:'dignity-enemy'};
  return{status:'Neutral',cls:'dignity-neutral'};
}
function getSidLong(sign,deg){var idx=SIGNS_ORDER.indexOf(sign);return idx>=0?idx*30+(parseFloat(deg)||0):0;}


// ===== PANCHANG =====
var TITHI_NAMES=['Shukla Pratipada','Shukla Dwitiya','Shukla Tritiya','Shukla Chaturthi','Shukla Panchami','Shukla Shashthi','Shukla Saptami','Shukla Ashtami','Shukla Navami','Shukla Dashami','Shukla Ekadashi','Shukla Dwadashi','Shukla Trayodashi','Shukla Chaturdashi','Purnima','Krishna Pratipada','Krishna Dwitiya','Krishna Tritiya','Krishna Chaturthi','Krishna Panchami','Krishna Shashthi','Krishna Saptami','Krishna Ashtami','Krishna Navami','Krishna Dashami','Krishna Ekadashi','Krishna Dwadashi','Krishna Trayodashi','Krishna Chaturdashi','Amavasya'];
var YOGA_27=['Vishkambha','Priti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma','Dhriti','Shoola','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata','Variyan','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti'];
var KARANA_MOV=['Bava','Balava','Kaulava','Taitila','Gara','Vanija','Vishti'];
var VARA_DATA=[{n:'Sunday',l:'Sun',h:'रविवार'},{n:'Monday',l:'Moon',h:'सोमवार'},{n:'Tuesday',l:'Mars',h:'मंगलवार'},{n:'Wednesday',l:'Mercury',h:'बुधवार'},{n:'Thursday',l:'Jupiter',h:'गुरुवार'},{n:'Friday',l:'Venus',h:'शुक्रवार'},{n:'Saturday',l:'Saturn',h:'शनिवार'}];

function computePanchang(planetData,lt){
  var sunP=null,moonP=null;
  planetData.forEach(function(p){if(p.name==='Sun')sunP=p;if(p.name==='Moon')moonP=p;});
  if(!sunP||!moonP)return null;
  var sunL=getSidLong(sunP.sign,sunP.totalDeg),moonL=getSidLong(moonP.sign,moonP.totalDeg);
  // Tithi
  var tA=(moonL-sunL+360)%360;
  var tIdx=Math.floor(tA/12);if(tIdx>29)tIdx=29;
  // Yoga
  var yA=(sunL+moonL)%360;
  var yIdx=Math.floor(yA/(800/60));if(yIdx>26)yIdx=26;
  // Karana
  var kIdx=Math.floor(tA/6);if(kIdx>59)kIdx=59;
  var karana;
  if(kIdx===0)karana='Kimstughna';
  else if(kIdx>=57)karana=['Shakuni','Chatushpada','Naga'][kIdx-57];
  else karana=KARANA_MOV[(kIdx-1)%7];
  // Vara
  var dt=new Date(parseInt(lt.year),parseInt(lt.month)-1,parseInt(lt.day));
  var vara=VARA_DATA[dt.getDay()];
  // Birth Nakshatra
  var bNak=moonP.nakshatra||'',bNakName=bNak,bPada='';
  if(bNak.indexOf(' - ')!==-1){var sp=bNak.split(' - ');bNakName=sp[0].trim();bPada=sp[1].trim();}
  return{tithi:TITHI_NAMES[tIdx],paksha:tIdx<15?'Shukla':'Krishna',yoga:YOGA_27[yIdx],karana:karana,vara:vara.n,varaHi:vara.h,varaLord:vara.l,birthNak:bNakName,birthPada:bPada,moonSign:moonP.sign,sunSign:sunP.sign};
}


// ===== MANGAL DOSHA =====
function computeMangalDosha(planetData,houses){
  var mars=null,jup=null;
  planetData.forEach(function(p){if(p.name==='Mars')mars=p;if(p.name==='Jupiter')jup=p;});
  if(!mars)return{present:false};
  var mH=parseInt(mars.house.replace('House',''),10);
  var doshaH=[1,2,4,7,8,12];
  if(doshaH.indexOf(mH)===-1)return{present:false,house:mH,sign:mars.sign};
  var cancels=[];
  var mDig=getDignity('Mars',mars.sign,mars.totalDeg);
  if(mDig.status==='Exalted'||mDig.status==='Own Sign'||mDig.status==='Moolatrikona')cancels.push('Mars is '+mDig.status+' in '+mars.sign);
  if(jup){
    var jH=parseInt(jup.house.replace('House',''),10);
    if(jH===mH)cancels.push('Mars conjunct Jupiter');
    var jAsp=[(jH+4)%12||12,(jH+6)%12||12,(jH+8)%12||12];
    if(jAsp.indexOf(mH)!==-1)cancels.push('Mars aspected by Jupiter');
  }
  if(mH===2&&(mars.sign==='Gemini'||mars.sign==='Virgo'))cancels.push('Mars in 2nd in Mercury\'s sign');
  if(mH===12&&(mars.sign==='Taurus'||mars.sign==='Libra'))cancels.push('Mars in 12th in Venus\'s sign');
  if(mH===1&&(mars.sign==='Aries'||mars.sign==='Leo'||mars.sign==='Aquarius'))cancels.push('Mars in Lagna in '+mars.sign);
  if(mH===8&&(mars.sign==='Pisces'||mars.sign==='Aquarius'))cancels.push('Mars in 8th in '+mars.sign);
  var beneficLagna=false;
  planetData.forEach(function(p){if((p.name==='Venus'||p.name==='Jupiter')&&p.house==='House1')beneficLagna=true;});
  if(beneficLagna)cancels.push('Benefic in Lagna weakens dosha');
  return{present:true,cancelled:cancels.length>0,house:mH,sign:mars.sign,cancellations:cancels};
}


// ===== KAAL SARP DOSHA =====
function computeKaalSarpDosha(planetData){
  var rahuL=0,ketuL=0,others=[];
  planetData.forEach(function(p){
    var lng=getSidLong(p.sign,p.totalDeg);
    if(p.name==='Rahu')rahuL=lng;else if(p.name==='Ketu')ketuL=lng;else others.push({name:p.name,lng:lng});
  });
  var arc1=0,arc2=0,rkArc=(ketuL-rahuL+360)%360;
  others.forEach(function(p){var fr=(p.lng-rahuL+360)%360;if(fr<=rkArc)arc1++;else arc2++;});
  var dir='';
  if(arc1===7)dir='Rahu to Ketu';else if(arc2===7)dir='Ketu to Rahu';else return{present:false};
  var rahuH=0;
  planetData.forEach(function(p){if(p.name==='Rahu')rahuH=parseInt(p.house.replace('House',''),10);});
  var types={1:'Anant',2:'Kulik',3:'Vasuki',4:'Shankhpal',5:'Padma',6:'Mahapadma',7:'Takshak',8:'Karkotak',9:'Shankhachur',10:'Ghatak',11:'Vishdhar',12:'Sheshnag'};
  return{present:true,type:types[rahuH]||'',rahuHouse:rahuH,direction:dir};
}


// ===== SADE SATI =====
function computeSadeSati(moonSign){
  // Check current Saturn position using TransitCalc if available
  if(typeof TransitCalc==='undefined')return{active:false,available:false};
  try{
    var td=TransitCalc.compute();
    var satSign=td.positions.Saturn.signEn;
    var moonIdx=SIGNS_ORDER.indexOf(moonSign);
    var satIdx=SIGNS_ORDER.indexOf(satSign);
    if(moonIdx<0||satIdx<0)return{active:false,available:true};
    var diff=(satIdx-moonIdx+12)%12;
    if(diff===11)return{active:true,available:true,phase:'Rising (1st phase)',satSign:satSign};
    if(diff===0)return{active:true,available:true,phase:'Peak (2nd phase)',satSign:satSign};
    if(diff===1)return{active:true,available:true,phase:'Setting (3rd phase)',satSign:satSign};
    return{active:false,available:true,satSign:satSign};
  }catch(e){return{active:false,available:false};}
}


// ===== YOGA DETECTION =====
function computeYogas(planetData,houses){
  var yogas=[];
  var pH={},pS={},pD={};
  planetData.forEach(function(p){
    var hIdx=parseInt(p.house.replace('House',''),10);
    pH[p.name]=hIdx;pS[p.name]=p.sign;pD[p.name]=getDignity(p.name,p.sign,p.totalDeg);
  });
  function hLord(n){return houses[n-1]?SIGN_RULER[houses[n-1].sign]||'':'';}
  function conj(a,b){return pH[a]===pH[b];}
  function inKendra(h,ref){var d=((h-ref)+12)%12;return d===0||d===3||d===6||d===9;}

  // Gajakesari
  if(inKendra(pH['Jupiter'],pH['Moon']))yogas.push({name:'Gajakesari Yoga',type:'benefic',desc:'Jupiter in kendra from Moon — wisdom, fame, prosperity. The native commands respect and achieves lasting success.'});

  // Budhaditya
  if(conj('Sun','Mercury'))yogas.push({name:'Budhaditya Yoga',type:'benefic',desc:'Sun-Mercury conjunction — intelligence, eloquence, analytical skills, strong communication.'});

  // Chandra-Mangal
  if(conj('Moon','Mars'))yogas.push({name:'Chandra-Mangal Yoga',type:'benefic',desc:'Moon-Mars conjunction — earning capacity, wealth through own efforts, business acumen.'});

  // Pancha Mahapurusha
  [{p:'Mars',y:'Ruchaka',d:'Courage, leadership, commanding personality, success in competition.'},{p:'Mercury',y:'Bhadra',d:'Sharp intellect, business acumen, excellent communication and learning.'},{p:'Jupiter',y:'Hamsa',d:'Spiritual wisdom, righteousness, respected teacher, blessed life.'},{p:'Venus',y:'Malavya',d:'Beauty, luxury, artistic talent, comfortable life, strong relationships.'},{p:'Saturn',y:'Shasha',d:'Authority, discipline, political power, longevity and leadership.'}].forEach(function(m){
    var dig=pD[m.p];
    if(inKendra(pH[m.p],1)&&(dig.status==='Exalted'||dig.status==='Own Sign'||dig.status==='Moolatrikona'))
      yogas.push({name:m.y+' Yoga',type:'benefic',desc:m.p+' in own/exalted sign in kendra — '+m.d});
  });

  // Raj Yoga: trikona lord (5,9) conjunct kendra lord (4,7,10)
  [5,9].forEach(function(t){var tl=hLord(t);if(!tl)return;[4,7,10].forEach(function(k){var kl=hLord(k);if(!kl||tl===kl)return;if(conj(tl,kl))yogas.push({name:'Raj Yoga',type:'benefic',desc:tl+' (lord of '+t+'th) conjunct '+kl+' (lord of '+k+'th) — authority, power, rise in status.'});});});

  // Dhana Yoga: lord of 2/11 conjunct lord of 1/5/9
  [2,11].forEach(function(d){var dl=hLord(d);if(!dl)return;[1,5,9].forEach(function(t){var tl=hLord(t);if(!tl||dl===tl)return;if(conj(dl,tl))yogas.push({name:'Dhana Yoga',type:'benefic',desc:dl+' (lord of '+d+') conjunct '+tl+' (lord of '+t+') — wealth accumulation, financial prosperity.'});});});

  // Viparita Raja Yoga: lord of 6/8/12 in another dusthana
  [{h:6},{h:8},{h:12}].forEach(function(x){var dl=hLord(x.h);if(!dl)return;var dlH=pH[dl];if([6,8,12].indexOf(dlH)!==-1&&dlH!==x.h)yogas.push({name:'Viparita Raja Yoga',type:'benefic',desc:'Lord of '+x.h+'th in '+dlH+'th house — unexpected gains through adversity.'});});

  // Neechabhanga Raja Yoga
  planetData.forEach(function(p){
    if(pD[p.name].status!=='Debilitated')return;
    var debLord=SIGN_RULER[p.sign];
    if(debLord&&(inKendra(pH[debLord],1)||inKendra(pH[debLord],pH['Moon'])))
      yogas.push({name:'Neechabhanga Raja Yoga',type:'benefic',desc:p.name+' debilitated but sign lord '+debLord+' in kendra — weakness transformed into great strength.'});
  });

  // Amala Yoga: natural benefic in 10th
  planetData.forEach(function(p){if(pH[p.name]===10&&['Jupiter','Venus','Mercury'].indexOf(p.name)!==-1)yogas.push({name:'Amala Yoga',type:'benefic',desc:p.name+' in 10th house — pure character, ethical career, good reputation.'});});

  // Saraswati Yoga: Jupiter, Venus, Mercury in kendra/trikona + Jupiter in own/exalted/friend
  var jvmInGood=['Jupiter','Venus','Mercury'].every(function(p){var h=pH[p];return inKendra(h,1)||[5,9].indexOf(((h-1+12)%12)+1)!==-1;});
  if(jvmInGood&&(pD['Jupiter'].status==='Exalted'||pD['Jupiter'].status==='Own Sign'||pD['Jupiter'].status==="Friend's Sign"))
    yogas.push({name:'Saraswati Yoga',type:'benefic',desc:'Jupiter, Venus, Mercury well-placed — exceptional learning, wisdom, mastery of arts and sciences.'});

  // Lakshmi Yoga: lord of 9th in own/exalted sign in kendra/trikona
  var l9=hLord(9);
  if(l9){var l9d=pD[l9];var l9h=pH[l9];var l9good=inKendra(l9h,1)||[1,5,9].indexOf(l9h)!==-1;
    if(l9good&&(l9d.status==='Exalted'||l9d.status==='Own Sign'))yogas.push({name:'Lakshmi Yoga',type:'benefic',desc:'9th lord '+l9+' in strength — wealth, fortune, prosperity, divine blessings.'});}

  // Kemadruma Yoga (challenging)
  var mH=pH['Moon'],h2m=(mH%12)+1,h12m=((mH-2+12)%12)+1;
  var adj=planetData.filter(function(p){return p.name!=='Moon'&&p.name!=='Rahu'&&p.name!=='Ketu'&&(pH[p.name]===h2m||pH[p.name]===h12m);});
  if(adj.length===0){
    var kendM=planetData.filter(function(p){return p.name!=='Moon'&&p.name!=='Rahu'&&p.name!=='Ketu'&&inKendra(pH[p.name],mH);});
    if(kendM.length===0)yogas.push({name:'Kemadruma Yoga',type:'challenging',desc:'No planets adjacent to Moon or in kendra from Moon — periods of loneliness or financial difficulty.'});
  }

  // Daridra Yoga: lord of 11th in 6/8/12
  var l11=hLord(11);if(l11&&[6,8,12].indexOf(pH[l11])!==-1)yogas.push({name:'Daridra Yoga',type:'challenging',desc:'11th lord in dusthana — obstacles in income, gains come with difficulty.'});

  // Grahan Yoga: Sun/Moon with Rahu/Ketu
  if(conj('Sun','Rahu')||conj('Sun','Ketu'))yogas.push({name:'Grahan Yoga (Solar)',type:'challenging',desc:'Sun with Rahu/Ketu — challenges with authority, father, or self-confidence. Spiritual growth through ego dissolution.'});
  if(conj('Moon','Rahu')||conj('Moon','Ketu'))yogas.push({name:'Grahan Yoga (Lunar)',type:'challenging',desc:'Moon with Rahu/Ketu — emotional turbulence, psychic sensitivity. Strong intuition but mental restlessness.'});

  // Deduplicate
  var seen={};yogas=yogas.filter(function(y){if(seen[y.name])return false;seen[y.name]=true;return true;});
  return yogas;
}


// ===== RENDER: SUMMARY CARD =====
function renderSummaryCard(planetData,houses,panchang){
  var el=document.getElementById('summary-card');if(!el)return;
  var ascSign=houses[0]?houses[0].sign:'';
  var moonSign=panchang?panchang.moonSign:'';
  var sunSign=panchang?panchang.sunSign:'';
  var birthNak=panchang?panchang.birthNak:'';
  var birthPada=panchang?panchang.birthPada:'';
  el.innerHTML='<div class="summary-grid">'+
    '<div class="summary-item"><span class="summary-label">Ascendant (Lagna)</span><span class="summary-value">'+ascSign+'</span></div>'+
    '<div class="summary-item"><span class="summary-label">Moon Sign (Rashi)</span><span class="summary-value">'+moonSign+'</span></div>'+
    '<div class="summary-item"><span class="summary-label">Sun Sign</span><span class="summary-value">'+sunSign+'</span></div>'+
    '<div class="summary-item"><span class="summary-label">Birth Star (Nakshatra)</span><span class="summary-value">'+birthNak+(birthPada?' — '+birthPada:'')+'</span></div>'+
  '</div>';
}


// ===== RENDER: PANCHANG =====
function renderPanchang(panchang){
  var el=document.getElementById('panchang-card');if(!el||!panchang)return;
  el.innerHTML='<div class="panchang-grid">'+
    '<div class="panchang-item"><span class="panchang-label">Tithi</span><span class="panchang-value">'+panchang.tithi+'</span></div>'+
    '<div class="panchang-item"><span class="panchang-label">Nakshatra</span><span class="panchang-value">'+panchang.birthNak+(panchang.birthPada?' ('+panchang.birthPada+')':'')+'</span></div>'+
    '<div class="panchang-item"><span class="panchang-label">Yoga</span><span class="panchang-value">'+panchang.yoga+'</span></div>'+
    '<div class="panchang-item"><span class="panchang-label">Karana</span><span class="panchang-value">'+panchang.karana+'</span></div>'+
    '<div class="panchang-item"><span class="panchang-label">Vara (Day)</span><span class="panchang-value">'+panchang.vara+' <span style="font-family:var(--font-hindi);font-size:0.8em;color:var(--ink-dim)">('+panchang.varaHi+')</span></span></div>'+
    '<div class="panchang-item"><span class="panchang-label">Paksha</span><span class="panchang-value">'+panchang.paksha+' Paksha</span></div>'+
  '</div>';
}


// ===== RENDER: YOGAS & DOSHAS =====
function renderYogaDosha(yogas,mangalDosha,kaalSarp,sadeSati){
  var el=document.getElementById('yoga-dosha-card');if(!el)return;
  var html='';

  // Doshas section
  html+='<div class="yd-section"><h4 class="yd-heading">Doshas</h4>';
  // Mangal Dosha
  if(mangalDosha.present){
    html+='<div class="dosha-item dosha-'+(mangalDosha.cancelled?'partial':'active')+'"><div class="dosha-header"><span class="dosha-icon">'+(mangalDosha.cancelled?'⚠':'✕')+'</span><strong>Mangal Dosha (Kuja Dosha)</strong><span class="dosha-badge '+(mangalDosha.cancelled?'badge-partial':'badge-active')+'">'+(mangalDosha.cancelled?'Cancelled/Weakened':'Active')+'</span></div>';
    html+='<p class="dosha-desc">Mars in '+mangalDosha.house+getSuffix(mangalDosha.house)+' house ('+mangalDosha.sign+') — affects marriage and partnerships.</p>';
    if(mangalDosha.cancellations&&mangalDosha.cancellations.length){html+='<ul class="dosha-cancels">';mangalDosha.cancellations.forEach(function(c){html+='<li>'+c+'</li>';});html+='</ul>';}
    html+='</div>';
  }else{
    html+='<div class="dosha-item dosha-absent"><div class="dosha-header"><span class="dosha-icon">✓</span><strong>Mangal Dosha</strong><span class="dosha-badge badge-absent">Not Present</span></div><p class="dosha-desc">Mars in '+mangalDosha.house+getSuffix(mangalDosha.house)+' house — no Mangal Dosha.</p></div>';
  }
  // Kaal Sarp Dosha
  if(kaalSarp.present){
    html+='<div class="dosha-item dosha-active"><div class="dosha-header"><span class="dosha-icon">✕</span><strong>Kaal Sarp Dosha — '+kaalSarp.type+'</strong><span class="dosha-badge badge-active">Present</span></div>';
    html+='<p class="dosha-desc">All planets hemmed between Rahu (House '+kaalSarp.rahuHouse+') and Ketu ('+kaalSarp.direction+') — karmic axis dominates. Remedies recommended.</p></div>';
  }else{
    html+='<div class="dosha-item dosha-absent"><div class="dosha-header"><span class="dosha-icon">✓</span><strong>Kaal Sarp Dosha</strong><span class="dosha-badge badge-absent">Not Present</span></div><p class="dosha-desc">Planets are distributed on both sides of the Rahu-Ketu axis.</p></div>';
  }
  // Sade Sati
  if(sadeSati&&sadeSati.available){
    if(sadeSati.active){
      html+='<div class="dosha-item dosha-active"><div class="dosha-header"><span class="dosha-icon">⚠</span><strong>Sade Sati</strong><span class="dosha-badge badge-active">'+sadeSati.phase+'</span></div>';
      html+='<p class="dosha-desc">Saturn currently transiting '+sadeSati.satSign+' — the 7.5-year Saturn transit over your natal Moon is active.</p></div>';
    }else{
      html+='<div class="dosha-item dosha-absent"><div class="dosha-header"><span class="dosha-icon">✓</span><strong>Sade Sati</strong><span class="dosha-badge badge-absent">Not Active</span></div><p class="dosha-desc">Saturn currently in '+sadeSati.satSign+' — not transiting over your Moon sign.</p></div>';
    }
  }
  html+='</div>';

  // Yogas section
  html+='<div class="yd-section"><h4 class="yd-heading">Yogas Detected</h4>';
  if(yogas.length===0){html+='<p style="color:var(--ink-dim)">No major yogas detected in this chart.</p>';}
  else{
    var benefic=yogas.filter(function(y){return y.type==='benefic';});
    var challenging=yogas.filter(function(y){return y.type==='challenging';});
    if(benefic.length){html+='<div class="yoga-group"><h5 class="yoga-group-title" style="color:var(--patina)">Beneficial Yogas ('+benefic.length+')</h5>';benefic.forEach(function(y){html+='<div class="yoga-item yoga-benefic"><strong>'+y.name+'</strong><p>'+y.desc+'</p></div>';});html+='</div>';}
    if(challenging.length){html+='<div class="yoga-group"><h5 class="yoga-group-title" style="color:var(--vermillion)">Challenging Yogas ('+challenging.length+')</h5>';challenging.forEach(function(y){html+='<div class="yoga-item yoga-challenging"><strong>'+y.name+'</strong><p>'+y.desc+'</p></div>';});html+='</div>';}
  }
  html+='</div>';
  el.innerHTML=html;
}
function getSuffix(n){if(n===1)return'st';if(n===2)return'nd';if(n===3)return'rd';return'th';}


// ===== RENDER: CURRENT DASHA SUMMARY =====
function renderCurrentDashaSummary(data){
  var el=document.getElementById('current-dasha-summary');if(!el)return;
  if(!data){el.style.display='none';return;}
  var raw=data.DasaAtRange||data.DasaForNow||data;
  if(typeof raw==='string'){try{raw=JSON.parse(raw);}catch(e){}}
  if(!raw||typeof raw!=='object'||Array.isArray(raw)){el.style.display='none';return;}
  var now=new Date();
  var currMaha=null,currAntar=null;
  for(var k in raw){
    var d=raw[k];if(!d||typeof d!=='object')continue;
    if(isPeriodCurrent(d,now)){
      currMaha=d;
      if(d.SubDasas){for(var sk in d.SubDasas){var s=d.SubDasas[sk];if(s&&typeof s==='object'&&isPeriodCurrent(s,now)){currAntar=s;break;}}}
      break;
    }
  }
  if(!currMaha){el.style.display='none';return;}
  el.style.display='block';
  var html='<div class="curr-dasha-grid">';
  html+='<div class="curr-dasha-item"><span class="curr-dasha-label">Mahadasha</span><strong class="curr-dasha-lord" title="'+pTitle(currMaha.Lord||'')+'">'+currMaha.Lord+'</strong><span class="curr-dasha-dates">'+fmtDasaDate(currMaha.Start)+' — '+fmtDasaDate(currMaha.End)+'</span></div>';
  if(currAntar){
    html+='<div class="curr-dasha-item"><span class="curr-dasha-label">Antardasha</span><strong class="curr-dasha-lord" title="'+pTitle(currAntar.Lord||'')+'">'+currAntar.Lord+'</strong><span class="curr-dasha-dates">'+fmtDasaDate(currAntar.Start)+' — '+fmtDasaDate(currAntar.End)+'</span></div>';
  }
  html+='</div>';
  el.innerHTML=html;
}


// ===== ASHTAKAVARGA =====
// Benefic point rules from Brihat Parashara Hora Shastra
// AV[planet][contributor] = houses from contributor that give a bindu (1-indexed)
var AV={
Sun:{Su:[1,2,4,7,8,9,10,11],Mo:[3,6,10,11],Ma:[1,2,4,7,8,9,10,11],Me:[3,5,6,9,10,11,12],Ju:[5,6,9,11],Ve:[6,7,12],Sa:[1,2,4,7,8,9,10,11],La:[3,4,6,10,11,12]},
Moon:{Su:[3,6,7,8,10,11],Mo:[1,3,6,7,10,11],Ma:[2,3,5,6,9,10,11],Me:[1,3,4,5,7,8,10,11],Ju:[1,4,7,8,10,11,12],Ve:[3,4,5,7,9,10,11],Sa:[3,5,6,11],La:[3,6,10,11]},
Mars:{Su:[3,5,6,10,11],Mo:[3,6,11],Ma:[1,2,4,7,8,10,11],Me:[3,5,6,11],Ju:[6,10,11,12],Ve:[6,8,11,12],Sa:[1,4,7,8,9,10,11],La:[1,3,6,10,11]},
Mercury:{Su:[5,6,9,11,12],Mo:[2,4,6,8,10,11],Ma:[1,2,4,7,8,9,10,11],Me:[1,3,5,6,9,10,11,12],Ju:[6,8,11,12],Ve:[1,2,3,4,5,8,9,11],Sa:[1,2,4,7,8,9,10,11],La:[1,2,4,6,8,10,11]},
Jupiter:{Su:[1,2,3,4,7,8,9,10,11],Mo:[2,5,7,9,11],Ma:[1,2,4,7,8,10,11],Me:[1,2,4,5,6,9,10,11],Ju:[1,2,3,4,7,8,10,11],Ve:[2,5,6,9,10,11],Sa:[3,5,6,12],La:[1,2,4,5,6,7,9,10,11]},
Venus:{Su:[8,11,12],Mo:[1,2,3,4,5,8,9,11,12],Ma:[3,5,6,9,11,12],Me:[3,5,6,9,11],Ju:[5,8,9,10,11],Ve:[1,2,3,4,5,8,9,10,11],Sa:[3,4,5,8,9,10,11],La:[1,2,3,4,5,8,9,11]},
Saturn:{Su:[1,2,4,7,8,10,11],Mo:[3,6,11],Ma:[3,5,6,10,11,12],Me:[6,8,9,10,11,12],Ju:[5,6,11,12],Ve:[6,11,12],Sa:[3,5,6,11],La:[1,3,4,6,10,11]}
};
var AV_PLANETS=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
var AV_ABBR={Sun:'Su',Moon:'Mo',Mars:'Ma',Mercury:'Me',Jupiter:'Ju',Venus:'Ve',Saturn:'Sa'};

function computeAshtakavarga(planetData,lagnaSignIdx){
  var pIdx={};
  planetData.forEach(function(p){pIdx[AV_ABBR[p.name]||'']=SIGNS_ORDER.indexOf(p.sign);});
  pIdx.La=lagnaSignIdx;
  var result={},sarva=new Array(12).fill(0);
  AV_PLANETS.forEach(function(planet){
    var ab=AV_ABBR[planet];
    var bindus=new Array(12).fill(0);
    var rules=AV[planet];
    // Contributions from each planet + Lagna
    ['Su','Mo','Ma','Me','Ju','Ve','Sa','La'].forEach(function(ref){
      var refIdx=pIdx[ref];if(refIdx===undefined||refIdx<0)return;
      var offsets=rules[ref];if(!offsets)return;
      offsets.forEach(function(h){bindus[(refIdx+h-1)%12]++;});
    });
    result[planet]=bindus;
    for(var i=0;i<12;i++)sarva[i]+=bindus[i];
  });
  result.Total=sarva;
  // Compute totals per planet
  AV_PLANETS.forEach(function(p){var s=0;result[p].forEach(function(b){s+=b;});result[p].total=s;});
  var st=0;sarva.forEach(function(b){st+=b;});result.grandTotal=st;
  return result;
}

function renderAshtakavarga(avData,houses){
  var el=document.getElementById('ashtakavarga-card');if(!el)return;
  // Sarvashtakavarga table
  var html='<div class="av-section"><h4 class="yd-heading">Sarvashtakavarga (Total Benefic Points per Sign)</h4>';
  html+='<div class="av-bar-chart">';
  var avg=Math.round(avData.grandTotal/12);
  for(var i=0;i<12;i++){
    var sign=houses[i]?houses[i].sign:'';
    var val=avData.Total[i];
    var pct=Math.round((val/48)*100);
    var cls=val>=30?'av-bar-high':val>=25?'av-bar-mid':'av-bar-low';
    html+='<div class="av-bar-col"><div class="av-bar-val">'+val+'</div><div class="av-bar '+cls+'" style="height:'+pct+'%"></div><div class="av-bar-sign">'+SIGN_ABBR[sign]+'</div></div>';
  }
  html+='</div><p class="table-note">Total: '+avData.grandTotal+'/337 &nbsp;|&nbsp; Average per sign: '+avg+' &nbsp;|&nbsp; Signs with 28+ bindus are strong for transits</p></div>';

  // Bhinnashtakavarga table
  html+='<div class="av-section"><h4 class="yd-heading">Bhinnashtakavarga (Individual Planet Points)</h4>';
  html+='<div class="result-table-wrap"><table class="result-table compact-table av-table"><thead><tr><th>Planet</th>';
  for(var i=0;i<12;i++){var sign=houses[i]?houses[i].sign:'';html+='<th>'+SIGN_ABBR[sign]+'</th>';}
  html+='<th>Total</th></tr></thead><tbody>';
  AV_PLANETS.forEach(function(p){
    html+='<tr><td><strong>'+p+'</strong></td>';
    avData[p].forEach(function(b){
      var cls=b>=5?'av-high':b>=3?'av-mid':'av-low';
      html+='<td class="'+cls+'">'+b+'</td>';
    });
    html+='<td><strong>'+avData[p].total+'</strong></td></tr>';
  });
  // Sarva row
  html+='<tr class="av-sarva-row"><td><strong>Sarva</strong></td>';
  avData.Total.forEach(function(b){html+='<td><strong>'+b+'</strong></td>';});
  html+='<td><strong>'+avData.grandTotal+'</strong></td></tr>';
  html+='</tbody></table></div></div>';
  el.innerHTML=html;
}


// ===== PLANET RELATIONSHIPS TABLE =====
function computeRelationships(planetData){
  // Temporal: planets in 2,3,4,10,11,12 from a planet are temporal friends; 5,6,7,8,9 are temporal enemies; same house varies
  var pHouse={};
  planetData.forEach(function(p){pHouse[p.name]=parseInt(p.house.replace('House',''),10);});
  var rels={};
  var MAIN7=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  MAIN7.forEach(function(p){
    rels[p]={};
    MAIN7.forEach(function(q){
      if(p===q)return;
      // Natural relationship
      var nf=NAT_FRIENDS[p];var nat='neutral';
      if(nf.f.indexOf(q)!==-1)nat='friend';
      else if(nf.e.indexOf(q)!==-1)nat='enemy';
      // Temporal relationship
      var diff=((pHouse[q]-pHouse[p])+12)%12; // 0=same house
      var temp=(diff>=1&&diff<=3)||(diff>=9&&diff<=11)?'friend':'enemy';
      if(diff===0)temp='enemy';
      // Compound (Panchadha Maitri)
      var compound='';
      if(nat==='friend'&&temp==='friend')compound='Best Friend';
      else if(nat==='friend'&&temp==='enemy')compound='Neutral';
      else if(nat==='neutral'&&temp==='friend')compound='Friend';
      else if(nat==='neutral'&&temp==='enemy')compound='Enemy';
      else if(nat==='enemy'&&temp==='friend')compound='Neutral';
      else if(nat==='enemy'&&temp==='enemy')compound='Bitter Enemy';
      rels[p][q]={nat:nat,temp:temp,compound:compound};
    });
  });
  return rels;
}

function renderRelationships(rels){
  var el=document.getElementById('relationships-card');if(!el)return;
  var MAIN7=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  var html='<div class="result-table-wrap"><table class="result-table compact-table rel-table"><thead><tr><th></th>';
  MAIN7.forEach(function(p){html+='<th>'+AV_ABBR[p]+'</th>';});
  html+='</tr></thead><tbody>';
  MAIN7.forEach(function(p){
    html+='<tr><td><strong>'+p+'</strong></td>';
    MAIN7.forEach(function(q){
      if(p===q){html+='<td class="rel-self">—</td>';return;}
      var r=rels[p][q];
      var cls='rel-'+r.compound.toLowerCase().replace(/\s+/g,'-');
      var ab=r.compound==='Best Friend'?'BF':r.compound==='Bitter Enemy'?'BE':r.compound==='Friend'?'F':r.compound==='Enemy'?'E':'N';
      html+='<td class="'+cls+'" title="'+p+' → '+q+': '+r.compound+' (Natural: '+r.nat+', Temporal: '+r.temp+')">'+ab+'</td>';
    });
    html+='</tr>';
  });
  html+='</tbody></table></div>';
  html+='<p class="table-note">BF = Best Friend &nbsp; F = Friend &nbsp; N = Neutral &nbsp; E = Enemy &nbsp; BE = Bitter Enemy<br>Hover for details (Natural + Temporal = Compound relationship)</p>';
  el.innerHTML=html;
}


// ===== REMEDIES DATA =====
var REMEDIES_DATA={
  Sun:{gem:'Ruby (Manik)',color:'Red, Copper, Orange',day:'Sunday',metal:'Gold, Copper',deity:'Lord Surya / Vishnu',mantra:'ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः',mantraEn:'Om Hraam Hreem Hraum Sah Suryaya Namah',charity:'Wheat, jaggery, copper vessel, red cloth',fast:'Sunday fast',rudraksha:'1 Mukhi or 12 Mukhi',direction:'East'},
  Moon:{gem:'Pearl (Moti)',color:'White, Silver, Cream',day:'Monday',metal:'Silver',deity:'Lord Shiva / Parvati',mantra:'ॐ श्रां श्रीं श्रौं सः चन्द्राय नमः',mantraEn:'Om Shraam Shreem Shraum Sah Chandraya Namah',charity:'Rice, white cloth, silver, milk, curd',fast:'Monday fast',rudraksha:'2 Mukhi',direction:'North-West'},
  Mars:{gem:'Red Coral (Moonga)',color:'Red, Scarlet',day:'Tuesday',metal:'Copper, Gold',deity:'Lord Hanuman / Kartikeya',mantra:'ॐ क्रां क्रीं क्रौं सः भौमाय नमः',mantraEn:'Om Kraam Kreem Kraum Sah Bhaumaya Namah',charity:'Red lentils (masoor dal), jaggery, red cloth',fast:'Tuesday fast',rudraksha:'3 Mukhi',direction:'South'},
  Mercury:{gem:'Emerald (Panna)',color:'Green',day:'Wednesday',metal:'Bronze, Brass',deity:'Lord Vishnu / Budh',mantra:'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः',mantraEn:'Om Braam Breem Braum Sah Budhaya Namah',charity:'Green moong dal, green cloth, green vegetables',fast:'Wednesday fast',rudraksha:'4 Mukhi',direction:'North'},
  Jupiter:{gem:'Yellow Sapphire (Pukhraj)',color:'Yellow, Gold',day:'Thursday',metal:'Gold',deity:'Lord Brihaspati / Vishnu',mantra:'ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः',mantraEn:'Om Graam Greem Graum Sah Gurave Namah',charity:'Yellow dal (chana), turmeric, banana, yellow cloth',fast:'Thursday fast',rudraksha:'5 Mukhi',direction:'North-East'},
  Venus:{gem:'Diamond (Heera) / Opal',color:'White, Pink, Multicolor',day:'Friday',metal:'Silver, Platinum',deity:'Goddess Lakshmi / Shukracharya',mantra:'ॐ द्रां द्रीं द्रौं सः शुक्राय नमः',mantraEn:'Om Draam Dreem Draum Sah Shukraya Namah',charity:'White rice, ghee, white cloth, perfume, sugar',fast:'Friday fast',rudraksha:'6 Mukhi',direction:'South-East'},
  Saturn:{gem:'Blue Sapphire (Neelam) / Amethyst',color:'Blue, Black, Dark',day:'Saturday',metal:'Iron, Steel',deity:'Lord Shani / Hanuman',mantra:'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः',mantraEn:'Om Praam Preem Praum Sah Shanaischaraya Namah',charity:'Mustard oil, black sesame, iron, black cloth, urad dal',fast:'Saturday fast',rudraksha:'7 Mukhi or 14 Mukhi',direction:'West'},
  Rahu:{gem:'Hessonite Garnet (Gomed)',color:'Smoky, Brownish',day:'Saturday',metal:'Lead, Mixed metals',deity:'Goddess Durga / Saraswati',mantra:'ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः',mantraEn:'Om Bhraam Bhreem Bhraum Sah Rahave Namah',charity:'Mustard, blanket, coconut, blue cloth',fast:'Saturday fast',rudraksha:'8 Mukhi',direction:'South-West'},
  Ketu:{gem:'Cat\'s Eye (Lehsunia)',color:'Grey, Smoky',day:'Tuesday/Saturday',metal:'Iron, Mixed metals',deity:'Lord Ganesha / Chitragupta',mantra:'ॐ स्रां स्रीं स्रौं सः केतवे नमः',mantraEn:'Om Sraam Sreem Sraum Sah Ketave Namah',charity:'Sesame, seven grains, blanket, dog food',fast:'Tuesday / Saturday fast',rudraksha:'9 Mukhi',direction:'South-West'}
};

function renderRemedies(planetData){
  var el=document.getElementById('remedies-card');if(!el)return;
  var html='';
  // Find weak/afflicted planets (debilitated, enemy sign, combust, retrograde in dusthana)
  var weakPlanets=[],strongPlanets=[];
  planetData.forEach(function(p){
    if(p.name==='Rahu'||p.name==='Ketu')return;
    var d=getDignity(p.name,p.sign,p.totalDeg);
    if(d.status==='Debilitated'||d.status==="Enemy's Sign"||p.combust)weakPlanets.push(p);
    else if(d.status==='Exalted'||d.status==='Own Sign'||d.status==='Moolatrikona')strongPlanets.push(p);
  });

  if(weakPlanets.length){
    html+='<div class="yd-section"><h4 class="yd-heading">Recommended Remedies (for afflicted planets)</h4>';
    weakPlanets.forEach(function(p){
      var r=REMEDIES_DATA[p.name];if(!r)return;
      var d=getDignity(p.name,p.sign,p.totalDeg);
      var reason=[];
      if(d.status==='Debilitated')reason.push('debilitated in '+p.sign);
      if(d.status==="Enemy's Sign")reason.push("in enemy's sign "+p.sign);
      if(p.combust)reason.push('combust');
      html+='<div class="remedy-item"><div class="remedy-header"><strong>'+p.name+'</strong><span class="remedy-reason">('+reason.join(', ')+')</span></div>';
      html+='<div class="remedy-grid">';
      html+='<div class="remedy-detail"><span class="remedy-label">Gemstone</span>'+r.gem+'</div>';
      html+='<div class="remedy-detail"><span class="remedy-label">Mantra</span><span class="remedy-mantra">'+r.mantra+'</span><br><span style="font-size:0.72rem;color:var(--ink-dim)">'+r.mantraEn+'</span></div>';
      html+='<div class="remedy-detail"><span class="remedy-label">Color</span>'+r.color+'</div>';
      html+='<div class="remedy-detail"><span class="remedy-label">Day</span>'+r.day+'</div>';
      html+='<div class="remedy-detail"><span class="remedy-label">Deity</span>'+r.deity+'</div>';
      html+='<div class="remedy-detail"><span class="remedy-label">Charity</span>'+r.charity+'</div>';
      html+='<div class="remedy-detail"><span class="remedy-label">Fasting</span>'+r.fast+'</div>';
      html+='<div class="remedy-detail"><span class="remedy-label">Rudraksha</span>'+r.rudraksha+'</div>';
      html+='</div></div>';
    });
    html+='</div>';
  }

  // Favourable items for strong planets
  html+='<div class="yd-section"><h4 class="yd-heading">Favourable Items (Lucky Gemstones, Colors & Days)</h4>';
  html+='<div class="result-table-wrap"><table class="result-table compact-table"><thead><tr><th>Planet</th><th>Gemstone</th><th>Color</th><th>Day</th><th>Metal</th><th>Direction</th></tr></thead><tbody>';
  PLANETS.forEach(function(name){
    var r=REMEDIES_DATA[name];if(!r)return;
    var d=getDignity(name,''+(planetData.find(function(p){return p.name===name;})||{}).sign,0);
    html+='<tr><td><strong>'+name+'</strong></td><td>'+r.gem+'</td><td>'+r.color+'</td><td>'+r.day+'</td><td>'+r.metal+'</td><td>'+r.direction+'</td></tr>';
  });
  html+='</tbody></table></div></div>';
  el.innerHTML=html;
}


// ===== EXTENDED YOGA DETECTION =====
function computeExtendedYogas(planetData,houses,existingYogas){
  var yogas=existingYogas.slice();
  var pH={},pS={},pD={};
  planetData.forEach(function(p){
    pH[p.name]=parseInt(p.house.replace('House',''),10);
    pS[p.name]=p.sign;
    pD[p.name]=getDignity(p.name,p.sign,p.totalDeg);
  });
  function hLord(n){return houses[n-1]?SIGN_RULER[houses[n-1].sign]||'':'';}
  function conj(a,b){return pH[a]===pH[b];}
  function inKendra(h,ref){var d=((h-ref)+12)%12;return d===0||d===3||d===6||d===9;}
  var moonH=pH['Moon'],sunH=pH['Sun'];

  // Sunapha: planet (not Sun/Rahu/Ketu) in 2nd from Moon
  var h2m=(moonH%12)+1;
  planetData.forEach(function(p){
    if(['Moon','Sun','Rahu','Ketu'].indexOf(p.name)!==-1)return;
    if(pH[p.name]===h2m)yogas.push({name:'Sunapha Yoga',type:'benefic',desc:p.name+' in 2nd from Moon — self-made wealth, intelligence, good reputation.'});
  });
  // Anapha: planet (not Sun/Rahu/Ketu) in 12th from Moon
  var h12m=((moonH-2+12)%12)+1;
  planetData.forEach(function(p){
    if(['Moon','Sun','Rahu','Ketu'].indexOf(p.name)!==-1)return;
    if(pH[p.name]===h12m)yogas.push({name:'Anapha Yoga',type:'benefic',desc:p.name+' in 12th from Moon — healthy, virtuous, well-spoken, famous.'});
  });
  // Durudhara: planets on both sides of Moon (2nd and 12th)
  var has2=false,has12=false;
  planetData.forEach(function(p){if(['Moon','Sun','Rahu','Ketu'].indexOf(p.name)!==-1)return;if(pH[p.name]===h2m)has2=true;if(pH[p.name]===h12m)has12=true;});
  if(has2&&has12)yogas.push({name:'Durudhara Yoga',type:'benefic',desc:'Planets flanking Moon on both sides — wealth, vehicles, generous nature, fame.'});

  // Adhi Yoga: natural benefics in 6,7,8 from Moon
  var advH=[(moonH+5)%12+1,(moonH+6)%12+1,(moonH+7)%12+1];
  var adhiBenefics=0;
  planetData.forEach(function(p){
    if(['Jupiter','Venus','Mercury'].indexOf(p.name)!==-1&&advH.indexOf(pH[p.name])!==-1)adhiBenefics++;
  });
  if(adhiBenefics>=2)yogas.push({name:'Adhi Yoga',type:'benefic',desc:'Benefics in 6th/7th/8th from Moon — polite, trustworthy, affluent, able to defeat adversaries.'});

  // Veshi Yoga: planet (not Moon/Rahu/Ketu) in 2nd from Sun
  var h2s=(sunH%12)+1;
  planetData.forEach(function(p){
    if(['Sun','Moon','Rahu','Ketu'].indexOf(p.name)!==-1)return;
    if(pH[p.name]===h2s){
      var isBenefic=['Jupiter','Venus','Mercury'].indexOf(p.name)!==-1;
      if(isBenefic)yogas.push({name:'Veshi Yoga (Benefic)',type:'benefic',desc:p.name+' in 2nd from Sun — truthful, lazy-free, balanced, happy.'});
    }
  });
  // Voshi Yoga: planet in 12th from Sun
  var h12s=((sunH-2+12)%12)+1;
  planetData.forEach(function(p){
    if(['Sun','Moon','Rahu','Ketu'].indexOf(p.name)!==-1)return;
    if(pH[p.name]===h12s){
      var isBenefic=['Jupiter','Venus','Mercury'].indexOf(p.name)!==-1;
      if(isBenefic)yogas.push({name:'Voshi Yoga (Benefic)',type:'benefic',desc:p.name+' in 12th from Sun — learned, charitable, good memory, skilled.'});
    }
  });
  // Ubhayachari: planets on both sides of Sun
  var sunHas2=false,sunHas12=false;
  planetData.forEach(function(p){if(['Sun','Moon','Rahu','Ketu'].indexOf(p.name)!==-1)return;if(pH[p.name]===h2s)sunHas2=true;if(pH[p.name]===h12s)sunHas12=true;});
  if(sunHas2&&sunHas12)yogas.push({name:'Ubhayachari Yoga',type:'benefic',desc:'Planets on both sides of Sun — king-like, eloquent, handsome, prosperous.'});

  // Chatussagara Yoga: all 4 kendras (1,4,7,10) occupied by planets
  var kendraOcc=[false,false,false,false];
  planetData.forEach(function(p){
    if(p.name==='Rahu'||p.name==='Ketu')return;
    if(pH[p.name]===1)kendraOcc[0]=true;
    if(pH[p.name]===4)kendraOcc[1]=true;
    if(pH[p.name]===7)kendraOcc[2]=true;
    if(pH[p.name]===10)kendraOcc[3]=true;
  });
  if(kendraOcc.every(function(k){return k;}))yogas.push({name:'Chatussagara Yoga',type:'benefic',desc:'All four kendras occupied — fame, long life, pure character, equal to a king.'});

  // Parivartana Yoga: mutual exchange of house lords
  for(var i=1;i<=12;i++){
    var li=hLord(i);if(!li)continue;
    for(var j=i+1;j<=12;j++){
      var lj=hLord(j);if(!lj)continue;
      if(pH[li]===j&&pH[lj]===i){
        var isDusthana=[6,8,12].indexOf(i)!==-1||[6,8,12].indexOf(j)!==-1;
        if(isDusthana)yogas.push({name:'Dainya Parivartana Yoga',type:'challenging',desc:'Exchange between '+i+getSuffix(i)+' and '+j+getSuffix(j)+' house lords ('+li+' ↔ '+lj+') — one involves a dusthana, karmic lessons.'});
        else yogas.push({name:'Maha Parivartana Yoga',type:'benefic',desc:'Mutual exchange of '+i+getSuffix(i)+' and '+j+getSuffix(j)+' house lords ('+li+' ↔ '+lj+') — both houses strengthened, excellent results.'});
      }
    }
  }

  // Guru-Chandal Yoga: Jupiter with Rahu or Ketu
  if(conj('Jupiter','Rahu'))yogas.push({name:'Guru-Chandal Yoga',type:'challenging',desc:'Jupiter conjunct Rahu — unconventional beliefs, breaking traditions. Can give great intelligence if well-placed.'});
  if(conj('Jupiter','Ketu'))yogas.push({name:'Guru-Chandal Yoga (Ketu)',type:'challenging',desc:'Jupiter conjunct Ketu — spiritual inclination but confusion in beliefs. Deep mystical insight possible.'});

  // Shakat Yoga: Jupiter in 6th or 8th from Moon
  var jmDiff=((pH['Jupiter']-moonH)+12)%12;
  if(jmDiff===5||jmDiff===7)yogas.push({name:'Shakata Yoga',type:'challenging',desc:'Jupiter in 6th/8th from Moon — fluctuating fortune, ups and downs in life. Cancelled if Jupiter is in kendra from Lagna.'});

  // Parvata Yoga: benefics in kendras and no malefics in kendras
  var beneficsInKendra=0,maleficsInKendra=0;
  planetData.forEach(function(p){
    if(!inKendra(pH[p.name],1))return;
    if(['Jupiter','Venus','Mercury','Moon'].indexOf(p.name)!==-1)beneficsInKendra++;
    if(['Mars','Saturn','Rahu','Ketu'].indexOf(p.name)!==-1)maleficsInKendra++;
  });
  if(beneficsInKendra>=2&&maleficsInKendra===0)yogas.push({name:'Parvata Yoga',type:'benefic',desc:'Benefics in kendras without malefic influence — wealthy, charitable, leader, long-lived.'});

  // Kahala Yoga: 4th lord and Jupiter in mutual kendras
  var l4=hLord(4);
  if(l4&&inKendra(pH[l4],pH['Jupiter'])&&pH[l4]!==pH['Jupiter'])yogas.push({name:'Kahala Yoga',type:'benefic',desc:'4th lord and Jupiter in mutual kendras — stubborn, brave, heads a small army or team, daring.'});

  // Budh-Aditya Yoga strength check (already detected, enhance if in good houses)
  // Chandra-Mangal already detected

  // Vasumati Yoga: benefics in upachaya houses (3,6,10,11)
  var upachayaBenefics=0;
  planetData.forEach(function(p){
    if(['Jupiter','Venus','Mercury'].indexOf(p.name)===-1)return;
    if([3,6,10,11].indexOf(pH[p.name])!==-1)upachayaBenefics++;
  });
  if(upachayaBenefics>=3)yogas.push({name:'Vasumati Yoga',type:'benefic',desc:'Benefics in upachaya houses (3/6/10/11) — ever-growing wealth, prosperous.'});

  // Shubh Kartari Yoga on Lagna: benefics in 2nd and 12th from Lagna
  var b2=false,b12=false,m2=false,m12=false;
  planetData.forEach(function(p){
    var isBen=['Jupiter','Venus','Mercury'].indexOf(p.name)!==-1;
    var isMal=['Mars','Saturn','Rahu','Ketu'].indexOf(p.name)!==-1;
    if(pH[p.name]===2){if(isBen)b2=true;if(isMal)m2=true;}
    if(pH[p.name]===12){if(isBen)b12=true;if(isMal)m12=true;}
  });
  if(b2&&b12&&!m2&&!m12)yogas.push({name:'Shubh Kartari Yoga',type:'benefic',desc:'Benefics flanking the Ascendant (in 2nd and 12th) — protected, fortunate, auspicious personality.'});
  if(m2&&m12&&!b2&&!b12)yogas.push({name:'Papa Kartari Yoga',type:'challenging',desc:'Malefics flanking the Ascendant (in 2nd and 12th) — obstacles, restrictions, feeling hemmed in. Requires perseverance.'});

  // Sasa Yoga / Ruchaka / etc already covered in base yogas

  // Deduplicate
  var seen={};yogas=yogas.filter(function(y){var key=y.name+y.desc.substring(0,30);if(seen[key])return false;seen[key]=true;return true;});
  return yogas;
}


// ===== PREDICTIONS BY LIFE AREA =====
function computePredictions(planetData,houses,yogas,mangalDosha){
  var pH={},pD={};
  planetData.forEach(function(p){
    pH[p.name]=parseInt(p.house.replace('House',''),10);
    pD[p.name]=getDignity(p.name,p.sign,p.totalDeg);
  });
  function hLord(n){return houses[n-1]?SIGN_RULER[houses[n-1].sign]||'':'';}
  function lordStrength(n){var l=hLord(n);return l?pD[l]:{status:''};}
  function planetsIn(n){return planetData.filter(function(p){return pH[p.name]===n;});}

  var preds={};

  // CAREER (10th house)
  var l10=hLord(10),l10d=lordStrength(10),p10=planetsIn(10);
  var careerText='Your 10th house (Karma Bhava) is ruled by <strong>'+l10+'</strong>';
  if(l10d.status)careerText+=' which is '+l10d.status.toLowerCase()+' in your chart';
  careerText+='. ';
  if(p10.length){careerText+='With '+p10.map(function(p){return p.name;}).join(', ')+' influencing your career house, ';}
  if(l10d.status==='Exalted'||l10d.status==='Own Sign')careerText+='you have strong professional potential — leadership and recognition come naturally.';
  else if(l10d.status==='Debilitated'||l10d.status==="Enemy's Sign")careerText+='career growth may require extra effort and patience. Remedies for '+l10+' can help.';
  else careerText+='your career path is steady with room for growth through focused effort.';
  if(p10.some(function(p){return p.name==='Saturn';}))careerText+=' Saturn in 10th gives slow but lasting success through discipline and hard work.';
  if(p10.some(function(p){return p.name==='Jupiter';}))careerText+=' Jupiter in 10th is highly auspicious — wisdom, ethics and expansion in profession.';
  if(p10.some(function(p){return p.name==='Sun';}))careerText+=' Sun in 10th gives authority, government connections, and leadership roles.';
  preds.career=careerText;

  // MARRIAGE (7th house)
  var l7=hLord(7),l7d=lordStrength(7),p7=planetsIn(7);
  var marriageText='Your 7th house (Kalatra Bhava) is ruled by <strong>'+l7+'</strong>';
  if(l7d.status)marriageText+=' which is '+l7d.status.toLowerCase();
  marriageText+='. ';
  var venusD=pD['Venus'];
  if(venusD.status==='Exalted'||venusD.status==='Own Sign')marriageText+='Venus (marriage karaka) is strong — harmonious relationships and marital happiness indicated. ';
  else if(venusD.status==='Debilitated')marriageText+='Venus is debilitated — relationships may face challenges. Venus remedies recommended. ';
  if(mangalDosha&&mangalDosha.present){
    marriageText+='Mangal Dosha is present'+(mangalDosha.cancelled?' but cancelled/weakened':'— matching with a compatible partner is advised')+'. ';
  }
  if(p7.some(function(p){return p.name==='Saturn';}))marriageText+='Saturn in 7th may delay marriage but brings a mature, lasting partnership.';
  else if(p7.some(function(p){return p.name==='Jupiter';}))marriageText+='Jupiter\'s aspect on the 7th house blesses marriage with wisdom, trust and devotion.';
  preds.marriage=marriageText;

  // WEALTH (2nd + 11th)
  var l2=hLord(2),l11=hLord(11);
  var wealthText='Your wealth houses are ruled by <strong>'+l2+'</strong> (2nd — savings) and <strong>'+l11+'</strong> (11th — gains). ';
  var jupD=pD['Jupiter'];
  if(jupD.status==='Exalted'||jupD.status==='Own Sign')wealthText+='Jupiter (wealth karaka) is strong — excellent financial potential. ';
  else if(jupD.status==='Debilitated')wealthText+='Jupiter is weak — wealth accumulation may require more effort. ';
  var dhanaYoga=yogas.some(function(y){return y.name==='Dhana Yoga';});
  if(dhanaYoga)wealthText+='Dhana Yoga present — strong potential for wealth creation. ';
  var lakshmYoga=yogas.some(function(y){return y.name==='Lakshmi Yoga';});
  if(lakshmYoga)wealthText+='Lakshmi Yoga blesses with fortune and prosperity. ';
  wealthText+='Focus on '+lordStrength(2).status==='Exalted'||lordStrength(2).status==='Own Sign'?'growing your savings — your 2nd lord is well-placed.':'strengthening your financial foundation through disciplined saving.';
  preds.wealth=wealthText;

  // HEALTH (Lagna + 6th)
  var l1=hLord(1),l6=hLord(6),l1d=lordStrength(1);
  var healthText='Your Lagna lord <strong>'+l1+'</strong> is '+((l1d.status||'placed')).toLowerCase()+'. ';
  var sunD=pD['Sun'],moonD=pD['Moon'];
  if(sunD.status==='Exalted'||sunD.status==='Own Sign')healthText+='Strong Sun gives vitality and robust constitution. ';
  if(moonD.status==='Debilitated')healthText+='Debilitated Moon may cause mental stress — meditation and Moon remedies can help. ';
  if(l1d.status==='Exalted'||l1d.status==='Own Sign')healthText+='Strong Lagna lord indicates good overall health and recovery power.';
  else if(l1d.status==='Debilitated')healthText+='Weakened Lagna lord suggests paying attention to health. Regular exercise and the right remedies are advised.';
  else healthText+='Your constitution is moderate — maintain health through balanced lifestyle.';
  preds.health=healthText;

  // EDUCATION (4th + 5th)
  var l4=hLord(4),l5=hLord(5);
  var eduText='Your education houses are ruled by <strong>'+l4+'</strong> (4th) and <strong>'+l5+'</strong> (5th). ';
  var mercD=pD['Mercury'];
  if(mercD.status==='Exalted'||mercD.status==='Own Sign')eduText+='Mercury (intellect karaka) is strong — sharp mind, excellent learning capacity, analytical ability. ';
  else if(mercD.status==='Debilitated')eduText+='Mercury is weak — may face challenges in academics. Extra focus needed. ';
  if(jupD.status==='Exalted'||jupD.status==='Own Sign')eduText+='Strong Jupiter supports higher education, wisdom, and teaching abilities. ';
  var budhaditya=yogas.some(function(y){return y.name==='Budhaditya Yoga';});
  if(budhaditya)eduText+='Budhaditya Yoga enhances intelligence and academic success. ';
  var saraswati=yogas.some(function(y){return y.name==='Saraswati Yoga';});
  if(saraswati)eduText+='Saraswati Yoga — exceptional talent in learning, arts, and sciences.';
  else eduText+='Consistent effort will yield good academic results.';
  preds.education=eduText;

  return preds;
}

function renderPredictions(preds){
  var el=document.getElementById('predictions-card');if(!el)return;
  var areas=[
    {key:'career',icon:'◉',title:'Career & Profession'},
    {key:'wealth',icon:'◈',title:'Wealth & Finance'},
    {key:'marriage',icon:'◎',title:'Marriage & Relationships'},
    {key:'health',icon:'◇',title:'Health & Vitality'},
    {key:'education',icon:'◆',title:'Education & Learning'}
  ];
  var html='';
  areas.forEach(function(a){
    if(!preds[a.key])return;
    html+='<div class="pred-item"><div class="pred-header"><span class="pred-icon">'+a.icon+'</span><strong>'+a.title+'</strong></div><p class="pred-text">'+preds[a.key]+'</p></div>';
  });
  el.innerHTML=html;
}


// ===== PDF EXPORT =====
function exportPDF(){
  var resultsView=document.getElementById('tools-results-view');
  if(!resultsView)return;
  // Hide buttons and non-print elements
  var btns=resultsView.querySelectorAll('.btn, .result-cta, #current-dasha-summary');
  btns.forEach(function(b){b.setAttribute('data-was-visible',b.style.display||'');b.style.display='none';});
  window.print();
  // Restore
  setTimeout(function(){btns.forEach(function(b){b.style.display=b.getAttribute('data-was-visible')||'';b.removeAttribute('data-was-visible');});},500);
}


// ===== DASHA (interactive 4-level drill-down) =====
var DASHA_LEVEL_NAMES=['Mahadasha','Antardasha','Pratyantardasha','Sookshmadasha'];

function renderDasha(data){
  var el=document.getElementById('dasha-content');
  if(!data){el.innerHTML='<p style="color:var(--ink-dim)">Dasha data unavailable.</p>';return;}
  var raw=data.DasaAtRange||data.DasaForNow||data;
  if(typeof raw==='string'){try{raw=JSON.parse(raw);}catch(e){}}
  if(!raw||typeof raw!=='object'||Array.isArray(raw)){el.innerHTML='<p style="color:var(--ink-dim)">Dasha data unavailable.</p>';return;}
  el.innerHTML='';
  var now=new Date();
  var tree=document.createElement('div');tree.className='dasha-tree';

  // Level 0: Mahadashas
  for(var key in raw){
    var d=raw[key];if(!d||typeof d!=='object')continue;
    var lord=d.Lord||key;
    var isCurr=isPeriodCurrent(d,now);
    var node=buildDashaNode(lord,[lord],d,0,isCurr,now);
    tree.appendChild(node);
  }
  el.appendChild(tree);
}

function buildDashaNode(label,path,period,level,isCurrent,now){
  var node=document.createElement('div');node.className='dasha-node';
  var row=document.createElement('div');
  row.className='dasha-row dasha-level-'+level+(isCurrent?' dasha-row-current':'');
  row.style.paddingLeft=(level*1.2)+'rem';
  if(level<3)row.style.cursor='pointer';
  var arrow=level<3?'<span class="dasha-arrow">&#9654;</span>':'<span style="width:0.7rem;display:inline-block"></span>';
  var marker=isCurrent?' <span class="dasha-now">◄</span>':'';
  var levelTag='<span class="dasha-level-tag">'+DASHA_LEVEL_NAMES[level].substring(0,2)+'</span>';
  row.innerHTML=arrow+levelTag+'<strong title="'+pTitle(period.Lord||label)+'">'+label+'</strong><span class="dasha-dates">'+fmtDasaDate(period.Start)+' — '+fmtDasaDate(period.End)+'</span>'+marker;
  node.appendChild(row);

  // For Level 0 (Mahadasha): SubDasas already in data → build children immediately but hidden
  if(level===0&&period.SubDasas){
    var childWrap=document.createElement('div');childWrap.className='dasha-children';childWrap.style.display='none';
    for(var sk in period.SubDasas){
      var s=period.SubDasas[sk];if(!s||typeof s!=='object')continue;
      var sLord=s.Lord||sk;
      var sc=isPeriodCurrent(s,now);
      var childNode=buildDashaNode(path[0]+'-'+sLord,path.concat(sLord),s,1,sc,now);
      childWrap.appendChild(childNode);
    }
    node.appendChild(childWrap);
    row.addEventListener('click',function(evt){evt.stopPropagation();toggleDashaChildren(node);});
  }
  // For Level 1-2: lazy load via API on click
  else if(level>=1&&level<3){
    row.addEventListener('click',(function(nd,per,pth,lvl){return function(evt){
      evt.stopPropagation();
      var existing=nd.querySelector(':scope > .dasha-children');
      if(existing){toggleDashaChildren(nd);return;}
      loadSubDasha(nd,per,pth,lvl+1);
    };})(node,period,path,level));
  }
  return node;
}

function toggleDashaChildren(node){
  var wrap=node.querySelector(':scope > .dasha-children');if(!wrap)return;
  var showing=wrap.style.display!=='none';
  wrap.style.display=showing?'none':'block';
  var arrow=node.querySelector(':scope > .dasha-row .dasha-arrow');
  if(arrow)arrow.innerHTML=showing?'&#9654;':'&#9660;';
}

async function loadSubDasha(parentNode,parentPeriod,path,targetLevel){
  if(!birthEp||!parentPeriod.Start||!parentPeriod.End)return;
  var arrow=parentNode.querySelector(':scope > .dasha-row .dasha-arrow');
  if(arrow)arrow.innerHTML='<span class="loader-spinner-sm"></span>';
  try{
    var startP=dashaTimeToParam(parentPeriod.Start);
    var endP=dashaTimeToParam(parentPeriod.End);
    if(!startP||!endP){if(arrow)arrow.innerHTML='·';return;}
    var apiLevels=targetLevel+1;
    var resp=await callAPI('DasaAtRange/'+birthEp+'/'+startP+'/'+endP+'/Levels/'+apiLevels+'/PrecisionHours/1');
    var raw=resp.DasaAtRange||resp;
    if(typeof raw==='string')raw=JSON.parse(raw);
    // Collect all periods at the deepest level of the response
    var periods=collectDeepest(raw,targetLevel);
    if(!periods||!periods.length){if(arrow)arrow.innerHTML='·';return;}
    var now=new Date();
    var childWrap=document.createElement('div');childWrap.className='dasha-children';
    periods.forEach(function(p){
      var lord=p.Lord||'?';
      var label=path.join('-')+'-'+lord;
      var pc=isPeriodCurrent(p,now);
      var childNode=buildDashaNode(label,path.concat(lord),p,targetLevel,pc,now);
      childWrap.appendChild(childNode);
    });
    parentNode.appendChild(childWrap);
    if(arrow)arrow.innerHTML='&#9660;';
  }catch(e){
    console.warn('Dasha drill-down failed:',e);
    if(arrow)arrow.innerHTML='&#9654;';
  }
}

function dashaTimeToParam(timeStr){
  if(!timeStr||!birthEp)return null;
  var m=timeStr.match(/(\d{2}:\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})\s+([+-]\d{2}:\d{2})/);
  if(!m)return null;
  var locPart=birthEp.split('/Time/')[0];
  return locPart+'/Time/'+m[1]+'/'+m[2]+'/'+m[3]+'/'+m[4]+'/'+m[5];
}

function collectDeepest(raw,targetLevel){
  // API returns nested tree. We need ALL items at targetLevel depth.
  // Level 0 = top keys, Level 1 = SubDasas of level 0, Level 2 = SubDasas of level 1, etc.
  // targetLevel tells us the depth of children we want.
  var items=[];
  // Convert top-level object to array
  var topList=[];
  for(var k in raw){var d=raw[k];if(d&&typeof d==='object')topList.push(d);}
  if(targetLevel<=0)return topList;
  // Recurse: collect at depth
  function dig(list,depth){
    list.forEach(function(node){
      if(!node||typeof node!=='object')return;
      if(depth===0){items.push(node);return;}
      if(node.SubDasas){
        var sub=[];
        for(var sk in node.SubDasas){var s=node.SubDasas[sk];if(s&&typeof s==='object')sub.push(s);}
        dig(sub,depth-1);
      }
    });
  }
  dig(topList,targetLevel);
  return items;
}

function fmtDasaDate(raw){if(!raw)return '';var m=raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);return m?m[1]+'/'+m[2]+'/'+m[3]:raw;}
function isPeriodCurrent(d,now){try{var sm=d.Start.match(/(\d{2})\/(\d{2})\/(\d{4})/);var em=d.End.match(/(\d{2})\/(\d{2})\/(\d{4})/);if(!sm||!em)return false;return now>=new Date(+sm[3],sm[2]-1,+sm[1])&&now<=new Date(+em[3],em[2]-1,+em[1]);}catch(x){return false;}}


// ===== COMPATIBILITY =====
async function generateCompatibility(e){
  e.preventDefault();hideError('compat-error');setLoading('compat-submit',true);
  try{
    var mlt=getLocTime('male'),flt=getLocTime('female');
    var payload=await callAPI('MatchReport/'+locTimeStr(mlt)+'/'+locTimeStr(flt));
    var mn=document.getElementById('male-name').value.trim(),fn=document.getElementById('female-name').value.trim();
    showResults('Marriage Compatibility',mn+' & '+fn);
    document.getElementById('compat-results').style.display='block';
    renderCompat(payload);
  }catch(err){showError('compat-error',err.message||'Failed. Check details and try again.');}
  finally{setLoading('compat-submit',false);}
}
function renderCompat(data){
  var report=data.MatchReport||data;
  var score=report.KutaScore||0,out36=Math.round((score/100)*36);
  var color=score>=60?'var(--patina)':score>=40?'var(--gold-ink)':'var(--vermillion)';
  document.getElementById('compat-score-num').textContent=out36;
  document.getElementById('compat-score-num').style.color=color;
  document.getElementById('compat-score-summary').textContent=score>=80?'Excellent Match':score>=60?'Good Compatibility':score>=40?'Average Compatibility':score>=20?'Below Average':'Challenging Match';
  document.getElementById('compat-score-desc').textContent=(report.Summary&&report.Summary.ScoreSummary)||'';
  var preds=report.PredictionList||[];
  var mainKutas=['Nadi','Rasi','Guna','Graha Maitram','Yoni','Dina','Vasya','Varna'];
  var tbody=document.querySelector('#compat-table tbody');tbody.innerHTML='';
  var extras=[];
  preds.forEach(function(p){
    var name=p.Name||'',nature=p.Nature||'',cls=nature==='Good'?'nature-good':nature==='Bad'?'nature-bad':'nature-neutral';
    if(mainKutas.some(function(k){return name.toLowerCase().includes(k.toLowerCase());})){
      tbody.innerHTML+='<tr><td><strong>'+name+'</strong></td><td><span class="'+cls+'">'+(nature==='Empty'?'—':nature)+'</span></td><td>'+(p.MaleInfo||'—')+'</td><td>'+(p.FemaleInfo||'—')+'</td><td>'+(p.Description||p.Info||'')+'</td></tr>';
    }else{extras.push(p);}
  });
  var extraSec=document.getElementById('compat-extra-section'),extraEl=document.getElementById('compat-extra-content');
  if(extras.length){
    extraSec.style.display='block';
    extraEl.innerHTML=extras.map(function(p){
      var nature=p.Nature||'',cls=nature==='Good'?'prediction-good':nature==='Bad'?'prediction-bad':'prediction-neutral';
      return '<div class="prediction-item '+cls+'"><div class="prediction-header"><strong>'+(p.Name||'')+'</strong>'+(nature&&nature!=='Empty'?'<span class="prediction-nature">'+nature+'</span>':'')+'</div>'+(p.Info?'<p>'+p.Info+'</p>':'')+'</div>';
    }).join('');
  }else{extraSec.style.display='none';}
}
