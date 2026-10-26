(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('js');

  /* ---------- LinkedIn profile ---------- */
  var LINKEDIN_URL = 'https://www.linkedin.com/in/divya-sri-741a47385';

  /* ---------- toast ---------- */
  var toast = $('#toast'), toastTimer;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2600);
  }
  $$('.js-linkedin').forEach(function (a) {
    if (LINKEDIN_URL) { a.href = LINKEDIN_URL; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    else a.addEventListener('click', function (e) { e.preventDefault(); say('LinkedIn link has not been added yet. Please use email.'); });
  });

  /* ---------- theme ---------- */
  var themeBtn = $('#theme');
  function setTheme(t, save) {
    root.setAttribute('data-theme', t);
    themeBtn.setAttribute('aria-pressed', String(t === 'light'));
    themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'light' ? '#f4f6ff' : '#0a0f2c');
    if (save) { try { localStorage.setItem('ds-theme', t); } catch (e) {} }
    drawOnce && drawOnce();
  }
  var saved = null;
  try { saved = localStorage.getItem('ds-theme'); } catch (e) {}
  var drawOnce = null;
  setTheme(saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'), false);
  themeBtn.addEventListener('click', function () {
    setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
  });

  /* ---------- copy buttons ---------- */
  $$('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.getAttribute('data-copy'));
      var text = el.textContent.trim();
      function done() { btn.textContent = 'Copied'; btn.classList.add('ok'); setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('ok'); }, 1600); }
      function fallback() {
        var r = document.createRange(); r.selectNodeContents(el);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        btn.textContent = 'Selected'; setTimeout(function () { btn.textContent = 'Copy'; }, 1600);
      }
      try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
    });
  });

  /* ---------- scroll progress + flow rail ---------- */
  var sections = $$('main > section[data-label]');
  var railList = $('#rail ul');
  var railLinks = sections.map(function (s) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#' + s.id;
    a.setAttribute('aria-label', s.getAttribute('data-label'));
    var span = document.createElement('span');
    span.textContent = s.getAttribute('data-label');
    a.appendChild(span); li.appendChild(a); railList.appendChild(li);
    return a;
  });
  var navLinks = $$('.site-header nav a');

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      root.style.setProperty('--p', p.toFixed(4));
      var fab = document.getElementById('fab'); if (fab) fab.classList.toggle('show', window.scrollY > 520 && p < 0.97);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  function setActive(id) {
    var idx = sections.findIndex(function (s) { return s.id === id; });
    railLinks.forEach(function (a, i) {
      a.classList.toggle('active', i === idx);
      a.classList.toggle('passed', i < idx);
      if (i === idx) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
    navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + id); });
  }
  if ('IntersectionObserver' in window) {
    var secIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { secIO.observe(s); });
  }
  setActive('top');

  /* ---------- reveal on scroll (applied to wrappers, not to tilting cards) ---------- */
  var revealSel = '.block h2, .sub, .prose, .pipe, .filters, .chips, .timeline, .cards, .contact h2, .crows, .contact .cta-row';
  var revealEls = $$(revealSel);
  revealEls.forEach(function (el) { el.classList.add('reveal'); });
  if ('IntersectionObserver' in window && !reduce) {
    var revIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add('in'); revIO.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { revIO.observe(el); });
    var cardIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add('in'); cardIO.unobserve(e.target); }
      });
    }, { threshold: 0.3 });
    $$('.card').forEach(function (c) { cardIO.observe(c); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    $$('.card').forEach(function (c) { c.classList.add('in'); });
  }

  /* ---------- count-up stats ---------- */
  var counters = $$('[data-count]');
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = target + suffix; return; }
    var start = null, dur = 1400;
    function tick(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + (t === 1 ? suffix : '');
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    var cIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cIO.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cIO.observe(c); });
  }

  /* ---------- cursor light + card spotlight + tilt ---------- */
  if (finePointer && !reduce) {
    var glow = $('.glow');
    window.addEventListener('pointermove', function (e) {
      glow.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      glow.classList.add('on');
    }, { passive: true });
    document.addEventListener('pointerleave', function () { glow.classList.remove('on'); });

    $$('.tilt').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.classList.add('moving');
        el.style.setProperty('--ry', ((x - .5) * 7).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((.5 - y) * 7).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('moving');
        el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
      });
    });

    /* magnetic hire button */
    $$('.magnet').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .28).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- hero chart ---------- */
  var cv = $('#chart');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, N = 22, vals = [], mx = -1, running = false, visible = true, t0 = 0;
    for (var i = 0; i < N; i++) vals.push(0.3);
    function cssVar(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function frame(t) {
      var cyan = cssVar('--cyan'), violet = cssVar('--violet'), amber = cssVar('--amber'), line = cssVar('--line');
      ctx.clearRect(0, 0, W, H);
      var padX = 6, padB = 14, padT = 14;
      var usableH = H - padB - padT, slot = (W - padX * 2) / N, bw = slot * 0.62;

      ctx.strokeStyle = line; ctx.lineWidth = 1;
      for (var g = 0; g <= 4; g++) {
        var gy = padT + usableH * g / 4;
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }
      var target = [], hover = -1, best = 1e9;
      for (var i = 0; i < N; i++) {
        var cx = padX + slot * (i + .5);
        var base = .42 + .2 * Math.sin(i * .55 + t * .0009) + .12 * Math.sin(i * 1.3 - t * .0013);
        var d = mx < 0 ? 99 : (cx - mx) / (W * .14);
        base += Math.exp(-d * d) * .32;
        target.push(Math.max(.08, Math.min(.98, base)));
        if (mx >= 0 && Math.abs(cx - mx) < best) { best = Math.abs(cx - mx); hover = i; }
      }
      for (i = 0; i < N; i++) {
        vals[i] += (target[i] - vals[i]) * (reduce ? 1 : .12);
        var h = vals[i] * usableH, x = padX + slot * i + (slot - bw) / 2, y = padT + usableH - h;
        var grad = ctx.createLinearGradient(0, y, 0, y + h);
        grad.addColorStop(0, i === hover ? amber : cyan); grad.addColorStop(1, violet);
        ctx.fillStyle = grad; ctx.globalAlpha = i === hover ? 1 : .86;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, bw, h, 5); else ctx.rect(x, y, bw, h);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      /* trend line: moving average */
      ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = amber;
      ctx.shadowColor = amber; ctx.shadowBlur = 12;
      ctx.beginPath();
      for (i = 0; i < N; i++) {
        var a = vals[Math.max(0, i - 2)], b = vals[Math.max(0, i - 1)], c = vals[i], d2 = vals[Math.min(N - 1, i + 1)], e2 = vals[Math.min(N - 1, i + 2)];
        var avg = (a + b + c + d2 + e2) / 5;
        var px = padX + slot * (i + .5), py = padT + usableH - avg * usableH - 10;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke(); ctx.shadowBlur = 0;
    }
    function loop(t) {
      if (!running) return;
      frame(t);
      requestAnimationFrame(loop);
    }
    function start() { if (!running && visible && !document.hidden && !reduce) { running = true; requestAnimationFrame(loop); } }
    function stop() { running = false; }
    drawOnce = function () { frame(performance.now()); };

    size(); frame(0);
    window.addEventListener('resize', function () { size(); frame(performance.now()); });
    cv.addEventListener('pointermove', function (e) { mx = e.clientX - cv.getBoundingClientRect().left; if (reduce) frame(performance.now()); });
    cv.addEventListener('pointerleave', function () { mx = -1; if (reduce) frame(performance.now()); });
    cv.addEventListener('pointerdown', function (e) { mx = e.clientX - cv.getBoundingClientRect().left; });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }).observe(cv);
    } else start();
    start();
  }

  /* ---------- work flow pipeline ---------- */
  var stages = [
    { t: 'Gather', d: 'Work with stakeholders and business teams to document what the reporting or analytics solution needs to answer.', k: 'BRD, FRD, wireframes, stakeholder interviews' },
    { t: 'Collect and clean', d: 'Pull data with SQL and Excel, then validate it with cross-functional teams so every report starts from accurate numbers.', k: 'SQL, MySQL, SQL Server, Excel, Power Query' },
    { t: 'Analyse', d: 'Look for trends in campaign and operational data, and run root cause analysis on issues that keep coming back.', k: 'Python (Pandas, NumPy), DAX, root cause analysis' },
    { t: 'Visualise', d: 'Build interactive Power BI dashboards that track KPIs, and automate the weekly and monthly reports around them.', k: 'Power BI, Tableau, Excel macros' },
    { t: 'Present', d: 'Share insights in reports, dashboards and presentations so the people deciding have what they need.', k: 'Stakeholder communication, presentations' }
  ];
  var pipe = $('#pipe');
  if (pipe) {
    var tabs = $$('[role="tab"]', pipe), panel = $('#stage-panel');
    var cur = 0, auto = !reduce, timer = null, inView = false;
    function select(i, user) {
      cur = i;
      tabs.forEach(function (b, j) {
        b.setAttribute('aria-selected', String(j === i));
        b.tabIndex = j === i ? 0 : -1;
        b.classList.toggle('done', j < i);
      });
      pipe.style.setProperty('--step', i);
      $('#stage-title').textContent = stages[i].t;
      $('#stage-text').textContent = stages[i].d;
      $('#stage-tools').textContent = stages[i].k;
      panel.setAttribute('aria-labelledby', tabs[i].id);
      panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
      if (user) { auto = false; clearInterval(timer); }
    }
    tabs.forEach(function (b, i) {
      b.addEventListener('click', function () { select(i, true); });
      b.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = (cur + 1) % tabs.length;
        if (e.key === 'ArrowLeft') n = (cur + tabs.length - 1) % tabs.length;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(n, true); tabs[n].focus(); }
      });
    });
    function cycle() {
      clearInterval(timer);
      if (!auto || !inView) return;
      timer = setInterval(function () { select((cur + 1) % stages.length, false); }, 3600);
    }
    pipe.addEventListener('pointerenter', function () { clearInterval(timer); });
    pipe.addEventListener('pointerleave', cycle);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; cycle(); }, { threshold: 0.4 }).observe(pipe);
    }
    select(0, false);
  }


  /* ---------- project explorer ---------- */
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function fmtInt(v) { return Math.round(v).toLocaleString('en-US'); }
  var PROJECTS = [
    {
      id: 'lab', tab: 'Medical Diagnostics and Laboratory Performance Dashboard', tabSub: 'Power BI dashboard',
      meta: 'Power BI project', title: 'Medical Diagnostics and Laboratory Performance Dashboard',
      sum: 'An interactive Power BI dashboard for reading diagnostic and laboratory performance: revenue, test trends, sample status and how each centre is doing.',
      tools: ['Power BI', 'DAX', 'Power Query', 'Data relationships', 'Slicers'],
      bullets: ['Developed an interactive Power BI dashboard to analyse diagnostic and laboratory performance.', 'Created KPIs for Total Tests, Diagnostic Revenue, Average TAT and Report Accuracy using DAX.', 'Used Power Query, data relationships, slicers and interactive navigation to analyse revenue, test trends, sample status and centre performance.'],
      slicerLabel: 'Centre', slicers: ['Centre A', 'Centre B', 'Centre C'], seed: 11,
      metrics: [
        { k: 'Total tests', agg: 'sum', base: 2600, fmt: fmtInt, mult: [1, .8, 1.25] },
        { k: 'Diagnostic revenue', agg: 'sum', base: 1900000, fmt: function (v) { return '\u20B9' + (v / 100000).toFixed(1) + 'L'; }, mult: [1, .85, 1.2] },
        { k: 'Average TAT', agg: 'avg', base: 7.5, amp: .12, fmt: function (v) { return v.toFixed(1) + ' h'; }, mult: [1, 1.08, .94], zoom: true },
        { k: 'Report accuracy', agg: 'avg', base: 97.4, amp: .01, fmt: function (v) { return v.toFixed(1) + '%'; }, mult: [1, .997, 1.002], zoom: true }
      ]
    },
    {
      id: 'acm', tab: 'Australian Community Media', tabSub: 'Subscription and delivery dashboards, 2022 to 2025',
      meta: '2022 to 2025', title: 'Australian Community Media: subscription and delivery dashboards',
      sum: 'Power BI dashboards that let the business watch customer subscriptions and delivery performance, with weekly and monthly reports behind them.',
      tools: ['SQL', 'Excel', 'Power BI'],
      bullets: ['Analysed subscription and fulfilment data using SQL and Excel.', 'Created Power BI dashboards to monitor customer subscriptions and delivery performance.', 'Generated weekly and monthly reports for business insights.', 'Performed data cleaning and validation to ensure accurate reporting.'],
      slicerLabel: 'Edition', slicers: ['Print', 'Digital'], seed: 23,
      metrics: [
        { k: 'Subscriptions', agg: 'sum', base: 4200, fmt: fmtInt, mult: [1, .9] },
        { k: 'Deliveries fulfilled', agg: 'sum', base: 3900, fmt: fmtInt, mult: [1, .95] },
        { k: 'On-time delivery', agg: 'avg', base: 94.5, amp: .015, fmt: function (v) { return v.toFixed(1) + '%'; }, mult: [.99, 1.005], zoom: true }
      ]
    },
    {
      id: 'scenic', tab: 'Scenic', tabSub: 'Cruise booking analysis, 2023 to 2024',
      meta: '2023 to 2024', title: 'Scenic: cruise booking analysis',
      sum: 'Excel and Power BI reports that show how bookings and revenue move through the year, and what customers prefer.',
      tools: ['Excel', 'Power BI'],
      bullets: ['Analysed cruise booking and customer data to identify travel trends.', 'Created Excel and Power BI reports to track booking performance and revenue.', 'Performed data cleaning and analysis to improve reporting accuracy.', 'Generated insights on customer preferences and seasonal booking patterns.'],
      slicerLabel: 'Cruise type', slicers: ['River', 'Ocean'], seed: 37, season: true,
      metrics: [
        { k: 'Bookings', agg: 'sum', base: 640, fmt: fmtInt, mult: [1, .8] },
        { k: 'Revenue', agg: 'sum', base: 2100000, fmt: function (v) { return (v / 1000000).toFixed(2) + 'M'; }, mult: [1, 1.3] },
        { k: 'Average booking value', agg: 'avg', base: 3300, amp: .05, fmt: function (v) { return fmtInt(v); }, mult: [1, 1.5], zoom: true }
      ]
    }
  ];
  /* build deterministic sample data: data[slicerIndex][metricIndex][month]; slicerIndex = slicers.length is "All" */
  PROJECTS.forEach(function (pr) {
    var r = rng(pr.seed), n = pr.slicers.length;
    pr.data = [];
    for (var si = 0; si < n; si++) {
      pr.data[si] = pr.metrics.map(function (m, mi) {
        var phase = r() * 3, amp = m.amp || .14;
        return MONTHS.map(function (_, mo) {
          var wave = 1 + amp * Math.sin(mo * .62 + phase) + (m.agg === 'sum' ? .018 * mo : 0) + (r() - .5) * amp * .8;
          if (pr.season) wave += .3 * Math.cos((mo - 5) * Math.PI / 6);
          return m.base * (m.mult[si] || 1) * wave;
        });
      });
    }
    pr.data[n] = pr.metrics.map(function (m, mi) {
      return MONTHS.map(function (_, mo) {
        var vals = pr.data.slice(0, n).map(function (d) { return d[mi][mo]; });
        var sum = vals.reduce(function (a, b) { return a + b; }, 0);
        return m.agg === 'sum' ? sum : sum / n;
      });
    });
  });

  var px = { p: 0, s: PROJECTS[0].slicers.length, m: 0 };
  var elTabs = $('#pxTabs');
  if (elTabs) {
    var elPanel = $('#pxPanel'), elK = $('#pxKpis'), elC = $('#pxChart'), elCap = $('#pxCap'), elS = $('#pxSlicers');
    function tween(el, to, fmt) {
      var from = parseFloat(el.getAttribute('data-v')) || 0;
      el.setAttribute('data-v', to);
      if (reduce) { el.textContent = fmt(to); return; }
      var t0 = null;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var k = Math.min(1, (ts - t0) / 450), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(from + (to - from) * e);
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    function series() { var pr = PROJECTS[px.p]; return pr.data[px.s][px.m]; }
    function updateKpis(flash) {
      var pr = PROJECTS[px.p];
      $$('.kpi', elK).forEach(function (b, i) {
        var m = pr.metrics[i], arr = pr.data[px.s][i];
        var tot = arr.reduce(function (a, c) { return a + c; }, 0);
        var v = m.agg === 'sum' ? tot : tot / arr.length;
        tween($('strong', b), v, m.fmt);
        b.setAttribute('aria-pressed', String(i === px.m));
        if (flash) { b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); }
      });
    }
    function caption(hi) {
      var pr = PROJECTS[px.p], m = pr.metrics[px.m], arr = series();
      var who = px.s === pr.slicers.length ? 'all ' + pr.slicerLabel.toLowerCase() + 's' : pr.slicers[px.s];
      if (hi !== undefined && hi >= 0) elCap.innerHTML = '<b>' + MONTHS[hi] + '</b>: ' + m.k + ' ' + m.fmt(arr[hi]) + ', ' + who;
      else elCap.innerHTML = '<b>' + m.k + '</b> by month, ' + who + (m.zoom ? ' (axis zoomed to show the change)' : '') + '. Hover or tap a bar.';
    }
    function drawBars() {
      var pr = PROJECTS[px.p], m = pr.metrics[px.m], arr = series();
      var mx = Math.max.apply(null, arr), mn = Math.min.apply(null, arr);
      var lo = m.zoom ? mn - (mx - mn) * .9 : 0, span = (mx - lo) || 1;
      $$('.col', elC).forEach(function (c, i) {
        $('.bar', c).style.height = Math.max(4, ((arr[i] - lo) / span) * 100) + '%';
        c.setAttribute('aria-label', MONTHS[i] + ': ' + m.fmt(arr[i]));
      });
      caption();
    }
    function buildSlicers() {
      var pr = PROJECTS[px.p];
      elS.innerHTML = '<span class="lab">' + pr.slicerLabel + '</span>';
      ['All'].concat(pr.slicers).forEach(function (name) {
        var idx = name === 'All' ? pr.slicers.length : pr.slicers.indexOf(name);
        var b = document.createElement('button'); b.type = 'button'; b.textContent = name;
        b.setAttribute('aria-pressed', String(idx === px.s));
        b.addEventListener('click', function () {
          px.s = idx;
          $$('button', elS).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          updateKpis(false); drawBars();
        });
        elS.appendChild(b);
      });
    }
    function buildKpis() {
      var pr = PROJECTS[px.p]; elK.innerHTML = '';
      pr.metrics.forEach(function (m, i) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'kpi';
        b.innerHTML = '<small>' + m.k + '</small><strong data-v="0">0</strong>';
        b.addEventListener('click', function () { px.m = i; updateKpis(true); drawBars(); });
        elK.appendChild(b);
      });
    }
    function buildChart() {
      elC.innerHTML = '';
      MONTHS.forEach(function (mo, i) {
        var c = document.createElement('button'); c.type = 'button'; c.className = 'col';
        c.innerHTML = '<span class="wrap-b"><span class="bar" style="display:block"></span></span><span class="m">' + mo.charAt(0) + '</span>';
        var on = function () { $$('.col', elC).forEach(function (x) { x.classList.toggle('on', x === c); }); caption(i); };
        var off = function () { c.classList.remove('on'); caption(); };
        c.addEventListener('pointerenter', on); c.addEventListener('focus', on);
        c.addEventListener('pointerleave', off); c.addEventListener('blur', off);
        c.addEventListener('click', on);
        elC.appendChild(c);
      });
    }
    function showProject(i, anim) {
      var pr = PROJECTS[i]; px.p = i; px.s = pr.slicers.length; px.m = 0;
      $$('.px-tab', elTabs).forEach(function (t, j) { t.setAttribute('aria-selected', String(j === i)); t.tabIndex = j === i ? 0 : -1; });
      $('#pxMeta').textContent = pr.meta; $('#pxTitle').textContent = pr.title; $('#pxSum').textContent = pr.sum;
      $('#pxTools').innerHTML = pr.tools.map(function (t) { return '<li>' + t + '</li>'; }).join('');
      $('#pxBullets').innerHTML = pr.bullets.map(function (t) { return '<li>' + t + '</li>'; }).join('');
      elPanel.setAttribute('aria-labelledby', 'pxtab-' + pr.id);
      buildSlicers(); buildKpis(); buildChart(); updateKpis(false);
      requestAnimationFrame(function () { requestAnimationFrame(drawBars); });
      if (anim) { elPanel.classList.remove('swap'); void elPanel.offsetWidth; elPanel.classList.add('swap'); }
    }
    PROJECTS.forEach(function (pr, i) {
      var t = document.createElement('button'); t.type = 'button'; t.className = 'px-tab'; t.id = 'pxtab-' + pr.id;
      t.setAttribute('role', 'tab'); t.setAttribute('aria-controls', 'pxPanel');
      t.innerHTML = '<b>' + pr.tab + '</b><span>' + pr.tabSub + '</span>';
      t.addEventListener('click', function () { showProject(i, true); });
      t.addEventListener('keydown', function (e) {
        var n = null, k = PROJECTS.length;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (px.p + 1) % k;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (px.p + k - 1) % k;
        if (n !== null) { e.preventDefault(); showProject(n, true); $$('.px-tab', elTabs)[n].focus(); }
      });
      elTabs.appendChild(t);
    });
    showProject(0, false);
  }

  /* ---------- skills filter ---------- */
  var chips = $$('#chips li');
  $$('.f').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-f');
      $$('.f').forEach(function (b) { var on = b === btn; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      var n = 0;
      chips.forEach(function (c) {
        var show = f === 'all' || c.getAttribute('data-c') === f;
        c.hidden = !show;
        c.classList.remove('pop');
        if (show) { void c.offsetWidth; c.style.setProperty('--i', n++); c.classList.add('pop'); }
      });
    });
  });

  /* ---------- experience accordion ---------- */
  $$('.job-head').forEach(function (h) {
    h.addEventListener('click', function () {
      var job = h.parentElement;
      var open = !job.classList.contains('open');
      job.classList.toggle('open', open);
      h.setAttribute('aria-expanded', String(open));
    });
  });
})();
