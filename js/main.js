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

  // Botão flutuante só aparece depois que o hero sai da tela
  // (o hero já tem o CTA principal; evita cobrir os selos no mobile)
  var waFloat = document.querySelector('.wa-float');
  var hero = document.querySelector('.hero, .page-hero');
  if (waFloat && hero && 'IntersectionObserver' in window) {
    waFloat.classList.add('wa-hidden');
    new IntersectionObserver(function (entries) {
      waFloat.classList.toggle('wa-hidden', entries[0].isIntersecting);
    }, { threshold: 0.2 }).observe(hero);
  }

  // Vídeo explicativo: conta o primeiro play de cada vídeo no GA4
  var videos = document.querySelectorAll('video[data-video]');
  for (var i = 0; i < videos.length; i++) {
    videos[i].addEventListener('play', function () {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'video_play', {
          event_label: this.getAttribute('data-video'),
          page_path: window.location.pathname
        });
      }
    }, { once: true });
  }

  // Black Friday: depois de 06/12/2026 some o selo e a faixa, e o título volta pra "na promoção"
  if (new Date() >= new Date('2026-12-07T00:00:00-03:00')) {
    var bfSome = document.querySelectorAll('[data-bf]');
    for (var b = 0; b < bfSome.length; b++) bfSome[b].hidden = true;
    var bfVolta = document.querySelectorAll('[data-bf-depois]');
    for (var d = 0; d < bfVolta.length; d++) bfVolta[d].hidden = false;
  }

  // Ano do rodapé
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
