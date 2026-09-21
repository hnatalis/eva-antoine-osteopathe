/* ==========================================================================
   Comportements du site. Aucune dépendance.
   Rien ici n'est indispensable à la lecture : sans JavaScript, toutes les
   pages restent complètes et lisibles (l'apparition au défilement est
   neutralisée par le <noscript> de chaque page).
   ========================================================================== */
(function () {
  'use strict';
  var CFG = window.SITE_CONFIG || {};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* --- 1. En-tête : état « défilé » -------------------------------------- */
  var head = $('.site-head');
  if (head) {
    var onScroll = function () {
      head.setAttribute('data-scrolled', window.scrollY > 8 ? 'true' : 'false');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- 2. Menu mobile ---------------------------------------------------- */
  var burger = $('.burger'), drawer = $('.drawer');
  if (burger && drawer) {
    /* Retards d'entrée posés une fois : 26 ms entre chaque ligne, plafonnés pour
       que la dernière soit arrivée avant 200 ms. */
    $$('nav a, .drawer-foot > *', drawer).forEach(function (el, i) {
      el.style.setProperty('--d', Math.min(i * 26, 90) + 'ms');
    });

    var setDrawer = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      drawer.setAttribute('data-open', String(open));
      document.documentElement.style.overflow = open ? 'hidden' : '';
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    };
    burger.addEventListener('click', function () {
      setDrawer(burger.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setDrawer(false); burger.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960 && burger.getAttribute('aria-expanded') === 'true') setDrawer(false);
    });
  }

  /* --- 3. Titre du héros découpé en MOTS ---------------------------------
     Un vrai nœud texte ' ' est inséré entre les mots, hors du <span> animé :
     sans lui, textContent recolle les mots (copier-coller et lecteurs d'écran).
     Le découpage se fait par mot, jamais par lettre.                        */
  $$('[data-split]').forEach(function (el) {
    if (reduce) return;
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'word';
      s.style.setProperty('--d', (i * 65) + 'ms');
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* --- 4. Apparition au défilement ---------------------------------------
     Trois filets, dans cet ordre : mesure SYNCHRONE au chargement (déjà
     visible ⇒ révéler tout de suite), puis l'observateur, puis un délai de
     sécurité qui révèle quoi qu'il arrive. Au pire on perd l'animation,
     jamais le contenu.                                                      */
  var reveals = $$('[data-reveal]');
  var show = function (el) {
    if (el.classList.contains('is-in')) return;
    var d = el.getAttribute('data-delay');
    if (d) el.style.setProperty('--d', d + 'ms');
    el.classList.add('is-in');
  };
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(show);
  } else {
    reveals.forEach(function (el) {                       // filet 1 — synchrone
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92) show(el);
    });
    var io = new IntersectionObserver(function (entries) { // filet 2 — observateur
      entries.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { if (!el.classList.contains('is-in')) io.observe(el); });
    setTimeout(function () { reveals.forEach(show); }, 4000);  // filet 3 — délai
  }

  /* --- 5. Barre d'espèces : puce active ---------------------------------- */
  var chips = $$('.speciesbar .chip');
  if (chips.length && 'IntersectionObserver' in window) {
    var sections = chips.map(function (c) { return $(c.getAttribute('href')); }).filter(Boolean);
    var mark = function (id) {
      chips.forEach(function (c) {
        c.setAttribute('aria-current', c.getAttribute('href') === '#' + id ? 'true' : 'false');
      });
    };
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) mark(en.target.id); });
    }, { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach(function (s) { so.observe(s); });
  }

  /* --- 5b. Vidéo de décor ------------------------------------------------
     Une vidéo en lecture automatique ne peut pas être arrêtée par la CSS.
     Quand le système demande moins de mouvement, on la met en pause et on
     laisse l'affiche (`poster`) : le visuel reste, le mouvement disparaît. */
  $$('video[autoplay]').forEach(function (v) {
    if (reduce) {
      v.removeAttribute('autoplay');
      v.pause();
      v.currentTime = 0;
      return;
    }
    /* Certains navigateurs refusent la lecture automatique au chargement.
       On réessaie alors UNE fois, au premier geste de la personne. Si ça
       échoue encore, l'affiche reste : on ne perd que le mouvement. */
    var relancer = function () {
      var q = v.play();
      if (q && q.catch) q.catch(function () {});
    };
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
    /* Écoute posée SANS condition : la lecture peut aussi être suspendue plus
       tard (onglet remis au premier plan, changement de fenêtre). Rappeler
       play() sur une vidéo qui joue déjà ne coûte rien. */
    ['touchstart', 'pointerdown', 'scroll'].forEach(function (ev) {
      window.addEventListener(ev, relancer, { once: true, passive: true });
    });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) relancer();
    });
  });

  /* --- 6. Photo du héros : fondu vers le flou au défilement ---------------
     La photo nette laisse place à sa copie floue à mesure qu'on descend, et
     la suite de la page arrive nette. On ne calcule pas de `filter: blur()`
     à chaque image : on croise l'opacité de deux images, ce qui est composité
     par le GPU et tient sans effort sur un téléphone.

     La lecture de position est groupée dans un requestAnimationFrame pour ne
     pas provoquer un recalcul de mise en page à chaque événement de défilement. */
  var hero = $('.hero'), heroMedia = $('.hero-media');
  if (hero && heroMedia && !reduce) {
    var enAttente = false;
    var majHero = function () {
      enAttente = false;
      var r = heroMedia.getBoundingClientRect();
      var haut = r.height || 1;
      // 0 tant que la photo est en place, 1 quand elle a défilé de 70 % de sa hauteur
      var p = (-r.top) / (haut * 0.7);
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      hero.style.setProperty('--hero-p', p.toFixed(3));
    };
    var planifier = function () {
      if (!enAttente) { enAttente = true; requestAnimationFrame(majHero); }
    };
    majHero();
    window.addEventListener('scroll', planifier, { passive: true });
    window.addEventListener('resize', planifier);
  }

  /* --- 7. Carte : mise au point au défilement -----------------------------
     Floue quand elle est loin, nette quand elle arrive au centre de l'écran.
     Même mécanique que le héros : on ne touche jamais au RAYON du flou, on
     croise deux exemplaires du même fichier par l'opacité. */
  var carte = $('[data-carte]');
  if (carte && !reduce) {
    var attenteCarte = false;
    var majCarte = function () {
      attenteCarte = false;
      var r = carte.getBoundingClientRect();
      var centre = r.top + r.height / 2;
      var ecart = Math.abs(centre - window.innerHeight / 2)
                / (window.innerHeight / 2 + r.height / 2);
      var p = ecart * 1.75 - 0.28;          // nette sur une plage centrale large
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      carte.style.setProperty('--map-p', p.toFixed(3));
    };
    var planifierCarte = function () {
      if (!attenteCarte) { attenteCarte = true; requestAnimationFrame(majCarte); }
    };
    majCarte();
    window.addEventListener('scroll', planifierCarte, { passive: true });
    window.addEventListener('resize', planifierCarte);
  }

  /* --- 8. CTA collant mobile --------------------------------------------- */
  var cta = $('.mobile-cta');
  if (cta) {
    var trigger = $('[data-cta-after]') || $('.hero');
    var toggle = function () {
      var y = trigger ? trigger.getBoundingClientRect().bottom : 400;
      cta.setAttribute('data-in', y < 40 ? 'true' : 'false');
    };
    toggle();
    window.addEventListener('scroll', toggle, { passive: true });
    window.addEventListener('resize', toggle);
  }

  /* --- 9. Bannière cookies -----------------------------------------------
     Elle et le CTA collant sont tous deux fixés en bas : la bannière publie
     sa hauteur RÉELLE dans --consent-h pour que le CTA se décale au-dessus.
     offsetHeight et non getBoundingClientRect : l'élément porte un translateY.
     Test obligatoire : localStorage.clear() puis rechargement.              */
  var KEY = 'ea-consent';
  var banner = $('.consent');
  var root = document.documentElement;

  function loadAnalytics() {
    var a = CFG.analytics || {};
    if (!a.provider || a.provider === 'none') return;
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:') return;
    var s = document.createElement('script');
    s.defer = true;
    if (a.provider === 'plausible') {
      s.src = 'https://plausible.io/js/script.js'; s.setAttribute('data-domain', a.domain || location.hostname);
    } else if (a.provider === 'umami') {
      s.src = a.src; s.setAttribute('data-website-id', a.id);
    } else if (a.provider === 'cloudflare') {
      s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
      s.setAttribute('data-cf-beacon', JSON.stringify({ token: a.id }));
    } else if (a.provider === 'ga4') {
      s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + a.id;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', a.id, { anonymize_ip: true });
    } else { return; }
    document.head.appendChild(s);
  }

  function setConsent(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* navigation privée */ }
    root.setAttribute('data-consent', value);
    root.style.setProperty('--consent-h', '0px');
    if (banner) banner.setAttribute('data-in', 'false');
    if (value === 'granted') loadAnalytics();
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* stockage bloqué */ }

  if (saved === 'granted') { root.setAttribute('data-consent', 'granted'); loadAnalytics(); }
  else if (saved === 'denied') { root.setAttribute('data-consent', 'denied'); }
  else if (banner) {
    root.setAttribute('data-consent', 'pending');
    var publish = function () { root.style.setProperty('--consent-h', banner.offsetHeight + 'px'); };
    setTimeout(function () { banner.setAttribute('data-in', 'true'); publish(); }, 700);
    if ('ResizeObserver' in window) new ResizeObserver(publish).observe(banner);
    else window.addEventListener('resize', publish);
    $$('[data-consent-action]', banner).forEach(function (b) {
      b.addEventListener('click', function () { setConsent(b.getAttribute('data-consent-action')); });
    });
  }

  /* --- 10. Formulaire de contact ------------------------------------------ */
  var form = $('#contact-form');
  if (form) {
    var status = $('.form-status', form);
    var submit = $('button[type=submit]', form);

    var RULES = {
      nom:     function (v) { return v.trim().length >= 2 || 'Merci d’indiquer votre nom.'; },
      email:   function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()) || 'Cette adresse e‑mail semble incomplète.'; },
      tel:     function (v) { return v.trim() === '' || v.replace(/[^\d+]/g, '').length >= 9 || 'Ce numéro semble incomplet.'; },
      animal:  function (v) { return v !== '' || 'Merci de choisir une espèce.'; },
      message: function (v) { return v.trim().length >= 10 || 'Quelques mots de plus m’aideraient à vous répondre.'; },
      rgpd:    function (v, el) { return el.checked || 'Merci de cocher cette case pour m’autoriser à vous répondre.'; }
    };

    var validate = function (el) {
      var rule = RULES[el.name];
      if (!rule) return true;
      var res = rule(el.value, el);
      var field = el.closest('.field') || el.closest('.check-wrap');
      var msg = field && $('.err', field);
      if (res === true) {
        if (field) field.setAttribute('data-invalid', 'false');
        el.removeAttribute('aria-invalid');
        return true;
      }
      if (field) field.setAttribute('data-invalid', 'true');
      if (msg) msg.textContent = res;
      el.setAttribute('aria-invalid', 'true');
      return false;
    };

    $$('input,select,textarea', form).forEach(function (el) {
      el.addEventListener('blur', function () { if (el.value !== '' || el.type === 'checkbox') validate(el); });
      el.addEventListener('input', function () {
        var f = el.closest('.field') || el.closest('.check-wrap');
        if (f && f.getAttribute('data-invalid') === 'true') validate(el);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (status) status.setAttribute('data-state', '');

      var fields = $$('input,select,textarea', form).filter(function (el) { return RULES[el.name]; });
      var bad = fields.filter(function (el) { return !validate(el); });
      if (bad.length) {
        if (status) {
          status.setAttribute('data-state', 'error');
          $('.form-status-txt', status).textContent =
            bad.length === 1 ? 'Un champ demande une correction.' : bad.length + ' champs demandent une correction.';
        }
        bad[0].focus();
        bad[0].scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
        return;
      }

      if (form.elements['_honey'] && form.elements['_honey'].value) return; // pot de miel

      /* Le site est un tas de fichiers sur GitHub Pages : aucun serveur à qui
         poster. L'envoi passe donc par le service réglé dans config.js.
         Si rien n'est réglé, on n'envoie RIEN et on donne le téléphone : un
         message avalé en silence est le pire des deux échecs possibles. */
      var CF = CFG.form || {};
      var mode = CF.mode || 'formsubmit';
      var url = CF.endpoint || '';

      var replier = function (html) {
        submit.removeAttribute('data-loading');
        submit.disabled = false;
        if (!status) return;
        status.setAttribute('data-state', 'error');
        $('.form-status-txt', status).innerHTML = html;
        status.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      };
      /* Les coordonnées sont LUES DANS LA PAGE, pas recopiées ici : elles
         viennent de `identite.json` et ne doivent jamais diverger entre
         l'affichage et ce message de secours. Le téléphone est l'objectif
         n°1 du site. Si les liens manquent, on n'invente rien. */
      var lien = function (sel) {
        var a = $(sel), val = a && $('.contact-v', a);
        return val ? '<a href="' + a.getAttribute('href') + '">' +
                     (val.textContent || '').trim().replace(/\s+/g, ' ') + '</a>' : '';
      };
      var tel = lien('.contact-row[href^="tel:"]'), mel = lien('.contact-row[href^="mailto:"]');
      var coordonnees = tel && mel ? 'Vous pouvez me joindre directement au ' + tel +
                                     ' ou par e\u2011mail à ' + mel + '.'
                      : tel ? 'Vous pouvez me joindre directement au ' + tel + '.'
                      : mel ? 'Vous pouvez m’écrire à ' + mel + '.' : '';

      if (mode === 'aucun' || !url) {
        replier('L’envoi depuis le site n’est pas encore activé. ' + coordonnees);
        return;
      }

      submit.setAttribute('data-loading', 'true');
      submit.disabled = true;

      /* FormData et non JSON : `multipart/form-data` fait partie des types que
         le navigateur envoie SANS requête préalable (préflight). Un POST en
         `application/json` en déclencherait une, et la moindre lacune CORS
         côté service ferait échouer l'envoi avant toute réponse HTTP — une
         erreur qu'aucun `if (!r.ok)` ne voit jamais passer. */
      fetch(url, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        location.href = 'merci.html';
      }).catch(function () {
        replier('L’envoi n’a pas abouti. ' + coordonnees);
      });
    });
  }

  /* --- 11. Blocs repliables ------------------------------------------------
     Le HTML arrive OUVERT : sans ce script, rien n'est caché. C'est ici qu'on
     replie, et seulement sous 760 px. Au-dessus, l'en-tête cesse d'être un
     bouton (on retire aria-expanded et le tabindex) pour ne pas annoncer une
     commande qui n'agit pas. */
  var accs = $$('.acc');
  if (accs.length) {
    var mq = window.matchMedia('(max-width: 760px)');

    var setOpen = function (acc, open) {
      acc.setAttribute('data-open', String(open));
      var head = $('.acc-head', acc);
      if (head) head.setAttribute('aria-expanded', String(open));
    };

    var apply = function () {
      var petit = mq.matches;
      accs.forEach(function (acc) {
        var head = $('.acc-head', acc);
        var body = $('.acc-body', acc);
        if (!head || !body) return;
        if (petit) {
          if (!body.id) body.id = 'acc-' + Math.random().toString(36).slice(2, 8);
          head.setAttribute('aria-controls', body.id);
          head.removeAttribute('tabindex');
          // par défaut replié, sauf les blocs marqués data-acc-open
          setOpen(acc, acc.hasAttribute('data-acc-open'));
        } else {
          head.removeAttribute('aria-expanded');
          head.removeAttribute('aria-controls');
          head.setAttribute('tabindex', '-1');
          acc.setAttribute('data-open', 'true');
        }
      });
    };

    accs.forEach(function (acc) {
      var head = $('.acc-head', acc);
      if (!head) return;
      head.addEventListener('click', function () {
        if (!mq.matches) return;                     // inerte sur grand écran
        setOpen(acc, acc.getAttribute('data-open') !== 'true');
      });
    });

    /* Le premier repli se fait SANS animation. Sinon la page met 450 ms à
       raccourcir pendant qu'on essaie déjà de cadrer l'ancre : mesuré, la
       section visée finissait 1408 px au-dessus du haut de l'écran. Personne
       ne voit cette première image de toute façon. */
    document.documentElement.classList.add('acc-sans-anim');
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else if (mq.addListener) mq.addListener(apply);

    /* Un lien interne vers un bloc replié doit l'OUVRIR et amener la personne
       au bon endroit. Deux pièges :
       - l'ancre est la <section>, l'accordéon est DEDANS. Une version
         précédente remontait les ancêtres et ne trouvait donc jamais rien :
         le lien ouvrait la page sans ouvrir l'espèce demandée ;
       - le navigateur saute à l'ancre AVANT que le script ne replie les autres
         blocs. La page raccourcit ensuite au-dessus de la cible, et le cadrage
         devient faux. Il faut refaire le calcul une fois la mise en page
         stabilisée, en tenant compte de l'en-tête ET de la barre d'espèces,
         tous deux collants. */
    var ouvrirCible = function (doux) {
      var id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      var cible = document.getElementById(id);
      if (!cible) return;
      var acc = cible.classList.contains('acc') ? cible : cible.querySelector('.acc');
      if (!acc) {
        var n = cible.parentElement;
        while (n && !(n.classList && n.classList.contains('acc'))) n = n.parentElement;
        acc = n;
      }
      if (acc) setOpen(acc, true);
      var comportement = (doux && !reduce) ? 'smooth' : 'auto';

      // Lire une hauteur force le recalcul de la mise en page : à ce point,
      // les replis sont déjà appliqués, la position de la cible est définitive.
      void document.body.offsetHeight;
      cible.scrollIntoView({ block: 'start', behavior: comportement });

      /* Filet : si quelque chose bouge encore après coup (image qui finit de
         charger, transition d'un autre bloc), on recadre une fois. Le contrôle
         évite de contrarier un défilement volontaire de la personne.
         setTimeout et non requestAnimationFrame : rAF ne se déclenche pas dans
         un onglet ouvert en arrière-plan. */
      setTimeout(function () {
        var ecart = cible.getBoundingClientRect().top - decalageAncre();
        if (Math.abs(ecart) > 24) cible.scrollIntoView({ block: 'start', behavior: 'auto' });
      }, 620);
    };

    /* Décalage d'ancre : hauteur réelle des barres collantes, publiée dans une
       variable CSS. `scroll-margin-top` s'applique AUSSI au saut d'ancre natif
       du navigateur, pas seulement à scrollIntoView : une seule valeur suffit
       donc pour les deux chemins. */
    var decalageAncre = function () {
      var d = 14;
      var h = $('.site-head'); if (h) d += h.offsetHeight;
      var b = $('.speciesbar'); if (b) d += b.offsetHeight;
      return d;
    };
    var majDecalage = function () {
      document.documentElement.style.setProperty('--anchor-offset', decalageAncre() + 'px');
    };
    majDecalage();
    window.addEventListener('resize', majDecalage);
    window.addEventListener('hashchange', function () { ouvrirCible(true); });
    if (location.hash) ouvrirCible(false);
    // les transitions reprennent une fois la première mise en page posée
    setTimeout(function () {
      document.documentElement.classList.remove('acc-sans-anim');
    }, 90);
  }

  /* --- 12. Volet de transition entre les pages ---------------------------
     Ferme avant de quitter la page, ouvre à l'arrivée. Sans JavaScript, rien
     ne se passe et les liens fonctionnent normalement : le volet reste replié
     tant que <html> ne porte pas data-volet.

     Trois garde-fous, parce qu'un volet resté fermé, c'est un site mort :
       - un délai de sécurité rouvre si la navigation n'a pas eu lieu ;
       - `pageshow` rouvre au retour arrière (page restaurée depuis le cache
         du navigateur, où aucun `load` ne se déclenche) ;
       - tout ce qui n'est pas une navigation interne simple est laissé au
         navigateur : ancres, tel:, mailto:, cible _blank, téléchargement,
         clic milieu ou avec une touche de modification. */
  var volet = $('.volet');
  if (volet && !reduce) {
    var racine = document.documentElement;

    var ouvrir = function () {
      racine.setAttribute('data-volet', 'couvre');
      // deux images d'attente : sans quoi le navigateur regroupe les deux
      // états et l'ouverture ne s'anime pas
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { racine.setAttribute('data-volet', 'ouvre'); });
      });
      // filet : rAF ne se déclenche pas dans un onglet d'arrière-plan
      setTimeout(function () {
        if (racine.getAttribute('data-volet') === 'couvre') racine.setAttribute('data-volet', 'ouvre');
      }, 300);
    };
    var marque = null;
    try { marque = sessionStorage.getItem('ea-volet'); } catch (e) {}
    if (marque === '1') {
      try { sessionStorage.removeItem('ea-volet'); } catch (e) {}
      ouvrir();
    }

    var interne = function (a) {
      if (!a || !a.getAttribute) return false;
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#') return false;
      if (/^(tel:|mailto:|javascript:)/i.test(href)) return false;
      if (a.target && a.target !== '_self') return false;
      if (a.hasAttribute('download')) return false;
      var u;
      try { u = new URL(a.href, location.href); } catch (e) { return false; }
      if (u.origin !== location.origin) return false;
      // même page, simple changement d'ancre : pas de volet
      if (u.pathname === location.pathname && u.hash) return false;
      return true;
    };

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!interne(a)) return;
      e.preventDefault();
      racine.setAttribute('data-volet', 'ferme');
      try { sessionStorage.setItem('ea-volet', '1'); } catch (err) {}
      var parti = false;
      var aller = function () { if (!parti) { parti = true; location.href = a.href; } };
      setTimeout(aller, 380);
      // si quoi que ce soit bloque, on rouvre plutôt que de laisser un écran plein
      setTimeout(function () {
        if (document.hidden || racine.getAttribute('data-volet') !== 'ferme') return;
        try { sessionStorage.removeItem('ea-volet'); } catch (err2) {}
        ouvrir();
      }, 2500);
    });

    // Retour arrière : la page revient du cache, aucun `load` ne se déclenche.
    window.addEventListener('pageshow', function (ev) {
      if (ev.persisted) racine.removeAttribute('data-volet');
    });
  }

  /* --- 13. Année du pied de page ----------------------------------------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
