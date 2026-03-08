// ===== VedAstro Tools | Nidarshana Vedh =====
var API = 'https://api.vedastro.org/api/Calculate';
var NOM = 'https://nominatim.openstreetmap.org/search';

var SIGNS_ORDER = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
var SIGN_ABBR = {Aries:'Ar',Taurus:'Ta',Gemini:'Ge',Cancer:'Cn',Leo:'Le',Virgo:'Vi',Libra:'Li',Scorpio:'Sc',Sagittarius:'Sg',Capricorn:'Cp',Aquarius:'Aq',Pisces:'Pi'};
var PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
var HOUSE_NAMES = ['1st (Lagna)','2nd (Dhana)','3rd (Sahaja)','4th (Sukha)','5th (Putra)','6th (Shatru)','7th (Kalatra)','8th (Ayu)','9th (Dharma)','10th (Karma)','11th (Labha)','12th (Vyaya)'];
var KARAKA_NAMES = ['AK','AmK','BK','MK','PuK','GK','DK','PiK'];
var KARAKA_FULL = {AK:'Atmakaraka (Soul)',AmK:'Amatyakaraka (Career)',BK:'Bhratrukaraka (Siblings)',MK:'Matrukaraka (Mother)',PuK:'Putrakaraka (Children)',GK:'Gnatikaraka (Obstacles)',DK:'Darakaraka (Spouse)',PiK:'Pitrukaraka (Father)'};

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
async function callAPI(ep){var r=await fetch(API+'/'+ep);if(!r.ok)throw new Error('API error '+r.status);var d=await r.json();if(d.Status!=='Pass')throw new Error(d.Payload||'Calculation failed');return d.Payload;}
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
  e.preventDefault();hideError('bc-error');setLoading('bc-submit',true);
  var name=document.getElementById('bc-name').value.trim();
  var lt=getLocTime('bc');
  var ep=locTimeStr(lt);

  try{
    var calls={};
    // Main planet data
    calls.d1=callAPI('PlanetRasiD1Sign/PlanetName/All/'+ep);
    calls.nak=callAPI('PlanetConstellation/PlanetName/All/'+ep);
    calls.house=callAPI('HousePlanetOccupiesBasedOnSign/PlanetName/All/'+ep);
    calls.d9=callAPI('PlanetNavamshaD9Sign/PlanetName/All/'+ep);
    calls.retro=callAPI('IsPlanetRetrograde/PlanetName/All/'+ep);
    calls.combust=callAPI('IsPlanetCombust/PlanetName/All/'+ep);
    calls.avasta=callAPI('PlanetAvasta/PlanetName/All/'+ep);
    // House data
    calls.hSign=callAPI('HouseSignName/HouseName/All/'+ep);
    calls.hLord=callAPI('LordOfHouse/HouseName/All/'+ep);
    calls.hNak=callAPI('HouseConstellation/HouseName/All/'+ep);
    calls.hPlanets=callAPI('PlanetsInHouseBasedOnSign/HouseName/All/'+ep);
    calls.ascDeg=callAPI('HouseRasiSign/HouseName/House1/'+ep);
    // Upagraha data (individual calls)
    UPAGRAHAS.forEach(function(u){
      calls['u_d1_'+u]=callAPI('PlanetRasiD1Sign/PlanetName/'+u+'/'+ep).catch(function(){return null;});
      calls['u_nak_'+u]=callAPI('PlanetConstellation/PlanetName/'+u+'/'+ep).catch(function(){return null;});
      calls['u_house_'+u]=callAPI('HousePlanetOccupiesBasedOnSign/PlanetName/'+u+'/'+ep).catch(function(){return null;});
      calls['u_d9_'+u]=callAPI('PlanetNavamshaD9Sign/PlanetName/'+u+'/'+ep).catch(function(){return null;});
    });

    var keys=Object.keys(calls);
    var results=await Promise.all(keys.map(function(k){return calls[k];}));
    var data={};
    keys.forEach(function(k,i){data[k]=results[i];});

    birthEp=ep; // store for dasha drill-down
    var h=document.getElementById('bc-hour').value,m=document.getElementById('bc-minute').value,ap=document.getElementById('bc-ampm').value;
    showResults('Kundali of '+name, lt.day+'/'+lt.month+'/'+lt.year+' at '+h+':'+m+' '+ap+' — '+lt.place);
    document.getElementById('kundali-results').style.display='block';
    renderKundali(data);

    // Load dasha async (don't block chart rendering)
    var endYr=String(parseInt(lt.year)+100);
    document.getElementById('dasha-content').innerHTML='<p style="color:var(--ink-dim)">Loading Dasha data...</p>';
    callAPI('DasaAtRange/'+ep+'/'+ep+'/'+locTimeStrYear(lt,endYr)+'/Levels/2/PrecisionHours/720')
      .then(function(dashaData){renderDasha(dashaData);})
      .catch(function(){document.getElementById('dasha-content').innerHTML='<p style="color:var(--ink-dim)">Dasha data unavailable. Try refreshing.</p>';});
  }catch(err){
    showError('bc-error',err.message||'Failed to generate. Check birth details and try again.');
  }finally{setLoading('bc-submit',false);}
}


function renderKundali(data){
  // === MAIN PLANETS ===
  var d1Arr=data.d1.PlanetRasiD1Sign||[];
  var nakArr=data.nak.PlanetConstellation||[];
  var houseArr=data.house.HousePlanetOccupiesBasedOnSign||[];
  var d9Arr=data.d9.PlanetNavamshaD9Sign||[];
  var retroArr=data.retro.IsPlanetRetrograde||[];
  var combustArr=data.combust.IsPlanetCombust||[];
  var avastaArr=data.avasta.PlanetAvasta||[];

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

  // === UPAGRAHAS ===
  var upaData=[];
  UPAGRAHAS.forEach(function(u){
    try{
      var d1Raw=data['u_d1_'+u];var nakRaw=data['u_nak_'+u];var houseRaw=data['u_house_'+u];var d9Raw=data['u_d9_'+u];
      if(!d1Raw)return;
      var d1=d1Raw.PlanetRasiD1Sign;
      var sign=(d1&&d1.Name)||'';
      var deg='',totalDeg=0;
      if(d1&&d1.DegreesIn){deg=d1.DegreesIn.DegreeMinuteSecond||'';totalDeg=parseFloat(d1.DegreesIn.TotalDegrees)||0;}
      var nak=(nakRaw&&nakRaw.PlanetConstellation)||'';
      var house=(houseRaw&&houseRaw.HousePlanetOccupiesBasedOnSign)||'';
      var navSign='',navDeg=0;
      if(d9Raw){var d9=d9Raw.PlanetNavamshaD9Sign;if(d9&&typeof d9==='object'){navSign=d9.Name||'';if(d9.DegreesIn)navDeg=parseFloat(d9.DegreesIn.TotalDegrees)||0;}}
      upaData.push({name:u,sign:sign,degree:deg,totalDeg:totalDeg,nakshatra:nak,house:house,navSign:navSign,navDeg:navDeg});
    }catch(e){}
  });

  // === ASCENDANT ===
  var ascDeg='',ascTotalDeg=0;
  try{var ar=data.ascDeg.HouseRasiSign;if(ar&&ar.DegreesIn){ascDeg=ar.DegreesIn.DegreeMinuteSecond||'';ascTotalDeg=parseFloat(ar.DegreesIn.TotalDegrees)||0;}}catch(e){}

  // === HOUSES ===
  var hSignArr=data.hSign.HouseSignName||[];
  var hLordArr=data.hLord.LordOfHouse||[];
  var hNakArr=data.hNak.HouseConstellation||[];
  var hPlanetArr=data.hPlanets.PlanetsInHouseBasedOnSign||[];

  var houses=[];
  for(var i=1;i<=12;i++){
    var hk='House'+i;
    var sign=pick(hSignArr,hk)||'';
    var lord=pick(hLordArr,hk);lord=(lord&&typeof lord==='object')?lord.Name:(lord||'');
    houses.push({sign:sign,lord:lord,nakshatra:pick(hNakArr,hk)||'',planets:pick(hPlanetArr,hk)||[]});
  }

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

  // === RASHI CHART ===
  var rSigns=[],rPlanets=[],rDegs={},rUpa={};
  for(var i=0;i<12;i++){rSigns.push(houses[i].sign);rPlanets.push([]);rUpa[i]=[];}
  planetData.forEach(function(p){
    var hIdx=parseInt(p.house.replace('House',''),10)-1;
    if(hIdx>=0&&hIdx<12){rPlanets[hIdx].push(p.name);rDegs[p.name]=p.totalDeg;}
  });
  upaData.forEach(function(u){
    var hIdx=parseInt(u.house.replace('House',''),10)-1;
    if(hIdx>=0&&hIdx<12)rUpa[hIdx].push({name:u.name,deg:u.totalDeg});
  });
  drawChart('rashi-chart',rSigns,rPlanets,rDegs,rUpa);

  // === NAVAMSA CHART ===
  var d9Idx=SIGNS_ORDER.indexOf(d9LagnaSign);if(d9Idx===-1)d9Idx=0;
  var nSigns=[],nPlanets=[],nDegs={},nUpa={};
  for(var i=0;i<12;i++){nSigns.push(SIGNS_ORDER[(d9Idx+i)%12]);nPlanets.push([]);nUpa[i]=[];}
  planetData.forEach(function(p){
    if(!p.navSign)return;
    var sIdx=SIGNS_ORDER.indexOf(p.navSign);if(sIdx===-1)return;
    nPlanets[(sIdx-d9Idx+12)%12].push(p.name);nDegs[p.name]=p.navDeg;
  });
  upaData.forEach(function(u){
    if(!u.navSign)return;
    var sIdx=SIGNS_ORDER.indexOf(u.navSign);if(sIdx===-1)return;
    nUpa[(sIdx-d9Idx+12)%12].push({name:u.name,deg:u.navDeg});
  });
  drawChart('navamsa-chart',nSigns,nPlanets,nDegs,nUpa);

  // === CHART HOVER ASPECTS ===
  setupChartHover('rashi-chart');
  setupChartHover('navamsa-chart');

  // === PLANET TABLE ===
  var tbody=document.querySelector('#planets-table tbody');
  tbody.innerHTML='';

  // Ascendant row
  var ascNak=houses[0].nakshatra||'',ascNakName=ascNak,ascPada='';
  if(ascNak.indexOf(' - ')!==-1){var sp=ascNak.split(' - ');ascNakName=sp[0].trim();ascPada=sp[1].trim();}
  tbody.innerHTML+='<tr><td><strong title="Ascendant — लग्न (Lagna)">Ascendant</strong></td><td></td><td></td><td>'+houses[0].sign+'</td><td>'+fmtDeg(ascDeg)+'</td><td>'+ascNakName+'</td><td>'+ascPada+'</td><td></td><td></td></tr>';

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

    var tr=document.createElement('tr');
    tr.setAttribute('data-planet',p.name);
    tr.setAttribute('data-house-idx',hIdx);
    tr.innerHTML='<td><strong title="'+pTitle(p.name)+'">'+p.name+'</strong></td><td>'+cMark+'</td><td>'+rMark+'</td><td>'+p.sign+'</td><td>'+fmtDeg(p.degree)+'</td><td>'+nakName+'</td><td>'+pada+'</td><td>'+(karakaTitle||'')+'</td><td title="'+p.avastha+'">'+p.avastha+'</td>';
    tbody.appendChild(tr);
  });

  // Upagraha section (collapsible)
  if(upaData.length){
    var upaToggle=document.createElement('tr');
    upaToggle.className='upa-separator';
    upaToggle.style.cursor='pointer';
    upaToggle.innerHTML='<td colspan="9"><span class="upa-toggle-icon">&#9654;</span> Upagrahas (Sub-Planets) <span style="font-weight:400;font-size:0.55rem;letter-spacing:0;text-transform:none;opacity:0.6">— click to expand</span></td>';
    tbody.appendChild(upaToggle);

    var upaRows=[];
    upaData.forEach(function(u){
      var nakName=u.nakshatra,pada='';
      if(u.nakshatra.indexOf(' - ')!==-1){var sp=u.nakshatra.split(' - ');nakName=sp[0].trim();pada=sp[1].trim();}
      var tr=document.createElement('tr');
      tr.className='upa-row';
      tr.style.display='none';
      tr.innerHTML='<td title="'+pTitle(u.name)+'">'+u.name+'</td><td></td><td></td><td>'+u.sign+'</td><td>'+fmtDeg(u.degree)+'</td><td>'+nakName+'</td><td>'+pada+'</td><td></td><td></td>';
      tbody.appendChild(tr);
      upaRows.push(tr);
    });

    var upaOpen=false;
    upaToggle.addEventListener('click',function(){
      upaOpen=!upaOpen;
      upaToggle.querySelector('.upa-toggle-icon').innerHTML=upaOpen?'&#9660;':'&#9654;';
      upaRows.forEach(function(r){r.style.display=upaOpen?'':'none';});
    });
  }

  // === HOUSE TABLE ===
  var htb=document.querySelector('#houses-table tbody');
  htb.innerHTML='';
  houses.forEach(function(h,i){
    // Combine main planets + upagrahas for this house
    var allPlanets=rPlanets[i].slice();
    rUpa[i].forEach(function(u){allPlanets.push(u.name);});
    var pls=allPlanets.length?allPlanets.join(', '):'—';
    htb.innerHTML+='<tr><td><strong>'+HOUSE_NAMES[i]+'</strong></td><td>'+h.sign+'</td><td>'+h.lord+'</td><td>'+h.nakshatra+'</td><td>'+pls+'</td></tr>';
  });
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
