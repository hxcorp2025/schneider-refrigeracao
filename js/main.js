(function () {
  'use strict';

  // Menu mobile
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Conversão: todo clique em link de WhatsApp dispara evento pro Google Ads / GA4.
  // O gtag é carregado no <head> de cada página; se não estiver configurado ainda,
  // o clique segue normal sem quebrar nada.
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href*="wa.me"]');
    if (!link) return;
    var label = link.getAttribute('data-wa') || 'generico';
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'click_whatsapp', {
        event_category: 'conversao',
        event_label: label,
        page_path: window.location.pathname
      });
    }
  });

  // Ano do rodapé
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
