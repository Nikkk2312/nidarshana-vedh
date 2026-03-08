// ===== VedAstro Tools | Nidarshana Vedh =====
const API_BASE = 'https://api.vedastro.org/api/Calculate';

// ===== Tab Switching =====
function switchTab(tab) {
  document.querySelectorAll('.tool-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`panel-${tab}`).classList.add('active');
}

// ===== Helpers =====
function formatTimeParam(date, time, timezone, place) {
  // date: "YYYY-MM-DD", time: "HH:MM", timezone: "+05:30", place: "Chennai, India"
  const [year, month, day] = date.split('-');
  const encodedPlace = encodeURIComponent(place.trim());
  return `Location/${encodedPlace}/Time/${time}/${day}/${month}/${year}/${timezone}`;
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  const text = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  if (loading) {
    btn.disabled = true;
    text.style.display = 'none';
    loader.style.display = 'inline';
  } else {
    btn.disabled = false;
    text.style.display = 'inline';
    loader.style.display = 'none';
  }
}

function showError(containerId, message) {
  const el = document.getElementById(containerId);
  el.style.display = 'block';
  el.innerHTML = `<div class="error-content"><h3>Something went wrong</h3><p>${message}</p><p style="font-size:0.82rem; color:var(--ink-dim); margin-top:1rem;">The VedAstro API may be temporarily unavailable. Please try again in a few minutes, or <a href="/consultation/">book a consultation</a> for a personal reading.</p></div>`;
}

function hideError(containerId) {
  document.getElementById(containerId).style.display = 'none';
}

async function fetchAPI(endpoint) {
  const response = await fetch(`${API_BASE}/${endpoint}`);
  if (!response.ok) throw new Error(`API returned ${response.status}`);
  const data = await response.json();
  if (data.Status !== 'Pass') throw new Error(data.Payload || 'API calculation failed');
  return data.Payload;
}

// ===== BIRTH CHART GENERATION =====
async function generateBirthChart(e) {
  e.preventDefault();
  hideError('bc-error');
  document.getElementById('bc-results').style.display = 'none';
  setLoading('bc-submit', true);

  const name = document.getElementById('bc-name').value.trim();
  const date = document.getElementById('bc-date').value;
  const time = document.getElementById('bc-time').value;
  const timezone = document.getElementById('bc-timezone').value;
  const place = document.getElementById('bc-place').value.trim();

  const timeParam = formatTimeParam(date, time, timezone, place);

  try {
    // Fetch planet data, house data, dasha, and predictions in parallel
    const [planetData, houseData, dashaData, predictions, lagnaSign, moonSign] = await Promise.all([
      fetchAPI(`AllPlanetData/PlanetName/All/${timeParam}`),
      fetchAPI(`AllHouseData/HouseName/All/${timeParam}`),
      fetchAPI(`DasaForNow/${timeParam}`),
      fetchAPI(`HoroscopePredictions/${timeParam}`).catch(() => null),
      fetchAPI(`LagnaSignName/${timeParam}`).catch(() => null),
      fetchAPI(`MoonSignName/${timeParam}`).catch(() => null),
    ]);

    renderBirthChart(name, date, time, place, timezone, planetData, houseData, dashaData, predictions, lagnaSign, moonSign);
  } catch (err) {
    showError('bc-error', err.message || 'Failed to generate birth chart. Please check your birth details and try again.');
  } finally {
    setLoading('bc-submit', false);
  }
}

function renderBirthChart(name, date, time, place, timezone, planetData, houseData, dashaData, predictions, lagnaSign, moonSign) {
  const results = document.getElementById('bc-results');
  results.style.display = 'block';

  // Header
  const [year, month, day] = date.split('-');
  document.getElementById('bc-results-name').textContent = `Kundali of ${name}`;
  document.getElementById('bc-results-meta').textContent = `Born on ${day}/${month}/${year} at ${time} in ${place} (UTC ${timezone})`;

  // Basic Info
  const basicGrid = document.getElementById('bc-basic-grid');
  const lagnaName = extractValue(lagnaSign, 'LagnaSignName') || 'N/A';
  const moonName = extractValue(moonSign, 'MoonSignName') || 'N/A';
  basicGrid.innerHTML = `
    <div class="basic-item"><span class="basic-label">Lagna (Ascendant)</span><span class="basic-value">${lagnaName}</span></div>
    <div class="basic-item"><span class="basic-label">Moon Sign (Rashi)</span><span class="basic-value">${moonName}</span></div>
    <div class="basic-item"><span class="basic-label">Birth Place</span><span class="basic-value">${place}</span></div>
    <div class="basic-item"><span class="basic-label">Birth Time</span><span class="basic-value">${time} (UTC ${timezone})</span></div>
  `;

  // Planets Table
  renderPlanetsTable(planetData);

  // Houses Table
  renderHousesTable(houseData);

  // Dasha
  renderDasha(dashaData);

  // Predictions
  renderPredictions(predictions);

  // Scroll to results
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Trigger fade-in animations
  setTimeout(() => {
    results.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
  }, 100);
}

function extractValue(payload, key) {
  if (!payload) return null;
  if (payload[key] !== undefined) return payload[key];
  // Try nested
  for (const k in payload) {
    if (typeof payload[k] === 'object' && payload[k] && payload[k][key] !== undefined) {
      return payload[k][key];
    }
  }
  // If payload is a string, return it
  if (typeof payload === 'string') return payload;
  return null;
}

function renderPlanetsTable(data) {
  const tbody = document.querySelector('#bc-planets-table tbody');
  tbody.innerHTML = '';

  const planetNames = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const planetHindi = {
    Sun: 'Surya', Moon: 'Chandra', Mars: 'Mangal', Mercury: 'Budh',
    Jupiter: 'Guru', Venus: 'Shukra', Saturn: 'Shani', Rahu: 'Rahu', Ketu: 'Ketu'
  };

  // Parse planet data - VedAstro returns nested structure
  planetNames.forEach(planet => {
    const pData = findPlanetData(data, planet);
    const sign = pData.sign || 'N/A';
    const degree = pData.degree || 'N/A';
    const nakshatra = pData.nakshatra || 'N/A';
    const house = pData.house || 'N/A';
    const retrograde = pData.retrograde;

    let status = '';
    if (retrograde) status = '<span class="status-retro">R</span>';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${planet}</strong> <span class="planet-hindi">(${planetHindi[planet]})</span></td>
      <td>${sign}</td>
      <td>${degree}</td>
      <td>${nakshatra}</td>
      <td>${house}</td>
      <td>${status}</td>
    `;
    tbody.appendChild(row);
  });
}

function findPlanetData(data, planetName) {
  const result = { sign: 'N/A', degree: 'N/A', nakshatra: 'N/A', house: 'N/A', retrograde: false };

  if (!data) return result;

  // VedAstro AllPlanetData returns different structures
  // Try to navigate the response
  try {
    let planetInfo = null;

    // Check if data is an array
    if (Array.isArray(data)) {
      planetInfo = data.find(d => {
        const name = d.Name || d.PlanetName || d.name || '';
        return name.toString().toLowerCase().includes(planetName.toLowerCase());
      });
    } else if (typeof data === 'object') {
      // Check for direct planet key
      planetInfo = data[planetName] || data[`AllPlanetData${planetName}`];

      // Check nested structures
      if (!planetInfo) {
        for (const key in data) {
          const val = data[key];
          if (Array.isArray(val)) {
            planetInfo = val.find(d => {
              const n = d.Name || d.PlanetName || d.name || '';
              return n.toString().toLowerCase().includes(planetName.toLowerCase());
            });
            if (planetInfo) break;
          } else if (typeof val === 'object' && val) {
            if (key.toLowerCase().includes(planetName.toLowerCase())) {
              planetInfo = val;
              break;
            }
          }
        }
      }
    }

    if (planetInfo) {
      result.sign = planetInfo.PlanetZodiacSign || planetInfo.Sign || planetInfo.ZodiacSign || planetInfo.Rasi || extractDeep(planetInfo, 'Sign') || 'N/A';
      result.degree = planetInfo.PlanetDegreesInSign || planetInfo.Longitude || planetInfo.Degree || extractDeep(planetInfo, 'Degree') || 'N/A';
      result.nakshatra = planetInfo.PlanetConstellation || planetInfo.Nakshatra || planetInfo.Constellation || extractDeep(planetInfo, 'Constellation') || 'N/A';
      result.house = planetInfo.HousePlanetOccupiesBasedOnSign || planetInfo.House || extractDeep(planetInfo, 'House') || 'N/A';
      result.retrograde = planetInfo.IsPlanetRetrograde || planetInfo.IsRetrograde || planetInfo.Retrograde || false;

      // Clean up degree display
      if (typeof result.degree === 'object') {
        result.degree = result.degree.DegreeMinuteSecond || result.degree.Degrees || JSON.stringify(result.degree);
      }
      if (typeof result.degree === 'number') {
        result.degree = result.degree.toFixed(2) + '°';
      }

      // Clean sign name
      if (typeof result.sign === 'object') {
        result.sign = result.sign.Name || result.sign.SignName || JSON.stringify(result.sign);
      }

      // Clean nakshatra
      if (typeof result.nakshatra === 'object') {
        result.nakshatra = result.nakshatra.Name || result.nakshatra.ConstellationName || JSON.stringify(result.nakshatra);
      }

      // Clean house
      if (typeof result.house === 'object') {
        result.house = result.house.Name || result.house.HouseName || JSON.stringify(result.house);
      }
    }
  } catch (err) {
    // Silently handle parse errors
  }

  return result;
}

function extractDeep(obj, keyword) {
  if (!obj || typeof obj !== 'object') return null;
  for (const key in obj) {
    if (key.toLowerCase().includes(keyword.toLowerCase())) {
      const val = obj[key];
      if (typeof val === 'string' || typeof val === 'number') return val;
      if (typeof val === 'object') return val.Name || val.name || JSON.stringify(val);
    }
  }
  return null;
}

function renderHousesTable(data) {
  const tbody = document.querySelector('#bc-houses-table tbody');
  tbody.innerHTML = '';

  const houseNames = ['House1','House2','House3','House4','House5','House6','House7','House8','House9','House10','House11','House12'];
  const bhavaNames = ['1st (Lagna)', '2nd (Dhana)', '3rd (Sahaja)', '4th (Sukha)', '5th (Putra)', '6th (Shatru)', '7th (Kalatra)', '8th (Ayu)', '9th (Dharma)', '10th (Karma)', '11th (Labha)', '12th (Vyaya)'];

  houseNames.forEach((house, i) => {
    const hData = findHouseData(data, house);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${bhavaNames[i]}</strong></td>
      <td>${hData.sign}</td>
      <td>${hData.lord}</td>
    `;
    tbody.appendChild(row);
  });
}

function findHouseData(data, houseName) {
  const result = { sign: 'N/A', lord: 'N/A' };
  if (!data) return result;

  try {
    let houseInfo = null;

    if (Array.isArray(data)) {
      houseInfo = data.find(d => {
        const n = d.Name || d.HouseName || d.name || '';
        return n.toString().toLowerCase().includes(houseName.toLowerCase());
      });
    } else if (typeof data === 'object') {
      houseInfo = data[houseName] || data[`AllHouseData${houseName}`];
      if (!houseInfo) {
        for (const key in data) {
          if (key.toLowerCase().includes(houseName.toLowerCase())) {
            houseInfo = data[key];
            break;
          }
          const val = data[key];
          if (Array.isArray(val)) {
            houseInfo = val.find(d => {
              const n = d.Name || d.HouseName || '';
              return n.toString().toLowerCase().includes(houseName.toLowerCase());
            });
            if (houseInfo) break;
          }
        }
      }
    }

    if (houseInfo) {
      result.sign = houseInfo.HouseZodiacSign || houseInfo.Sign || houseInfo.ZodiacSign || extractDeep(houseInfo, 'Sign') || 'N/A';
      result.lord = houseInfo.Lord || houseInfo.HouseLord || extractDeep(houseInfo, 'Lord') || 'N/A';

      if (typeof result.sign === 'object') result.sign = result.sign.Name || JSON.stringify(result.sign);
      if (typeof result.lord === 'object') result.lord = result.lord.Name || JSON.stringify(result.lord);
    }
  } catch (err) {}

  return result;
}

function renderDasha(data) {
  const container = document.getElementById('bc-dasha-content');
  container.innerHTML = '';

  if (!data) {
    container.innerHTML = '<p style="color:var(--ink-dim);">Dasha data unavailable.</p>';
    return;
  }

  try {
    // VedAstro DasaForNow returns current dasha levels
    const dashaList = parseDashaData(data);

    if (dashaList.length === 0) {
      container.innerHTML = '<p style="color:var(--ink-dim);">Could not parse Dasha data.</p>';
      return;
    }

    const dashaHTML = dashaList.map((d, i) => {
      const levelLabels = ['Mahadasha', 'Bhukti (Antardasha)', 'Pratyantar'];
      const levelClass = i === 0 ? 'dasha-mahadasha' : i === 1 ? 'dasha-bhukti' : 'dasha-pratyantar';
      return `
        <div class="dasha-item ${levelClass}">
          <span class="dasha-level">${levelLabels[i] || `Level ${i + 1}`}</span>
          <span class="dasha-lord">${d.lord || 'N/A'}</span>
          <span class="dasha-period">${d.start || ''} — ${d.end || ''}</span>
          ${d.nature ? `<span class="dasha-nature dasha-${d.nature.toLowerCase()}">${d.nature}</span>` : ''}
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="dasha-current">
        <p style="color:var(--gold-ink); font-family:var(--font-ui); font-size:0.72rem; letter-spacing:0.15em; text-transform:uppercase; margin-bottom:1rem;">Current Running Periods</p>
        ${dashaHTML}
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<p style="color:var(--ink-dim);">Could not display Dasha timeline.</p>';
  }
}

function parseDashaData(data) {
  const result = [];

  if (!data) return result;

  try {
    // Handle various response formats
    let levels = null;

    if (Array.isArray(data)) {
      levels = data;
    } else if (data.DasaForNow) {
      levels = Array.isArray(data.DasaForNow) ? data.DasaForNow : [data.DasaForNow];
    } else if (data.Dasa || data.Dasha) {
      const d = data.Dasa || data.Dasha;
      levels = Array.isArray(d) ? d : [d];
    } else {
      // Try to find nested dasha array
      for (const key in data) {
        if (Array.isArray(data[key])) {
          levels = data[key];
          break;
        } else if (typeof data[key] === 'object' && data[key]) {
          const inner = data[key];
          if (inner.Lord || inner.lord || inner.DasaName) {
            result.push({
              lord: inner.Lord || inner.lord || inner.DasaName || 'N/A',
              start: inner.StartDate || inner.Start || inner.start || '',
              end: inner.EndDate || inner.End || inner.end || '',
              nature: inner.Nature || inner.nature || ''
            });
          }
        }
      }
    }

    if (levels && Array.isArray(levels)) {
      levels.forEach(level => {
        result.push({
          lord: level.Lord || level.lord || level.DasaName || level.Name || level.PlanetName || 'N/A',
          start: formatDashaDate(level.StartDate || level.Start || level.start),
          end: formatDashaDate(level.EndDate || level.End || level.end),
          nature: level.Nature || level.nature || ''
        });
      });
    }
  } catch (err) {}

  return result.slice(0, 3); // Max 3 levels
}

function formatDashaDate(dateStr) {
  if (!dateStr) return '';
  // Try to parse and format
  try {
    if (typeof dateStr === 'object' && dateStr.StdDateTimeText) return dateStr.StdDateTimeText;
    if (typeof dateStr === 'object') return JSON.stringify(dateStr);
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return dateStr.toString();
  } catch (e) {
    return dateStr ? dateStr.toString() : '';
  }
}

function renderPredictions(data) {
  const container = document.getElementById('bc-predictions-content');
  const section = document.getElementById('bc-predictions-section');

  if (!data) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  try {
    let predictionsList = [];

    if (Array.isArray(data)) {
      predictionsList = data;
    } else if (data.HoroscopePredictions) {
      predictionsList = Array.isArray(data.HoroscopePredictions) ? data.HoroscopePredictions : [];
    } else {
      for (const key in data) {
        if (Array.isArray(data[key])) {
          predictionsList = data[key];
          break;
        }
      }
    }

    if (predictionsList.length === 0) {
      section.style.display = 'none';
      return;
    }

    // Show up to 15 predictions
    const display = predictionsList.slice(0, 15);

    container.innerHTML = display.map(p => {
      const name = p.Name || p.name || 'Yoga';
      const desc = p.Description || p.description || p.Info || '';
      const nature = p.Nature || p.nature || '';
      const natureClass = nature.toLowerCase() === 'good' ? 'prediction-good' : nature.toLowerCase() === 'bad' ? 'prediction-bad' : 'prediction-neutral';

      return `
        <div class="prediction-item ${natureClass}">
          <div class="prediction-header">
            <strong>${name}</strong>
            ${nature ? `<span class="prediction-nature">${nature}</span>` : ''}
          </div>
          <p>${desc}</p>
        </div>
      `;
    }).join('');

    if (predictionsList.length > 15) {
      container.innerHTML += `<p style="color:var(--ink-dim); font-size:0.85rem; margin-top:1rem; text-align:center;">Showing 15 of ${predictionsList.length} yogas found. <a href="/consultation/">Book a consultation</a> for a complete analysis.</p>`;
    }
  } catch (err) {
    section.style.display = 'none';
  }
}


// ===== MARRIAGE COMPATIBILITY =====
async function generateCompatibility(e) {
  e.preventDefault();
  hideError('compat-error');
  document.getElementById('compat-results').style.display = 'none';
  setLoading('compat-submit', true);

  const maleTime = formatTimeParam(
    document.getElementById('male-date').value,
    document.getElementById('male-time').value,
    document.getElementById('male-timezone').value,
    document.getElementById('male-place').value
  );

  const femaleTime = formatTimeParam(
    document.getElementById('female-date').value,
    document.getElementById('female-time').value,
    document.getElementById('female-timezone').value,
    document.getElementById('female-place').value
  );

  try {
    const payload = await fetchAPI(`MatchReport/${maleTime}/${femaleTime}`);
    renderCompatibility(payload);
  } catch (err) {
    showError('compat-error', err.message || 'Failed to generate compatibility report. Please check the birth details and try again.');
  } finally {
    setLoading('compat-submit', false);
  }
}

function renderCompatibility(data) {
  const results = document.getElementById('compat-results');
  results.style.display = 'block';

  const maleName = document.getElementById('male-name').value.trim();
  const femaleName = document.getElementById('female-name').value.trim();

  document.getElementById('compat-results-meta').textContent = `${maleName} & ${femaleName}`;

  // Parse match report
  let report = data;
  if (data.MatchReport) report = data.MatchReport;

  // Score
  const kutaScore = report.KutaScore || 0;
  const scoreOut36 = Math.round((kutaScore / 100) * 36);
  const scoreColor = kutaScore >= 60 ? 'var(--patina)' : kutaScore >= 40 ? 'var(--gold-ink)' : 'var(--vermillion)';

  document.getElementById('compat-score-num').textContent = scoreOut36;
  document.getElementById('compat-score-num').style.color = scoreColor;

  const summary = report.Summary || {};
  document.getElementById('compat-score-summary').textContent = getScoreLabel(kutaScore);
  document.getElementById('compat-score-desc').textContent = summary.ScoreSummary || getScoreDescription(kutaScore);

  // Kuta table
  renderKutaTable(report.PredictionList || []);

  // Extra factors
  renderExtraFactors(report.PredictionList || []);

  // Scroll
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });

  setTimeout(() => {
    results.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
  }, 100);
}

function getScoreLabel(score) {
  if (score >= 80) return 'Excellent Match';
  if (score >= 60) return 'Good Compatibility';
  if (score >= 40) return 'Average Compatibility';
  if (score >= 20) return 'Below Average';
  return 'Challenging Match';
}

function getScoreDescription(score) {
  if (score >= 80) return 'A rare and highly compatible match. The planetary alignments strongly favor this union.';
  if (score >= 60) return 'Good overall compatibility. Most Kuta factors are favorable for a harmonious relationship.';
  if (score >= 40) return 'Moderate compatibility. Some factors are favorable while others need attention. Remedies may help.';
  if (score >= 20) return 'Below average compatibility. Several factors need careful consideration. Consult an astrologer for remedies.';
  return 'Significant challenges indicated. A detailed consultation is strongly recommended before proceeding.';
}

function renderKutaTable(predictions) {
  const tbody = document.querySelector('#compat-kuta-table tbody');
  tbody.innerHTML = '';

  // The 8 scored Kutas and their max points
  const scoredKutas = {
    'Nadi': 8, 'Rasi': 7, 'Bhakut': 7, 'Guna': 6, 'Gana': 6,
    'Graha Maitram': 5, 'Graha Maitri': 5,
    'Yoni': 4, 'Dina': 3, 'Tara': 3, 'Vasya': 2, 'Varna': 1
  };

  const mainKutas = [];
  const extraFactors = [];

  predictions.forEach(p => {
    const name = p.Name || p.name || '';
    let isScored = false;
    for (const kuta in scoredKutas) {
      if (name.toLowerCase().includes(kuta.toLowerCase())) {
        isScored = true;
        break;
      }
    }
    if (isScored) {
      mainKutas.push(p);
    } else {
      extraFactors.push(p);
    }
  });

  if (mainKutas.length === 0 && predictions.length > 0) {
    // If we couldn't categorize, show all in main table
    predictions.forEach(p => mainKutas.push(p));
  }

  mainKutas.forEach(p => {
    const name = p.Name || p.name || 'Unknown';
    const nature = p.Nature || p.nature || 'Neutral';
    const natureClass = nature.toLowerCase() === 'good' ? 'nature-good' : nature.toLowerCase() === 'bad' ? 'nature-bad' : 'nature-neutral';
    const info = p.Info || p.info || p.Description || '';

    // Find max points
    let maxPts = '-';
    for (const kuta in scoredKutas) {
      if (name.toLowerCase().includes(kuta.toLowerCase())) {
        maxPts = scoredKutas[kuta];
        break;
      }
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${name}</strong></td>
      <td>${maxPts}</td>
      <td><span class="${natureClass}">${nature}</span></td>
      <td>${info}</td>
    `;
    tbody.appendChild(row);
  });
}

function renderExtraFactors(predictions) {
  const container = document.getElementById('compat-extra-content');
  const section = document.getElementById('compat-extra-section');

  const scoredNames = ['nadi', 'rasi', 'bhakut', 'guna', 'gana', 'graha', 'maitram', 'maitri', 'yoni', 'dina', 'tara', 'vasya', 'varna'];

  const extras = predictions.filter(p => {
    const name = (p.Name || p.name || '').toLowerCase();
    return !scoredNames.some(k => name.includes(k));
  });

  if (extras.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  container.innerHTML = extras.map(p => {
    const name = p.Name || p.name || '';
    const nature = p.Nature || p.nature || '';
    const info = p.Info || p.info || p.Description || '';
    const maleInfo = p.MaleInfo || '';
    const femaleInfo = p.FemaleInfo || '';
    const natureClass = nature.toLowerCase() === 'good' ? 'prediction-good' : nature.toLowerCase() === 'bad' ? 'prediction-bad' : 'prediction-neutral';

    return `
      <div class="prediction-item ${natureClass}">
        <div class="prediction-header">
          <strong>${name}</strong>
          ${nature ? `<span class="prediction-nature">${nature}</span>` : ''}
        </div>
        <p>${info}</p>
        ${maleInfo ? `<p style="font-size:0.82rem; color:var(--ink-dim);"><strong>Male:</strong> ${maleInfo}</p>` : ''}
        ${femaleInfo ? `<p style="font-size:0.82rem; color:var(--ink-dim);"><strong>Female:</strong> ${femaleInfo}</p>` : ''}
      </div>
    `;
  }).join('');
}
