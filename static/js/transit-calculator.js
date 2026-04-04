/* ============================================
   VEDIC TRANSIT CALCULATOR
   Computes approximate sidereal planetary positions
   for the current date using simplified astronomical
   algorithms (Meeus / VSOP87 simplified).

   Accuracy: ~1-2° for outer planets, ~2-3° for
   inner planets, ~1-3° for Moon.
   Sufficient for transit display purposes.
   ============================================ */

var TransitCalc = (function () {
  'use strict';

  var DEG = Math.PI / 180;
  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function norm180(x) { x = norm360(x); return x > 180 ? x - 360 : x; }
  function sinD(x) { return Math.sin(x * DEG); }
  function cosD(x) { return Math.cos(x * DEG); }
  function atan2D(y, x) { return Math.atan2(y, x) / DEG; }

  /* ── Nakshatra data ──────────────────────────── */
  var NAKSHATRAS = [
    { name:'Ashwini', ruler:'Ketu', deity:'Ashwini Kumaras' },
    { name:'Bharani', ruler:'Venus', deity:'Yama (God of Death)' },
    { name:'Krittika', ruler:'Sun', deity:'Agni (God of Fire)' },
    { name:'Rohini', ruler:'Moon', deity:'Brahma (Creator)' },
    { name:'Mrigashira', ruler:'Mars', deity:'Soma (Moon God)' },
    { name:'Ardra', ruler:'Rahu', deity:'Rudra (Storm God)' },
    { name:'Punarvasu', ruler:'Jupiter', deity:'Aditi (Mother of Gods)' },
    { name:'Pushya', ruler:'Saturn', deity:'Brihaspati (Guru)' },
    { name:'Ashlesha', ruler:'Mercury', deity:'Nagas (Serpent Deities)' },
    { name:'Magha', ruler:'Ketu', deity:'Pitris (Ancestors)' },
    { name:'Purva Phalguni', ruler:'Venus', deity:'Bhaga (God of Fortune)' },
    { name:'Uttara Phalguni', ruler:'Sun', deity:'Aryaman (God of Patronage)' },
    { name:'Hasta', ruler:'Moon', deity:'Savitar (Sun God)' },
    { name:'Chitra', ruler:'Mars', deity:'Tvashtar (Cosmic Architect)' },
    { name:'Swati', ruler:'Rahu', deity:'Vayu (Wind God)' },
    { name:'Vishakha', ruler:'Jupiter', deity:'Indra-Agni' },
    { name:'Anuradha', ruler:'Saturn', deity:'Mitra (God of Friendship)' },
    { name:'Jyeshtha', ruler:'Mercury', deity:'Indra (King of Gods)' },
    { name:'Mula', ruler:'Ketu', deity:'Nirriti (Goddess of Dissolution)' },
    { name:'Purva Ashadha', ruler:'Venus', deity:'Apas (Water Deity)' },
    { name:'Uttara Ashadha', ruler:'Sun', deity:'Vishvadevas' },
    { name:'Shravana', ruler:'Moon', deity:'Vishnu (Preserver)' },
    { name:'Dhanishta', ruler:'Mars', deity:'Vasus (Eight Elemental Gods)' },
    { name:'Shatabhisha', ruler:'Rahu', deity:'Varuna (God of Oceans)' },
    { name:'Purva Bhadrapada', ruler:'Jupiter', deity:'Aja Ekapada' },
    { name:'Uttara Bhadrapada', ruler:'Saturn', deity:'Ahir Budhnya' },
    { name:'Revati', ruler:'Mercury', deity:'Pushan (Nourisher)' }
  ];

  var SIGNS = [
    { name:'Mesha', en:'Aries', ruler:'Mars', element:'Fire' },
    { name:'Vrishabha', en:'Taurus', ruler:'Venus', element:'Earth' },
    { name:'Mithuna', en:'Gemini', ruler:'Mercury', element:'Air' },
    { name:'Karka', en:'Cancer', ruler:'Moon', element:'Water' },
    { name:'Simha', en:'Leo', ruler:'Sun', element:'Fire' },
    { name:'Kanya', en:'Virgo', ruler:'Mercury', element:'Earth' },
    { name:'Tula', en:'Libra', ruler:'Venus', element:'Air' },
    { name:'Vrischika', en:'Scorpio', ruler:'Mars', element:'Water' },
    { name:'Dhanu', en:'Sagittarius', ruler:'Jupiter', element:'Fire' },
    { name:'Makara', en:'Capricorn', ruler:'Saturn', element:'Earth' },
    { name:'Kumbha', en:'Aquarius', ruler:'Saturn', element:'Air' },
    { name:'Meena', en:'Pisces', ruler:'Jupiter', element:'Water' }
  ];

  /* ── Natural friendships ─────────────────────── */
  var FRIENDS = {
    Sun:     { f:['Moon','Mars','Jupiter'], e:['Venus','Saturn'], n:['Mercury'] },
    Moon:    { f:['Sun','Mercury'], e:[], n:['Mars','Jupiter','Venus','Saturn'] },
    Mars:    { f:['Sun','Moon','Jupiter'], e:['Mercury'], n:['Venus','Saturn'] },
    Mercury: { f:['Sun','Venus'], e:['Moon'], n:['Mars','Jupiter','Saturn'] },
    Jupiter: { f:['Sun','Moon','Mars'], e:['Mercury','Venus'], n:['Saturn'] },
    Venus:   { f:['Mercury','Saturn'], e:['Sun','Moon'], n:['Mars','Jupiter'] },
    Saturn:  { f:['Mercury','Venus'], e:['Sun','Moon','Mars'], n:['Jupiter'] }
  };

  /* ── Dignity data (sign indices) ─────────────── */
  var DIGNITY = {
    Sun:     { ex:0,  deb:6,  own:[4] },
    Moon:    { ex:1,  deb:7,  own:[3] },
    Mars:    { ex:9,  deb:3,  own:[0,7] },
    Mercury: { ex:5,  deb:11, own:[2,5] },
    Jupiter: { ex:3,  deb:9,  own:[8,11] },
    Venus:   { ex:11, deb:5,  own:[1,6] },
    Saturn:  { ex:6,  deb:0,  own:[9,10] }
  };

  /* ── Julian Date ─────────────────────────────── */
  function julianDate(d) {
    var Y = d.getUTCFullYear(), M = d.getUTCMonth() + 1;
    var D = d.getUTCDate() + d.getUTCHours() / 24 + d.getUTCMinutes() / 1440;
    if (M <= 2) { Y--; M += 12; }
    var A = Math.floor(Y / 100);
    var B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
  }

  function centuries(d) { return (julianDate(d) - 2451545.0) / 36525.0; }

  /* ── Lahiri Ayanamsa ─────────────────────────── */
  function ayanamsa(T) {
    var yr = 2000 + T * 100;
    return 23.856 + 0.01397 * (yr - 2000);
  }

  /* ── Kepler solver ───────────────────────────── */
  function solveKepler(M_deg, e) {
    var M = norm360(M_deg) * DEG, E = M;
    for (var i = 0; i < 20; i++) {
      var dE = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
      E += dE;
      if (Math.abs(dE) < 1e-12) break;
    }
    return E / DEG;
  }

  /* ── Orbital elements (J2000.0 + rates/century) ─ */
  var ELEMENTS = {
    Mercury: { a:0.38710, e0:0.20563, e1:0.00002, L0:252.2509, L1:149472.6746, w0:77.4561, w1:0.1595 },
    Venus:   { a:0.72333, e0:0.00677, e1:-0.00005, L0:181.9798, L1:58517.8157, w0:131.5637, w1:0.0048 },
    Earth:   { a:1.00000, e0:0.01671, e1:-0.00004, L0:100.4665, L1:35999.3730, w0:102.9373, w1:0.3225 },
    Mars:    { a:1.52366, e0:0.09340, e1:0.00009, L0:355.4533, L1:19140.2993, w0:336.0602, w1:0.4439 },
    Jupiter: { a:5.20336, e0:0.04839, e1:-0.00011, L0:34.3515, L1:3034.9057, w0:14.3312, w1:0.2155 },
    Saturn:  { a:9.53707, e0:0.05415, e1:-0.00037, L0:50.0774, L1:1222.1138, w0:93.0572, w1:0.5652 }
  };

  function getElements(name, T) {
    var el = ELEMENTS[name];
    return { a: el.a, e: el.e0 + el.e1 * T, L: norm360(el.L0 + el.L1 * T), w: norm360(el.w0 + el.w1 * T) };
  }

  /* ── Heliocentric coordinates ────────────────── */
  function helioCoords(el) {
    var M = norm360(el.L - el.w);
    var E = solveKepler(M, el.e);
    var v = 2 * atan2D(Math.sqrt(1 + el.e) * sinD(E / 2), Math.sqrt(1 - el.e) * cosD(E / 2));
    var r = el.a * (1 - el.e * cosD(E));
    var lon = norm360(v + el.w);
    return { x: r * cosD(lon), y: r * sinD(lon), lon: lon };
  }

  /* ── Geocentric tropical longitude for a planet ─ */
  function geoLongPlanet(name, T) {
    var p = helioCoords(getElements(name, T));
    var e = helioCoords(getElements('Earth', T));
    return norm360(atan2D(p.y - e.y, p.x - e.x));
  }

  /* ── Sun tropical longitude ──────────────────── */
  function sunLong(T) {
    var el = getElements('Earth', T);
    var M = norm360(el.L - el.w);
    var C = (1.9146 - 0.004817 * T) * sinD(M) + (0.01999 - 0.000101 * T) * sinD(2 * M) + 0.00029 * sinD(3 * M);
    return norm360(el.L + C + 180);
  }

  /* ── Moon tropical longitude (simplified Brown) ─ */
  function moonLong(T) {
    var Lp = norm360(218.3165 + 481267.8813 * T);
    var Mp = norm360(134.9634 + 477198.8676 * T);
    var Ms = norm360(357.5291 + 35999.0503 * T);
    var D  = norm360(297.8502 + 445267.1115 * T);
    var F  = norm360(93.2720 + 483202.0175 * T);
    return norm360(Lp
      + 6.289 * sinD(Mp)
      - 1.274 * sinD(2 * D - Mp)
      + 0.658 * sinD(2 * D)
      + 0.214 * sinD(2 * Mp)
      - 0.186 * sinD(Ms)
      - 0.114 * sinD(2 * F)
      + 0.059 * sinD(2 * D - 2 * Mp)
      + 0.057 * sinD(2 * D - Ms - Mp)
      + 0.053 * sinD(2 * D + Mp)
      + 0.046 * sinD(2 * D - Ms)
      - 0.041 * sinD(Ms - Mp)
      - 0.035 * sinD(D)
      - 0.031 * sinD(Ms + Mp));
  }

  /* ── Rahu (mean ascending node) ──────────────── */
  function rahuTropical(T) { return norm360(125.0445 - 1934.1363 * T); }

  /* ── Convert tropical → sidereal ─────────────── */
  function toSid(trop, T) { return norm360(trop - ayanamsa(T)); }

  /* ── Sign / Nakshatra from sidereal longitude ── */
  function getSign(sid) {
    var i = Math.floor(sid / 30);
    return { idx: i, name: SIGNS[i].name, en: SIGNS[i].en, ruler: SIGNS[i].ruler, element: SIGNS[i].element, deg: Math.floor(sid % 30) };
  }

  function getNak(sid) {
    var span = 360 / 27;
    var i = Math.floor(sid / span);
    var padaSpan = span / 4;
    var pada = Math.min(Math.floor((sid % span) / padaSpan) + 1, 4);
    return { idx: i, name: NAKSHATRAS[i].name, ruler: NAKSHATRAS[i].ruler, deity: NAKSHATRAS[i].deity, pada: pada };
  }

  /* ── Dignity assessment ──────────────────────── */
  function getDignity(planet, signIdx) {
    var d = DIGNITY[planet];
    if (!d) return { text: '', isEx: false, isDeb: false };
    if (signIdx === d.ex) return { text: 'EXALTED in ' + SIGNS[signIdx].en + ' — peak strength', isEx: true, isDeb: false };
    if (signIdx === d.deb) return { text: 'DEBILITATED in ' + SIGNS[signIdx].en + ' — challenged expression', isEx: false, isDeb: true };
    if (d.own.indexOf(signIdx) >= 0) return { text: 'Own sign (' + SIGNS[signIdx].en + ') — strong and comfortable', isEx: false, isDeb: false };
    var signRuler = SIGNS[signIdx].ruler;
    var fr = FRIENDS[planet];
    if (!fr) return { text: 'Neutral sign (' + SIGNS[signIdx].en + ')', isEx: false, isDeb: false };
    if (fr.f.indexOf(signRuler) >= 0) return { text: 'Friendly sign (' + signRuler + '-ruled ' + SIGNS[signIdx].en + ')', isEx: false, isDeb: false };
    if (fr.e.indexOf(signRuler) >= 0) return { text: 'Enemy sign (' + signRuler + '-ruled ' + SIGNS[signIdx].en + ')', isEx: false, isDeb: false };
    return { text: 'Neutral sign (' + SIGNS[signIdx].en + ')', isEx: false, isDeb: false };
  }

  /* ── Retrograde check (comparing today vs yesterday) ── */
  function isRetrograde(planet, T) {
    if (planet === 'Rahu' || planet === 'Ketu') return true;
    if (planet === 'Sun' || planet === 'Moon') return false;
    var dT = 1 / 36525;
    var today = geoLongPlanet(planet, T);
    var yesterday = geoLongPlanet(planet, T - dT);
    return norm180(today - yesterday) < 0;
  }

  /* ── Approximate transit dates ───────────────── */
  function transitDates(planet, sidLon, date) {
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var signStart = Math.floor(sidLon / 30) * 30;
    var degInSign = sidLon - signStart;
    var degToExit = 30 - degInSign;
    var dm = { Sun: 0.986, Moon: 13.18, Mercury: 1.2, Venus: 1.0, Mars: 0.524, Jupiter: 0.083, Saturn: 0.034, Rahu: 0.053, Ketu: 0.053 };
    var rate = dm[planet] || 1;
    var daysBack, daysForward;
    if (planet === 'Rahu' || planet === 'Ketu') {
      daysBack = degToExit / rate;
      daysForward = degInSign / rate;
    } else {
      daysBack = degInSign / rate;
      daysForward = degToExit / rate;
    }
    var entry = new Date(date.getTime() - daysBack * 86400000);
    var exit = new Date(date.getTime() + daysForward * 86400000);
    function fmt(d) {
      var s = MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate();
      if (d.getUTCFullYear() !== date.getUTCFullYear()) s += ', ' + d.getUTCFullYear();
      return s;
    }
    return { inDate: fmt(entry), outDate: fmt(exit) };
  }

  /* ── Transit descriptions (planet × sign) ────── */
  var DESC = {
    Sun: {
      Mesha:'Sun in Aries — exalted fire. The soul burns brightest, leadership comes naturally, identity is crystal clear.',
      Vrishabha:'Sun in Taurus — steady purpose. Identity anchored in values, wealth, and sensory experience. Patience defines the will.',
      Mithuna:'Sun in Gemini — curious authority. The soul expresses through intellect, communication, and adaptive brilliance.',
      Karka:'Sun in Cancer — nurturing power. Identity rooted in emotional intelligence, home, and protection of loved ones.',
      Simha:'Sun in Leo — own sign sovereignty. The soul shines at its most natural, creative fire at full blaze.',
      Kanya:'Sun in Virgo — analytical purpose. Identity refined through service, health consciousness, and meticulous craft.',
      Tula:'Sun in Libra — debilitated. The ego struggles with compromise, identity diffused through relationships and others\' needs.',
      Vrischika:'Sun in Scorpio — transformative intensity. The soul dives deep, drawing power from hidden knowledge and regeneration.',
      Dhanu:'Sun in Sagittarius — dharmic fire. Purpose aligned with higher truth, teaching, and philosophical expansion.',
      Makara:'Sun in Capricorn — structured ambition. Authority earned through discipline, patience, and a relentless climb.',
      Kumbha:'Sun in Aquarius — humanitarian vision. Identity expressed through collective service, innovation, and detachment from ego.',
      Meena:'Sun in Pisces — spiritual surrender. The ego dissolves into compassion, artistic sensitivity, and quiet devotion.'
    },
    Moon: {
      Mesha:'Moon in Aries — fiery emotions. Quick reactions, independent feelings, a need for action and autonomy in every emotional response.',
      Vrishabha:'Moon in Taurus — exalted serenity. Emotional stability at its peak, sensory comfort, deep contentment in simplicity.',
      Mithuna:'Moon in Gemini — restless mind. Emotional processing through words, curiosity, and constant mental movement.',
      Karka:'Moon in Cancer — own sign bliss. The mind is at home, maternal instincts are strongest, emotional depth overflows.',
      Simha:'Moon in Leo — regal feelings. Emotional need for recognition, generous heart, creative self-expression through feelings.',
      Kanya:'Moon in Virgo — analytical emotions. The mind seeks order and precision, health-conscious instincts, service-oriented nature.',
      Tula:'Moon in Libra — harmonious mind. Emotional balance through relationships, aesthetic sensitivity, diplomatic inner life.',
      Vrischika:'Moon in Scorpio — debilitated intensity. Deep, hidden emotions, transformative inner life, powerful psychological currents.',
      Dhanu:'Moon in Sagittarius — expansive heart. Optimistic feelings, emotional growth through travel, wisdom, and open horizons.',
      Makara:'Moon in Capricorn — disciplined emotions. Reserved feelings, emotional maturity, security found through achievement.',
      Kumbha:'Moon in Aquarius — detached awareness. Humanitarian feelings, unconventional emotional needs, intellectual processing of the heart.',
      Meena:'Moon in Pisces — oceanic sensitivity. Deeply intuitive, spiritually attuned, emotions flow without boundaries.'
    },
    Mars: {
      Mesha:'Mars in Aries — own sign warrior. Raw courage, initiative, and competitive fire at maximum intensity.',
      Vrishabha:'Mars in Taurus — stubborn force. Energy directed toward accumulation, material security, and physical endurance.',
      Mithuna:'Mars in Gemini — intellectual aggression. Sharp debates, mental restlessness, energy scattered across many fronts.',
      Karka:'Mars in Cancer — debilitated fire. Aggression turned inward, emotional volatility, fierce protectiveness with turbulent expression.',
      Simha:'Mars in Leo — commanding energy. Courageous leadership, dramatic action, martial fire meets creative authority.',
      Kanya:'Mars in Virgo — precise action. Energy channeled into detail work, analytical problem-solving, and systematic service.',
      Tula:'Mars in Libra — diplomatic aggression. The warrior seeks balance, action through partnerships, strategic negotiation.',
      Vrischika:'Mars in Scorpio — own sign intensity. Strategic power, hidden strength, transformative and penetrating force.',
      Dhanu:'Mars in Sagittarius — righteous warrior. Energy directed by principle, crusading spirit, action in service of dharma.',
      Makara:'Mars in Capricorn — exalted discipline. Peak martial power, structured ambition, patient strategic conquest.',
      Kumbha:'Mars in Aquarius — revolutionary energy. Action for collective change, unconventional methods, technology-driven drive.',
      Meena:'Mars in Pisces — spiritual warrior. Energy diffused through compassion, action guided by intuition and inner vision.'
    },
    Mercury: {
      Mesha:'Mercury in Aries — quick intellect. Fast thinking, impulsive speech, ideas that arrive like sparks and leave just as fast.',
      Vrishabha:'Mercury in Taurus — steady logic. Practical intelligence, measured speech, thinking grounded in tangible reality.',
      Mithuna:'Mercury in Gemini — own sign brilliance. Intellect at its sharpest, communication flows effortlessly, wit and versatility abound.',
      Karka:'Mercury in Cancer — emotional intelligence. Thinking colored by feelings, intuitive reasoning, memory-rich and nurturing mind.',
      Simha:'Mercury in Leo — authoritative speech. Bold communication, creative thinking, the intellect seeks recognition.',
      Kanya:'Mercury in Virgo — exalted precision. The analytical mind at peak power, discriminating intelligence, mastery of craft and detail.',
      Tula:'Mercury in Libra — balanced reasoning. Diplomatic communication, aesthetic intellect, careful weighing of all perspectives.',
      Vrischika:'Mercury in Scorpio — penetrating mind. Research-oriented thought, secretive communication, deep psychological insight.',
      Dhanu:'Mercury in Sagittarius — philosophical thinking. Big-picture intellect, teaching ability, wisdom over precision.',
      Makara:'Mercury in Capricorn — structured thought. Business-minded communication, practical strategy, disciplined mental output.',
      Kumbha:'Mercury in Aquarius — innovative intellect. Unconventional thinking, humanitarian communication, technologically sharp mind.',
      Meena:'Mercury in Pisces — debilitated intuition. Logic yields to imagination, poetic and dreamy mind, analytical clarity challenged.'
    },
    Jupiter: {
      Mesha:'Jupiter in Aries — pioneering wisdom. Teaching through bold action, enthusiastic faith, dharma of courageous leadership.',
      Vrishabha:'Jupiter in Taurus — abundant values. Wisdom in wealth management, growth through stability, spiritual approach to prosperity.',
      Mithuna:'Jupiter in Gemini — intellectual expansion. Wisdom through communication, versatile teaching, endless knowledge gathering.',
      Karka:'Jupiter in Cancer — exalted grace. The great benefic at peak power. Wisdom, compassion, and fortune overflow abundantly.',
      Simha:'Jupiter in Leo — royal dharma. Expansive creativity, noble teaching, blessed children, magnanimous leadership.',
      Kanya:'Jupiter in Virgo — practical wisdom. Growth through service, discerning faith, spiritual approach to health and detail.',
      Tula:'Jupiter in Libra — harmonious expansion. Growth through relationships, justice-oriented wisdom, diplomatic dharma.',
      Vrischika:'Jupiter in Scorpio — transformative growth. Deep wisdom, occult knowledge, expansion through crisis and rebirth.',
      Dhanu:'Jupiter in Sagittarius — own sign magnificence. The guru at home. Philosophy, higher learning, and dharma at their peak.',
      Makara:'Jupiter in Capricorn — debilitated wisdom. Faith tested by reality, growth through discipline and structural patience.',
      Kumbha:'Jupiter in Aquarius — humanitarian growth. Wisdom for the collective, innovative faith, expansion through unconventional paths.',
      Meena:'Jupiter in Pisces — own sign devotion. Spiritual wisdom flows naturally, compassion is boundless, moksha-oriented growth.'
    },
    Venus: {
      Mesha:'Venus in Aries — passionate love. Quick attractions, bold creativity, desire that doesn\'t wait or negotiate.',
      Vrishabha:'Venus in Taurus — own sign luxury. Love at its most sensual, beauty deeply appreciated, material comfort perfected.',
      Mithuna:'Venus in Gemini — intellectual romance. Love expressed through words, artistic versatility, playful and curious relationships.',
      Karka:'Venus in Cancer — nurturing love. Emotional devotion, domestic beauty, love inseparable from care and protection.',
      Simha:'Venus in Leo — dramatic romance. Love seeks the spotlight, generous affection, creative passion burns brilliantly.',
      Kanya:'Venus in Virgo — debilitated love. Relationships over-analyzed, beauty seeks impossible perfection, love tangled in criticism.',
      Tula:'Venus in Libra — own sign harmony. Love, beauty, and relationships at their most balanced and elegantly refined.',
      Vrischika:'Venus in Scorpio — intense devotion. All-or-nothing love, magnetic attraction, beauty found in the depths.',
      Dhanu:'Venus in Sagittarius — adventurous love. Relationships that expand horizons, philosophical romance, freedom in love.',
      Makara:'Venus in Capricorn — mature love. Practical relationships, beauty through structure, loyalty earned over years.',
      Kumbha:'Venus in Aquarius — unconventional beauty. Unique relationships, humanitarian love, detached but deeply devoted.',
      Meena:'Venus in Pisces — exalted devotion. Love at its most transcendent. Art, beauty, and romance reach divine heights.'
    },
    Saturn: {
      Mesha:'Saturn in Aries — debilitated discipline. Patience tested harshly, authority challenged, karmic lessons through frustration.',
      Vrishabha:'Saturn in Taurus — patient endurance. Slow wealth building, karmic relationship with money, long-term material discipline.',
      Mithuna:'Saturn in Gemini — structured thought. Communication carries weight, serious learning, mental discipline earned over time.',
      Karka:'Saturn in Cancer — emotional restriction. Feelings held back, karmic mother themes surface, security anxieties deepen.',
      Simha:'Saturn in Leo — humbled authority. Leadership earned the hard way, creative blocks become creative discipline.',
      Kanya:'Saturn in Virgo — meticulous karma. Service-oriented lessons, health discipline, perfection achieved through patience.',
      Tula:'Saturn in Libra — exalted justice. The karmic teacher at peak dignity. Fair judgment, lasting partnerships, balanced discipline.',
      Vrischika:'Saturn in Scorpio — deep transformation. Karmic lessons through crisis, hidden fears confronted, slow psychological healing.',
      Dhanu:'Saturn in Sagittarius — disciplined dharma. Faith tested and ultimately strengthened, wisdom earned through hardship.',
      Makara:'Saturn in Capricorn — own sign mastery. Maximum ambition, structural power, the taskmaster at home.',
      Kumbha:'Saturn in Aquarius — own sign innovation. Discipline for the collective, systematic reform, detached humanitarian service.',
      Meena:'Saturn in Pisces — spiritual discipline. Old karma dissolving, compassion structured, lessons in surrender and faith.'
    },
    Rahu: {
      Mesha:'Rahu in Aries — obsessive identity. Craving for individuality, risk-taking amplified, the warrior ego on overdrive.',
      Vrishabha:'Rahu in Taurus — exalted desire. Material obsession at peak intensity, insatiable appetite for wealth and status.',
      Mithuna:'Rahu in Gemini — communication obsession. Information hunger, unconventional intelligence, foreign language talent amplified.',
      Karka:'Rahu in Cancer — emotional amplification. Obsessive nurturing, foreign roots, mother karma intensified and distorted.',
      Simha:'Rahu in Leo — power obsession. Craving for authority, political ambition, dramatic and larger-than-life self-presentation.',
      Kanya:'Rahu in Virgo — perfectionism amplified. Obsessive analysis, health anxiety, unconventional healing methods pursued.',
      Tula:'Rahu in Libra — relationship obsession. Foreign partnerships, unusual marriages, relentless pursuit of balance and justice.',
      Vrischika:'Rahu in Scorpio — debilitated intensity. Dangerous obsessions, occult fascination, transformation through chaos.',
      Dhanu:'Rahu in Sagittarius — ideology obsession. Foreign gurus, unorthodox beliefs, dogmatic pursuit of meaning.',
      Makara:'Rahu in Capricorn — status obsession. Climbing at any cost, political machinations, ambition with no ceiling.',
      Kumbha:'Rahu in Aquarius — technology obsession. AI, disruption, breaking conventions, revolutionary energy at peak intensity.',
      Meena:'Rahu in Pisces — spiritual obsession. Mystical fascination, foreign spiritual paths, escapism disguised as seeking.'
    },
    Ketu: {
      Mesha:'Ketu in Aries — detached warrior. Past-life courage, intuitive action, headless drive, spiritual independence.',
      Vrishabha:'Ketu in Taurus — material detachment. Letting go of possessions, past-life wealth, discomfort with luxury and comfort.',
      Mithuna:'Ketu in Gemini — intuitive knowing. Past-life intelligence, communication beyond words, innate spiritual intellect.',
      Karka:'Ketu in Cancer — emotional release. Letting go of deep attachments, past-life mother karma, transcending emotional needs.',
      Simha:'Ketu in Leo — ego dissolution. Past-life authority surrendered, spiritual humility, creativity without credit-seeking.',
      Kanya:'Ketu in Virgo — transcending analysis. Past-life service, intuitive healing abilities, liberation from perfectionism.',
      Tula:'Ketu in Libra — relationship liberation. Past-life partnerships released, spiritual independence, finding balance within.',
      Vrischika:'Ketu in Scorpio — exalted liberation. Mastery of transformation, past-life occult wisdom, fearless approach to moksha.',
      Dhanu:'Ketu in Sagittarius — wisdom beyond teaching. Past-life guru energy, spiritual knowledge already earned, innate faith.',
      Makara:'Ketu in Capricorn — authority transcended. Past-life power released, spiritual humility, letting go of worldly status.',
      Kumbha:'Ketu in Aquarius — collective karma released. Past-life humanitarian work, detachment from groups and ideologies.',
      Meena:'Ketu in Pisces — final liberation. Past-life spirituality, already enlightened in some dimension, dissolution into the infinite.'
    }
  };

  /* ── Conjunction / Yoga Detection ────────────── */
  function detectYogas(planet, positions) {
    var yogas = [];
    var pSid = positions[planet].sidereal;
    var names = Object.keys(positions);

    // Check conjunctions (within ~15° = roughly same sign)
    var conj = [];
    for (var i = 0; i < names.length; i++) {
      if (names[i] === planet) continue;
      if (Math.abs(norm180(pSid - positions[names[i]].sidereal)) < 15) conj.push(names[i]);
    }

    // Angarak Yoga
    if (planet === 'Mars' && conj.indexOf('Rahu') >= 0) yogas.push('ANGARAK YOGA \u26a0 Mars-Rahu conjunction \u2014 amplified aggression, sudden events');
    if (planet === 'Rahu' && conj.indexOf('Mars') >= 0) yogas.push('ANGARAK YOGA \u26a0 Mars-Rahu conjunction \u2014 volatile, transformative energy');
    // Budh-Rahu
    if (planet === 'Mercury' && conj.indexOf('Rahu') >= 0) yogas.push('Budh-Rahu conjunction \u2014 unconventional intellect, potential miscommunication');
    // Sun-Saturn
    if (planet === 'Sun' && conj.indexOf('Saturn') >= 0) yogas.push('Sun-Saturn conjunction \u2014 authority meets restriction, karmic father themes');
    if (planet === 'Saturn' && conj.indexOf('Sun') >= 0) yogas.push('Shani-Surya yoga \u2014 ego humbled by karmic discipline');
    // Venus-Saturn
    if (planet === 'Venus' && conj.indexOf('Saturn') >= 0) yogas.push('Shukra-Shani yoga \u2014 love meets karmic discipline, mature relationships');
    // Jupiter-Venus
    if (planet === 'Jupiter' && conj.indexOf('Venus') >= 0) yogas.push('Guru-Shukra conjunction \u2014 wisdom meets beauty, spiritual wealth');
    // Jupiter-Mars
    if (planet === 'Jupiter' && conj.indexOf('Mars') >= 0) yogas.push('Guru-Mangal yoga \u2014 wisdom energized by courage, righteous action');
    if (planet === 'Mars' && conj.indexOf('Jupiter') >= 0) yogas.push('Mangal-Guru yoga \u2014 courage guided by wisdom');

    // Combustion check
    if (planet !== 'Sun' && planet !== 'Rahu' && planet !== 'Ketu') {
      var sunDist = Math.abs(norm180(positions.Sun.sidereal - pSid));
      var orbs = { Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15 };
      if (sunDist < (orbs[planet] || 10)) yogas.push('COMBUST \u2600 Within Sun\u2019s orb \u2014 planet\u2019s significations temporarily obscured');
    }

    return yogas.join('\n');
  }

  /* ── Main compute function ───────────────────── */
  function compute(date) {
    if (!date) date = new Date();
    var T = centuries(date);
    var ayan = ayanamsa(T);

    // Tropical longitudes
    var trop = {
      Sun: sunLong(T),
      Moon: moonLong(T),
      Mercury: geoLongPlanet('Mercury', T),
      Venus: geoLongPlanet('Venus', T),
      Mars: geoLongPlanet('Mars', T),
      Jupiter: geoLongPlanet('Jupiter', T),
      Saturn: geoLongPlanet('Saturn', T),
      Rahu: rahuTropical(T),
      Ketu: norm360(rahuTropical(T) + 180)
    };

    // Build sidereal positions
    var positions = {};
    var planetList = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu'];
    planetList.forEach(function (p) {
      positions[p] = { sidereal: toSid(trop[p], T) };
    });

    // Build full result per planet
    var result = {};
    planetList.forEach(function (p) {
      var sid = positions[p].sidereal;
      var sign = getSign(sid);
      var nak = getNak(sid);
      var dig = getDignity(p, sign.idx);
      var retro = isRetrograde(p, T);
      var dates = transitDates(p, sid, date);
      var yogas = detectYogas(p, positions);
      var transit = (DESC[p] && DESC[p][sign.name]) || (p + ' transiting ' + sign.en + '.');

      var status = '';
      if (dig.isEx) status = 'EXALTED \u2726';
      if (dig.isDeb) status = 'DEBILITATED \u25bc';
      if (retro && p !== 'Rahu' && p !== 'Ketu') status = (status ? status + '\n' : '') + 'Retrograde \u27f2';
      if (p === 'Rahu') { status = 'Always Retrograde \u27f2'; if (sign.name === 'Kumbha') status += '\nOwn sign = Maximum power'; }
      if (p === 'Ketu') { status = 'Always Retrograde \u27f2'; }

      // Rahu own sign in Aquarius, Ketu exalted in Scorpio
      if (p === 'Rahu' && sign.name === 'Kumbha') dig.text = 'Own sign (Aquarius) \u2014 exceptionally powerful';
      if (p === 'Rahu' && sign.name === 'Vrishabha') { dig.text = 'Exalted in Taurus \u2014 peak material obsession'; dig.isEx = true; status = 'EXALTED \u2726\nAlways Retrograde \u27f2'; }
      if (p === 'Ketu' && sign.name === 'Vrischika') { dig.text = 'Exalted in Scorpio \u2014 peak spiritual liberation'; dig.isEx = true; status = 'EXALTED \u2726\nAlways Retrograde \u27f2'; }
      if (p === 'Rahu' && sign.name === 'Vrischika') { dig.text = 'Debilitated in Scorpio'; dig.isDeb = true; status = 'DEBILITATED \u25bc\nAlways Retrograde \u27f2'; }
      if (p === 'Ketu' && sign.name === 'Vrishabha') { dig.text = 'Debilitated in Taurus'; dig.isDeb = true; status = 'DEBILITATED \u25bc\nAlways Retrograde \u27f2'; }

      result[p] = {
        sign: sign.name,
        signEn: sign.en,
        degree: sign.deg,
        longitude: Math.round(sid),
        nakshatra: nak.name,
        pada: nak.pada,
        nkRuler: nak.ruler,
        nkDeity: nak.deity,
        transitIn: dates.inDate,
        transitOut: dates.outDate,
        status: status,
        dignityNote: dig.text,
        yogas: yogas,
        transit: transit,
        special: dig.isEx ? 'Exalted \u2726' : (dig.isDeb ? 'Debilitated \u25bc' : ''),
        retrograde: retro
      };
    });

    var MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return {
      positions: result,
      date: date,
      ayanamsa: ayan,
      monthYear: MONTHS_FULL[date.getUTCMonth()] + ' ' + date.getUTCFullYear()
    };
  }

  return { compute: compute };
})();
