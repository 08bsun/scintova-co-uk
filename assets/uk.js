(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // nav gets a bottom border once the page scrolls
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function load(v) { if (!v.getAttribute('src')) v.src = v.dataset.src; }

  // hero: the middle ad plays muted while it's on screen
  var heroTile = document.querySelector('.stack .t2');
  if (heroTile && !reduce) {
    var hv = heroTile.querySelector('video');
    var playHero = function () { load(hv); hv.play().then(function () { heroTile.classList.add('playing'); }).catch(function () {}); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) playHero(); else hv.pause(); });
      }, { threshold: 0.25 }).observe(heroTile);
    } else playHero();
  }

  // ad tiles: muted preview on hover with a mouse; tap or click opens the player
  var ads = Array.prototype.slice.call(document.querySelectorAll('.ad'));
  function start(ad) {
    var v = ad.querySelector('video');
    load(v);
    v.play().then(function () { ad.classList.add('playing'); }).catch(function () {});
  }
  function stop(ad) { var v = ad.querySelector('video'); v.pause(); ad.classList.remove('playing'); }
  if (fine && !reduce) ads.forEach(function (ad) {
    ad.addEventListener('mouseenter', function () { start(ad); });
    ad.addEventListener('mouseleave', function () { stop(ad); });
  });

  // player
  var lb = document.getElementById('lb'), lv = document.getElementById('lbVideo'), cap = document.getElementById('lbCap');
  var closeBtn = document.getElementById('lbClose');
  var lastFocus = null;
  function open(ad) {
    lastFocus = document.activeElement;
    ads.forEach(stop);
    lv.src = ad.dataset.src;
    cap.textContent = ad.dataset.title + ' · spec ad for ' + ad.dataset.brand;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lv.muted = false;
    lv.play().catch(function () {});
    closeBtn.focus();
  }
  function close() {
    lv.pause(); lv.removeAttribute('src'); lv.load();
    lb.hidden = true; document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  ads.forEach(function (ad) { ad.addEventListener('click', function () { open(ad); }); });
  closeBtn.addEventListener('click', close);
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === closeBtn ? lv : closeBtn).focus(); }
  });

  // "Watch" buttons in the formats section open that ad
  Array.prototype.forEach.call(document.querySelectorAll('[data-open]'), function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-open');
      var ad = ads.filter(function (a) { return a.dataset.src.indexOf(id) !== -1; })[0];
      if (ad) open(ad);
    });
  });

  // copy the email address
  var cb = document.getElementById('copy'), em = document.getElementById('email');
  if (cb && em) cb.addEventListener('click', function () {
    var label = function (t) { cb.textContent = t; setTimeout(function () { cb.textContent = 'Copy'; }, 1600); };
    var fallback = function () {
      var r = document.createRange(); r.selectNodeContents(em);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      label('Selected');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(em.textContent).then(function () { label('Copied'); }, fallback);
    else fallback();
  });

  // brief form: write the email in the visitor's own mail app
  var form = document.getElementById('briefForm'), err = document.getElementById('briefErr');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var name = f.name.value.trim(), brand = f.brand.value.trim(), link = f.link.value.trim();
    if (!name) { err.textContent = 'Add your name so we know who to reply to.'; f.name.focus(); return; }
    if (!link && !brand) { err.textContent = 'Add your brand or a link to the product.'; f.link.focus(); return; }
    err.textContent = '';
    var subject = (f.want.value === 'A free spec ad' ? 'Free spec ad' : f.want.value) + (brand ? ' for ' + brand : '');
    var body = [
      'Hi Scintova,', '',
      'Name: ' + name,
      'Brand: ' + (brand || '-'),
      'Product: ' + (link || '-'),
      "What I'd like: " + f.want.value,
      "What we can and can't claim: " + (f.notes.value.trim() || '-'), '',
      'Photos attached.'
    ].join('\n');
    window.location.href = 'mailto:hello@scintova.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
})();
