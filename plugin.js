// plugin.js - Enhanced Counter Tester v1.6.1: Complete Code with Type Inputs & Icon Swap

(function() {
  'use strict';

  // Globals
  let testId = localStorage.getItem('testId') || 'vvXGdbwJ4LNCBStVvAyWR'; // Default StopWatch from JSON
  let headerButtonId = null;
  let consoleUI = null;
  let isConsoleVisible = localStorage.getItem('consoleVisible') === 'true';
  let allCounters = [];
  let customDate = '2025-11-07';
  let partialModal = null;

  // API check
  const hasFullAPI = typeof PluginAPI !== 'undefined' && PluginAPI.getAllSimpleCounters && PluginAPI.updateSimpleCounter && PluginAPI.deleteSimpleCounter && PluginAPI.setSimpleCounterDate;

  // Snack helper
  function showMessage(msg, type = 'INFO', ico = 'info') {
    if (PluginAPI && PluginAPI.showSnack) {
      PluginAPI.showSnack({ msg, type, ico, duration: 5000 });
    } else {
      console.log(`[Counter Tester] ${type}: ${msg}`);
      appendToConsole(`[Snack] ${type}: ${msg}`);
    }
  }

  // Append log with copy button
  function appendToConsole(htmlMsg, isError = false) {
    if (!consoleUI) return;
    const logDiv = document.createElement('div');
    logDiv.className = `console-log ${isError ? 'error' : ''}`;
    logDiv.style.userSelect = 'text';
    logDiv.innerHTML = `[${new Date().toLocaleTimeString()}] ${htmlMsg} <button onclick="copyLog(this.parentNode)" style="font-size:10px;padding:2px 4px;background:#666;border:none;border-radius:2px;cursor:pointer;">📋</button>`;
    const logsContainer = consoleUI.querySelector('.console-logs');
    logsContainer.appendChild(logDiv);
    logsContainer.scrollTop = logsContainer.scrollHeight;
  }

  // Copy log entry
  window.copyLog = function(logDiv) {
    const text = logDiv.innerText.replace(/\[.*?\] /, '').replace(' 📋', '');
    navigator.clipboard.writeText(text).then(() => {
      showMessage('Log copied!', 'SUCCESS', 'content_copy');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showMessage('Copied via fallback.', 'INFO', 'content_copy');
    });
  };

  // Parse time string to ms
  function parseTime(str) {
    //const match = str.match(/(\d+)h\s*(\d+)m\s*(\d+)s?/i);
    //if (!match) throw new Error('Invalid format: use 1h 2m 3s (partials OK)');
    //const h = parseInt(match[1]) || 0;
    //const m = parseInt(match[2]) || 0;
    //const s = parseInt(match[3]) || 0;
    const h = parseInt(str.match(/(\d+)h/i)) || 0;
	const m = parseInt(str.match(/(\d+)m/i)) || 0;
	const s = parseInt(str.match(/(\d+)s/i)) || 0;
	return h * 3600000 + m * 60000 + s * 1000;
  }

  // Format ms to time string
  function formatTime(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h ? h + 'h ' : ''}${m ? m + 'm ' : ''}${s ? s + 's' : ''}`.trim();
  }

  // Render countOnDay table (recent first)
  function renderCountOnDay(type, countOnDay) {
    if (!countOnDay || Object.keys(countOnDay).length === 0) return '<em>Empty</em>';
	if (type === 'StopWatch') return `<table><tr><th>Date</th><th>Value</th></tr>${Object.entries(countOnDay).sort(([a], [b]) => b.localeCompare(a)).map(([date, value]) => `<tr><td>${date}</td><td>${formatTime(value)}</td></tr>`).join('')}</table>`;
    return `<table><tr><th>Date</th><th>Value</th></tr>${Object.entries(countOnDay).sort(([a], [b]) => b.localeCompare(a)).map(([date, value]) => `<tr><td>${date}</td><td>${value}</td></tr>`).join('')}</table>`;
  }

  // Render counter with type-specific info
  function renderCounter(c, isSelected = false) {
    const today = new Date().toISOString().split('T')[0];
    const todayCount = c.type === 'StopWatch' ? formatTime(c.countOnDay?.[today]?? 0) : c.countOnDay?.[today]?? 0;
    const typeClass = c.type.toLowerCase().replace(/ /g, '-');
    const typeBadge = `<span class="type-badge ${typeClass}">${c.type}</span>`;
    const statusBadge = `<span class="status-badge ${c.isEnabled ? 'enabled' : 'disabled'}">${c.isEnabled ? '✓' : '✗'}</span><span class="status-badge ${c.isOn ? 'on' : 'off'}">${c.isOn ? 'ON' : 'OFF'}</span>`;
    const streakInfo = c.isTrackStreaks ? `<br>Streak Min: ${c.type === 'StopWatch' ? formatTime(c.streakMinValue || 0) : c.streakMinValue || 0} (Days: ${Object.values(c.streakWeekDays || {}).filter(Boolean).length}/7)` : '';
    const durationInfo = (c.type === 'RepeatedCountdownReminder') ? `<br>Duration: ${formatTime(c.countdownDuration || 0)}` : '';
    const historyTable = renderCountOnDay(c.type, c.countOnDay);
    const jsonDetails = `<details><summary>${c.id}: ${todayCount} ${streakInfo}${durationInfo} ${statusBadge}</summary><div>History: ${historyTable}</div><pre>${JSON.stringify(c, null, 2).slice(0, 500)}${JSON.stringify(c, null, 2).length > 500 ? '...' : ''}</pre></details>`;
    return `${typeBadge} ${isSelected ? '<strong>' : ''}${jsonDetails}${isSelected ? '</strong>' : ''}`;
  }

  // Update dropdown (all counters, gray disabled)
  function updateCounterDropdown(counters) {
    allCounters = counters;
    const select = consoleUI?.querySelector('#counter-select');
    if (!select) return;
    select.innerHTML = '<option value="">Select Any...</option>' + allCounters.map(c => `<option value="${c.id}" ${c.id === testId ? 'selected' : ''} style="${!c.isEnabled ? 'color: gray;' : ''}">${c.title || c.id} (${c.type}) ${!c.isEnabled ? '[Disabled]' : ''}</option>`).join('');
  }

  // Show partial edit modal (conditional duration field)
  function showPartialModal(counter) {
    if (partialModal) return;
    const hasDuration = counter.type === 'StopWatch' || counter.type === 'RepeatedCountdownReminder';
    partialModal = document.createElement('div');
    partialModal.id = 'partial-modal';
    partialModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10001;display:flex;align-items:center;justify-content:center;';
    partialModal.innerHTML = `
      <div style="background:#1e1e1e;padding:20px;border-radius:8px;max-width:300px;width:90%;max-height:80vh;overflow-y:auto;">
        <h4>Edit ${counter.title || counter.id}</h4>
        <label>Title: <input type="text" id="modal-title" value="${counter.title || counter.id}" style="width:100%;margin-bottom:10px;padding:5px;background:#333;color:#fff;border:none;border-radius:4px;"></label>
        <label>Streak Min (ms): <input type="number" id="modal-streak-min" value="${counter.streakMinValue || 0}" min="0" style="width:100%;margin-bottom:10px;padding:5px;background:#333;color:#fff;border:none;border-radius:4px;"></label>
        ${hasDuration ? `<label>Duration (ms): <input type="number" id="modal-duration" value="${counter.countdownDuration || 0}" min="0" style="width:100%;margin-bottom:10px;padding:5px;background:#333;color:#fff;border:none;border-radius:4px;"></label>` : ''}
        <label>Track Streaks: <input type="checkbox" id="modal-track-streaks" ${counter.isTrackStreaks ? 'checked' : ''} style="margin-bottom:10px;"></label>
        <div style="text-align:right;">
          <button onclick="submitPartial()" style="padding:5px 10px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-right:10px;">Save</button>
          <button onclick="closePartialModal()" style="padding:5px 10px;background:#666;color:#fff;border:none;border-radius:4px;cursor:pointer;">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(partialModal);
    partialModal.addEventListener('click', (e) => { if (e.target === partialModal) closePartialModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePartialModal(); });
  }

  window.submitPartial = async function() {
    if (!testId || !hasFullAPI) return;
    try {
      const title = document.getElementById('modal-title').value;
      const streakMin = parseInt(document.getElementById('modal-streak-min').value) || 0;
      const trackStreaks = document.getElementById('modal-track-streaks').checked;
      const updates = { title, streakMinValue: streakMin, isTrackStreaks: trackStreaks };
      const durationEl = document.getElementById('modal-duration');
      if (durationEl) updates.countdownDuration = parseInt(durationEl.value) || 0;
      await PluginAPI.updateSimpleCounter(testId, updates);
      appendToConsole(`Partial saved: ${JSON.stringify(updates)}`);
      showMessage('Updated via modal!', 'SUCCESS', 'edit');
      closePartialModal();
      await testGetAllFullCounters();
    } catch (error) {
      const errMsg = `Error: ${error.message}`;
      appendToConsole(errMsg, true);
      showMessage(errMsg, 'WARNING', 'error');
    }
  };

  window.closePartialModal = function() {
    if (partialModal) {
      document.body.removeChild(partialModal);
      partialModal = null;
    }
  };

  // Create console UI
  function createConsoleUI() {
    if (consoleUI) return;

    const style = document.createElement('style');
    style.textContent = `
      #counter-tester-console { position: fixed; top: 20px; right: 20px; width: 500px; height: 600px; background: #1e1e1e; color: #fff; border: 1px solid #333; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 10000; font-family: monospace; font-size: 12px; display: flex; flex-direction: column; touch-action: none; }
      .console-header { background: #333; padding: 8px; cursor: move; user-select: none; display: flex; justify-content: space-between; align-items: center; border-radius: 8px 8px 0 0; }
      .console-header h3 { margin: 0; font-size: 14px; }
      .console-toggle { background: none; border: none; color: #fff; font-size: 18px; cursor: pointer; padding: 4px; }
      .console-logs { flex: 1; overflow-y: auto; padding: 8px; border-top: 1px solid #333; }
      .console-log { margin-bottom: 4px; word-break: break-all; position: relative; }
      .console-log.error { color: #ff6b6b; }
      .type-badge, .status-badge { padding: 2px 6px; border-radius: 4px; color: #fff; font-size: 10px; margin-right: 4px; }
      .type-badge.clickcounter { background: #4caf50; } .type-badge.stopwatch { background: #ff9800; } .type-badge.repeatedcountdownreminder { background: #9c27b0; }
      .status-badge.enabled { background: #4caf50; } .status-badge.disabled { background: #f44336; } .status-badge.on { background: #2196f3; } .status-badge.off { background: #757575; }
      details pre, details table { background: #2d2d2d; padding: 8px; border-radius: 4px; margin: 4px 0; overflow-x: auto; font-size: 11px; } details table { border-collapse: collapse; width: 100%; } details th, details td { border: 1px solid #555; padding: 2px; text-align: left; }
      .console-controls { padding: 8px; border-top: 1px solid #333; background: #2d2d2d; border-radius: 0 0 8px 8px; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
      .console-controls button, .console-controls select, .console-controls input { background: #555; color: #fff; border: none; padding: 6px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; }
      .console-controls button:hover { background: #666; } .console-controls button:active { background: #444; } .console-controls input { min-width: 60px; } .console-controls select { min-width: 140px; }
      #partial-modal input, #partial-modal label { display: block; width: 100%; margin-bottom: 10px; }
    `;
    document.head.appendChild(style);

    consoleUI = document.createElement('div');
    consoleUI.id = 'counter-tester-console';
    consoleUI.innerHTML = `
      <div class="console-header">
        <h3>Counter Tester v1.6.1</h3>
        <button class="console-toggle" onclick="toggleConsole()">${isConsoleVisible ? '−' : '+'}</button>
      </div>
      <div class="console-logs"></div>
      <div class="console-controls">
        <select id="counter-select" onchange="selectCounter(this.value)">
          <option value="">Select Any...</option>
        </select>
        <input type="text" id="date-input" placeholder="YYYY-MM-DD" value="${customDate}" onchange="customDate = this.value" style="min-width:80px;">
        <input type="number" id="value-input" placeholder="Count/Amount" min="0" value="10" style="min-width:60px;">
        <input type="text" id="time-input" placeholder="Duration: 1h 15m 34s" style="min-width:100px;display:none;">
        <button id="get-full-btn" onclick="runTest('getFull')">Get Full</button>
        <button id="toggle-enabled-btn" onclick="runTest('toggleEnabled')">Toggle Enabled</button>
        <button id="toggle-on-btn" onclick="runTest('toggleOn')" style="display:none;">Toggle On</button>
        <button id="inc-btn" onclick="runTest('inc')" style="display:none;">Inc (+Input)</button>
        <button id="dec-btn" onclick="runTest('dec')" style="display:none;">Dec (-Input)</button>
        <button id="update-partial-btn" onclick="runTest('updatePartial')">Update Partial (Modal)</button>
        <button id="set-today-btn" onclick="runTest('setToday')" style="display:none;">Set Today (Input)</button>
        <button onclick="runTest('setDate')">Set Date (Input Val)</button>
        <button onclick="runTest('delete')">Delete</button>
        <button onclick="runTest('full')">Full Suite</button>
        <button onclick="clearLogs()">Clear</button>
      </div>
    `;
    document.body.appendChild(consoleUI);
    consoleUI.style.display = isConsoleVisible ? 'flex' : 'none';

    // Full draggable impl
    const header = consoleUI.querySelector('.console-header');
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    function onDragStart(e) {
      isDragging = true;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      startX = clientX;
      startY = clientY;
      initialLeft = consoleUI.offsetLeft;
      initialTop = consoleUI.offsetTop;
      e.preventDefault();
    }
    function onDrag(e) {
      if (!isDragging) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;
      let newLeft = initialLeft + deltaX;
      let newTop = initialTop + deltaY;
      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - 500));
      newTop = Math.max(0, Math.min(newTop, window.innerHeight - 600));
      consoleUI.style.left = newLeft + 'px';
      consoleUI.style.top = newTop + 'px';
      consoleUI.style.right = 'auto';
      e.preventDefault();
    }
    function onDragEnd(e) {
      isDragging = false;
      e.preventDefault();
    }
    header.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', onDragEnd);
    header.addEventListener('touchstart', onDragStart, { passive: false });
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', onDragEnd, { passive: false });

    // Update controls for type
    function updateTypeButtons(type) {
      const toggleOnBtn = document.getElementById('toggle-on-btn');
      const incBtn = document.getElementById('inc-btn');
      const decBtn = document.getElementById('dec-btn');
      const timeInput = document.getElementById('time-input');
      const valueInput = document.getElementById('value-input');
      const setTodayBtn = document.getElementById('set-today-btn');
      if (type === 'ClickCounter') {
        toggleOnBtn.style.display = 'none';
        incBtn.style.display = 'inline';
        decBtn.style.display = 'inline';
        timeInput.style.display = 'none';
        valueInput.style.display = 'inline';
        valueInput.placeholder = 'Amount';
        setTodayBtn.style.display = 'inline';
      } else if (type === 'StopWatch') {
        toggleOnBtn.style.display = 'inline';
        incBtn.style.display = 'none';
        decBtn.style.display = 'none';
        timeInput.style.display = 'inline';
        valueInput.style.display = 'none';
        setTodayBtn.style.display = 'none';
        timeInput.placeholder = 'Duration: 1h 30m';
      } else if (type === 'RepeatedCountdownReminder') {
        toggleOnBtn.style.display = 'inline';
        incBtn.style.display = 'none';
        decBtn.style.display = 'none';
        timeInput.style.display = 'none';
        valueInput.style.display = 'inline';
        valueInput.placeholder = 'Count';
        setTodayBtn.style.display = 'inline';
      } else {
        toggleOnBtn.style.display = 'inline';
        incBtn.style.display = 'none';
        decBtn.style.display = 'none';
        timeInput.style.display = 'none';
        valueInput.style.display = 'inline';
        valueInput.placeholder = 'Value';
        setTodayBtn.style.display = 'inline';
      }
    }

    // Expose globals
    window.toggleConsole = toggleConsole;
    window.runTest = runTest;
    window.clearLogs = clearLogs;
    window.selectCounter = function(id) {
      if (id) {
        testId = id;
        localStorage.setItem('testId', id);
        appendToConsole(`Selected: ${id}`);
        showMessage(`Selected ${id}`, 'INFO', 'selection');
      }
      const selectedCounter = allCounters.find(c => c.id === id);
      if (selectedCounter) updateTypeButtons(selectedCounter.type);
    };

    appendToConsole('Type-tailored console ready: Duration for StopWatch, Count for Repeated.');
    if (hasFullAPI) showMessage('Type inputs active—e.g., time for duration sets.', 'SUCCESS', 'watch_later');
  }

  // Toggle console visibility
  function toggleConsole() {
    isConsoleVisible = !isConsoleVisible;
    consoleUI.style.display = isConsoleVisible ? 'flex' : 'none';
    localStorage.setItem('consoleVisible', isConsoleVisible);
    const toggleBtn = consoleUI.querySelector('.console-toggle');
    toggleBtn.textContent = isConsoleVisible ? '−' : '+';
    appendToConsole(`Console ${isConsoleVisible ? 'shown' : 'hidden'}.`);
  }

  // Clear logs
  function clearLogs() {
    const logsContainer = consoleUI.querySelector('.console-logs');
    logsContainer.innerHTML = '';
    appendToConsole('Logs cleared.');
  }

  // Get all full counters
  async function testGetAllFullCounters() {
    if (!hasFullAPI) {
      appendToConsole('Full API unavailable.', true);
      return;
    }
    try {
      const counters = await PluginAPI.getAllSimpleCounters();
      updateCounterDropdown(counters);
      const rendered = counters.map(c => renderCounter(c, c.id === testId)).join('');
      appendToConsole(`Full (${counters.length}):<br>${rendered}`);
      showMessage(`Loaded ${counters.length}—type controls updated.`, 'SUCCESS', 'table_view');
    } catch (error) {
      const errMsg = `Error: ${error.message}`;
      appendToConsole(errMsg, true);
      showMessage(errMsg, 'WARNING', 'error');
    }
  }

  // Toggle enabled
  async function testToggleEnabled() {
    if (!testId || !hasFullAPI) return;
    try {
      const current = await PluginAPI.getSimpleCounter(testId);
      const isEnabled = !current?.isEnabled;
      await PluginAPI.setSimpleCounterEnabled(testId, isEnabled);
      appendToConsole(`Toggled enabled: ${isEnabled}`);
      showMessage(`${testId} ${isEnabled ? 'enabled' : 'disabled'}`, 'SUCCESS', isEnabled ? 'check' : 'close');
      await testGetAllFullCounters();
    } catch (error) {
      const errMsg = `Error: ${error.message}`;
      appendToConsole(errMsg, true);
      showMessage(errMsg, 'WARNING', 'error');
    }
  }

  // Toggle on/off
  async function testToggleOn() {
    if (!testId || !hasFullAPI) return;
    try {
      await PluginAPI.toggleSimpleCounter(testId);
      const updated = await PluginAPI.getSimpleCounter(testId);
      const isOn = updated?.isOn;
      appendToConsole(`Toggled on: ${isOn}`);
      showMessage(`${testId} ${isOn ? 'ON' : 'OFF'}`, 'SUCCESS', isOn ? 'play_arrow' : 'pause');
      await testGetAllFullCounters();
    } catch (error) {
      const errMsg = `Error: ${error.message}`;
      appendToConsole(errMsg, true);
      showMessage(errMsg, 'WARNING', 'error');
    }
  }

  // Increment (ClickCounter)
  async function testInc() {
    if (!testId || !hasFullAPI) return;
    const amount = parseInt(document.getElementById('value-input').value) || 1;
    if (amount <= 0) {
      showMessage('Amount >0 required', 'WARNING', 'error');
      return;
    }
    try {
      await PluginAPI.incrementCounter(testId, amount);
      appendToConsole(`Inc by ${amount} (input)`);
      showMessage(`Inc ${testId} by ${amount}`, 'SUCCESS', 'add');
      document.getElementById('value-input').value = '';
      await testGetAllFullCounters();
    } catch (error) {
      const errMsg = `Error: ${error.message}`;
      appendToConsole(errMsg, true);
      showMessage(errMsg, 'WARNING', 'error');
    }
  }

  // Decrement (ClickCounter)
  async function testDec() {
    if (!testId || !hasFullAPI) return;
    const amount = parseInt(document.getElementById('value-input').value) || 1;
    if (amount <= 0) {
      showMessage('Amount >0 required', 'WARNING', 'error');
      return;
    }
    try {
      await PluginAPI.decrementCounter(testId, amount);
      appendToConsole(`Dec by ${amount} (input, floor 0)`);
      showMessage(`Dec ${testId} by ${amount}`, 'SUCCESS', 'remove');
      document.getElementById('value-input').value = '';
      await testGetAllFullCounters();
    } catch (error) {
      const errMsg = `Error: ${error.message}`;
      appendToConsole(errMsg, true);
      showMessage(errMsg, 'WARNING', 'error');
    }
  }

  // Get single counter
  async function testGetCounter() {
    if (!testId || !hasFullAPI) return;
    try {
      const counter = await PluginAPI.getSimpleCounter(testId);
      const today = new Date().toISOString().split('T')[0];
      const value = counter ? counter.countOnDay?.[today] ?? 0 : undefined;
      appendToConsole(`Single: ${testId} today = ${value}`);
      showMessage(`${testId}: ${value}`, 'INFO', 'query_builder');
    } catch (error) {
      const errMsg = `Error: ${error.message}`;
      appendToConsole(errMsg, true);
      showMessage(errMsg, 'WARNING', 'error');
    }
  }

  // Update partial via modal
  async function testUpdatePartial() {
    if (!testId || !hasFullAPI) return;
    const counter = allCounters.find(c => c.id === testId);
    if (!counter) {
      showMessage('Select first.', 'WARNING', 'warning');
      return;
    }
    showPartialModal(counter);
  }

  // Set today count
  async function testSetToday() {
    if (!testId || !hasFullAPI) return;
    const value = parseInt(document.getElementById('value-input').value) || 10;
    if (value < 0 || !isFinite(value)) {
      showMessage('Non-negative integer.', 'WARNING', 'error');
      return;
    }
    try {
      await PluginAPI.setSimpleCounterToday(testId, value);
      appendToConsole(`Set today count: ${value} (input)`);
      showMessage(`Today count: ${value}`, 'SUCCESS', 'today');
      document.getElementById('value-input').value = '';
      await testGetAllFullCounters();
    } catch (error) {
      const errMsg = `Error: ${error.message}`;
      appendToConsole(errMsg, true);
      showMessage(errMsg, 'WARNING', 'error');
    }
  }

  // Set date-specific value
  async function testSetDate() {
    if (!testId || !hasFullAPI) return;
    const date = document.getElementById('date-input').value || customDate;
    let value = parseInt(document.getElementById('value-input').value) || 8;
    if (value < 0 || !isFinite(value)) {
      showMessage('Non-negative integer.', 'WARNING', 'error');
      return;
	}
	//Time for StopWatch counters
	const timeStr = document.getElementById('time-input').value;
    if (!timeStr) {
      showMessage('Enter time: 1h 30m', 'WARNING', 'error');
      return;
	}
	//Check type
	const c = await PluginAPI.getSimpleCounter(testId);
	if (c.type === 'StopWatch') {
		value = parseTime(timeStr);
	}
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      showMessage('Date: YYYY-MM-DD', 'WARNING', 'error');
      return;
    }
    try {
      await PluginAPI.setSimpleCounterDate(testId, date, value);
      appendToConsole(`Set ${date}: ${value} (inputs)`);
      showMessage(`${date}: ${value}`, 'SUCCESS', 'event');
      document.getElementById('value-input').value = '';
      await testGetAllFullCounters();
    } catch (error) {
      const errMsg = `Error: ${error.message}`;
      appendToConsole(errMsg, true);
      showMessage(errMsg, 'WARNING', 'error');
    }
  }

  // Set duration for StopWatch/Repeated (via time input)
  async function testSetDuration() {
    if (!testId || !hasFullAPI) return;
    const timeStr = document.getElementById('time-input').value;
    if (!timeStr) {
      showMessage('Enter time: 1h 30m', 'WARNING', 'error');
      return;
    }
    try {
      const durationMs = parseTime(timeStr);
      await PluginAPI.updateSimpleCounter(testId, { countdownDuration: durationMs });
      appendToConsole(`Set duration: ${timeStr} (${durationMs}ms)`);
      showMessage(`Duration: ${timeStr}`, 'SUCCESS', 'timer');
      document.getElementById('time-input').value = '';
      await testGetAllFullCounters();
    } catch (error) {
      const errMsg = `Error: ${error.message}`;
      appendToConsole(errMsg, true);
      showMessage(errMsg, 'WARNING', 'error');
    }
  }

  // Delete counter
  async function testDelete() {
    if (!testId || !hasFullAPI) {
      showMessage('Select first.', 'WARNING', 'warning');
      return;
    }
    const confirm = window.confirm(`Delete ${testId}?`);
    if (!confirm) {
      appendToConsole('Cancelled.');
      return;
    }
    try {
      await PluginAPI.deleteSimpleCounter(testId);
      appendToConsole(`Deleted: ${testId}`);
      showMessage(`${testId} deleted.`, 'SUCCESS', 'delete_forever');
      testId = allCounters[0]?.id || '';
      localStorage.setItem('testId', testId);
      updateCounterDropdown(allCounters);
      await testGetAllFullCounters();
    } catch (error) {
      const errMsg = `Error: ${error.message}`;
      appendToConsole(errMsg, true);
      showMessage(errMsg, 'WARNING', 'error');
    }
  }

  // Basic get all counters
  async function testGetAllCounters() {
    try {
      const counters = await PluginAPI.getAllCounters();
      const summary = Object.entries(counters).map(([k, v]) => `${k}: ${v}`).join(', ') || 'None.';
      appendToConsole(`Basic: ${summary}`);
      showMessage(`Basics: ${summary}`, 'SUCCESS', 'list');
      await testGetAllFullCounters();
    } catch (error) {
      const errMsg = `Error: ${error.message}`;
      appendToConsole(errMsg, true);
      showMessage(errMsg, 'WARNING', 'error');
    }
  }

  // Run test switch
  async function runTest(testType) {
    if ((testType !== 'getFull' && testType !== 'getAllBasic') && !testId) {
      showMessage('Select a counter.', 'WARNING', 'warning');
      return;
    }
    appendToConsole(`Running: ${testType} on ${testId || 'all'}`);
    switch (testType) {
      case 'getFull':
        await testGetAllFullCounters();
        break;
      case 'getAllBasic':
        await testGetAllCounters();
        break;
      case 'toggleEnabled':
        await testToggleEnabled();
        break;
      case 'toggleOn':
        await testToggleOn();
        break;
      case 'inc':
        await testInc();
        break;
      case 'dec':
        await testDec();
        break;
      case 'updatePartial':
        await testUpdatePartial();
        break;
      case 'setToday':
        await testSetToday();
        break;
      case 'setDate':
        await testSetDate();
        break;
      case 'setDuration':
        await testSetDuration();
        break;
      case 'delete':
        await testDelete();
        break;
      case 'full':
        await testGetAllFullCounters();
        if (testId) {
          const selected = allCounters.find(c => c.id === testId);
          if (selected) {
            if (selected.type === 'StopWatch') {
              document.getElementById('time-input').value = '30m';
              await testSetDuration();
            } else if (selected.type === 'RepeatedCountdownReminder') {
              document.getElementById('value-input').value = '2';
              await testSetToday();
            } else { // ClickCounter or other
              document.getElementById('value-input').value = '10';
              await testSetToday();
              await testInc();
            }
            await testToggleEnabled();
            await testUpdatePartial();
            await testDelete();
          }
        }
        appendToConsole('Type-full suite complete!');
        break;
    }
  }

  // Full test suite from header
  async function runFullTestSuite() {
    if (consoleUI) {
      appendToConsole('Suite from header.');
      runTest('full');
    } else {
      showMessage('UI not loaded.', 'WARNING', 'warning');
    }
  }

  // Register header button
  function registerTestButton() {
    if (!PluginAPI || !PluginAPI.registerHeaderButton) return;
    headerButtonId = PluginAPI.registerHeaderButton({
      id: 'counter-tester-btn',
      icon: 'watch_later',
      label: 'Toggle Tester',
      onClick: () => {
        if (consoleUI) {
          toggleConsole();
        } else {
          createConsoleUI();
          setTimeout(runFullTestSuite, 100);
        }
      },
      tooltip: `Type-tailored tester (duration/count inputs, all counters)`
    });
    createConsoleUI();
  }

  // ACTION hook for counters
  if (PluginAPI && PluginAPI.registerHook) {
    PluginAPI.registerHook(PluginAPI.Hooks.ACTION, (action) => {
      const actionType = action?.action?.type || action?.type;
      if (actionType && actionType.includes('SimpleCounter')) {
        console.log('[Counter Tester] Action:', actionType, action);
        const payloadStr = JSON.stringify(action.payload || {}, null, 2).slice(0, 100) + (JSON.stringify(action.payload || {}, null, 2).length > 100 ? '...' : '');
        appendToConsole(`Action: ${actionType} (Payload: ${payloadStr})`);
      }
    });
  }

  // Initialize
  if (typeof PluginAPI !== 'undefined') {
    registerTestButton();
  } else {
    console.error('[Counter Tester] PluginAPI unavailable.');
  }

})();