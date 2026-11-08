(function () {
  if (window.__asuEnhancementsLoaded) return;
  window.__asuEnhancementsLoaded = true;

  const socialUrls = {
    Instagram: 'https://www.instagram.com/asumare_barracevichera/',
    Facebook: 'https://www.facebook.com/p/Asu-Mare-Barra-Cevichera-100071870685137/',
    TikTok: 'https://www.tiktok.com/@asumare_barracevichera'
  };

  function prepareHome() {
    const hero = document.querySelector('#inicio');
    const deliveryRow = hero?.querySelector('.home-delivery-row');
    if (!hero || !deliveryRow) return false;

    window.setTimeout(function () {
      const video = document.querySelector('#inicio video');
      if (!video || !video.isConnected || video.hasAttribute('data-home-autoplay-attempted')) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        video.autoplay = false;
        video.removeAttribute('autoplay');
        video.pause();
        return;
      }
      video.setAttribute('data-home-autoplay-attempted', 'true');
      video.autoplay = true;
      video.muted = true;
      video.setAttribute('autoplay', '');
      video.setAttribute('muted', '');
      const playback = video.play();
      if (playback && typeof playback.catch === 'function') {
        playback.catch(function (error) {
          if (video.isConnected) {
            console.warn('[ASU MARE] No se pudo iniciar el video del hero:', error);
          }
        });
      }
    }, 900);

    deliveryRow.setAttribute('aria-label', 'Plataformas de pedidos a domicilio');
    const fudo = Array.from(deliveryRow.children).find(function (item) {
      return /\bFudo\b/i.test(item.textContent || '');
    });
    if (fudo && !hero.querySelector('.home-management-note')) {
      fudo.querySelectorAll('i, [class*="ph-"]').forEach(function (icon) {
        icon.remove();
      });
      const note = document.createElement('div');
      note.className = 'home-management-note';
      note.setAttribute('aria-label', 'Sistema de gestión del restaurante');
      const label = document.createElement('span');
      label.textContent = 'Gestión del restaurante';
      const name = document.createElement('strong');
      name.textContent = 'Fudo';
      note.append(label, name);
      fudo.remove();
      deliveryRow.insertAdjacentElement('afterend', note);
    }

    Array.from(deliveryRow.children).forEach(function (item) {
      if (/PedidosYa|Rappi/i.test(item.textContent || '')) {
        item.classList.add('home-order-platform');
        item.querySelectorAll('i, [class*="ph-"]').forEach(function (icon) {
          icon.remove();
        });
      }
    });
    return true;
  }

  function prepareMenu() {
    const grid = document.querySelector('#menu .menu-dish-grid');
    if (!grid || grid.querySelectorAll('.scp4').length === 0) return false;
    if (document.querySelector('#menu .menu-category-nav')) return true;

    const cards = Array.from(grid.querySelectorAll('.scp4'));
    const categories = [
      { label: 'Ceviches', match: /ceviche/i },
      { label: 'Tiraditos', match: /tiradito/i },
      { label: 'Entradas', match: /causa/i },
      { label: 'Platos principales', match: /lomo saltado/i },
      { label: 'Arroces y mariscos', match: /arroz con mariscos/i }
    ];
    const nav = document.createElement('nav');
    nav.className = 'menu-category-nav';
    nav.setAttribute('aria-label', 'Categorías de la carta');

    categories.forEach(function (category) {
      const card = cards.find(function (item) {
        return category.match.test(item.querySelector('h3')?.textContent || '');
      });
      if (!card) return;

      const title = card.querySelector('h3').textContent.trim();
      const id = 'plato-' + title.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      card.id = id;
      const link = document.createElement('a');
      link.href = '#' + id;
      link.textContent = category.label;
      nav.appendChild(link);
    });

    if (!nav.children.length) return false;
    grid.before(nav);
    return true;
  }

  function applySocialLinks() {
    let updated = 0;
    Object.keys(socialUrls).forEach(function (name) {
      document.querySelectorAll('a[aria-label="' + name + '"]').forEach(function (link) {
        const href = socialUrls[name];
        if (link.getAttribute('href') !== href) link.setAttribute('href', href);
        if (link.target !== '_blank') link.target = '_blank';
        if (link.rel !== 'noopener noreferrer') link.rel = 'noopener noreferrer';
        updated += 1;
      });
    });
    return updated === Object.keys(socialUrls).length;
  }

  function prepareBranches() {
    const root = document.querySelector('#sucursales');
    const cards = Array.from(root?.querySelectorAll('.branch-card') || []);
    const frame = root?.querySelector('iframe[title="Mapa"]');
    if (!root || cards.length !== 3 || !frame) return false;
    if (root.hasAttribute('data-branch-map-enhanced')) return true;

    const locations = {
      Palermo: 'Thames 1514, Buenos Aires',
      Once: 'Av. Pueyrredón 535, Buenos Aires',
      'Paseo La Plaza': 'Av. Corrientes 1660, Buenos Aires'
    };
    const mapContainer = frame.parentElement;
    if (!mapContainer) return false;
    root.setAttribute('data-branch-map-enhanced', 'true');
    mapContainer.classList.add('branch-map-container');

    const fallback = document.createElement('div');
    fallback.className = 'branch-map-fallback';
    fallback.hidden = true;
    fallback.setAttribute('role', 'status');
    const fallbackImage = document.createElement('img');
    fallbackImage.alt = '';
    fallbackImage.setAttribute('aria-hidden', 'true');
    const fallbackCopy = document.createElement('div');
    fallbackCopy.className = 'branch-map-fallback-copy';
    const fallbackTitle = document.createElement('strong');
    const fallbackAddress = document.createElement('span');
    const fallbackLink = document.createElement('a');
    fallbackLink.textContent = 'Abrir ubicación en Google Maps';
    fallbackLink.target = '_blank';
    fallbackLink.rel = 'noopener noreferrer';
    fallbackCopy.append(fallbackTitle, fallbackAddress, fallbackLink);
    fallback.append(fallbackImage, fallbackCopy);
    mapContainer.appendChild(fallback);

    let activeLocation = '';
    let loadTimer;
    function selectedCard() {
      return cards.find(function (card) {
        return card.style.backgroundColor.includes('255, 194, 14') ||
          card.getAttribute('aria-pressed') === 'true';
      }) || cards[0];
    }

    function readBranchName(card) {
      const name = card.querySelector(
        ':scope > div:nth-child(2) > div:first-child > span:first-child'
      )?.textContent.trim();
      return Object.keys(locations).find(function (location) {
        return location === name || card.textContent.includes(location);
      });
    }

    function showFallback() {
      fallback.hidden = false;
      frame.style.display = 'none';
      frame.setAttribute('aria-hidden', 'true');
    }

    frame.addEventListener('load', function () {
      window.clearTimeout(loadTimer);
      let mapLoaded = false;
      try {
        mapLoaded = frame.contentWindow.location.href !== 'about:blank';
      } catch (error) {
        mapLoaded = true;
      }
      if (mapLoaded && frame.src.indexOf('https://maps.google.com/maps?') === 0) {
        fallback.hidden = true;
        frame.style.removeProperty('display');
        frame.removeAttribute('aria-hidden');
      } else {
        showFallback();
      }
    });
    frame.addEventListener('error', function () {
      window.clearTimeout(loadTimer);
      showFallback();
    });

    function syncLocation() {
      const card = selectedCard();
      const name = readBranchName(card);
      const address = locations[name];
      if (!name || !address) return;

      const addressNode = card.querySelector(
        ':scope > div:nth-child(2) > span:nth-child(2)'
      );
      if (addressNode && addressNode.textContent.trim() !== address) {
        addressNode.textContent = address;
      }

      const directions = card.querySelector('a.branch-directions');
      const directionsUrl = new URL('https://www.google.com/maps/dir/');
      directionsUrl.searchParams.set('api', '1');
      directionsUrl.searchParams.set('destination', address);
      if (directions) {
        directions.href = directionsUrl.href;
        directions.target = '_blank';
        directions.rel = 'noopener noreferrer';
      }

      const branchImage = card.querySelector('.branch-photo img');
      const imageSource = branchImage?.getAttribute('src');
      if (fallbackImage.getAttribute('src') !== imageSource) {
        if (imageSource) fallbackImage.setAttribute('src', imageSource);
        else fallbackImage.removeAttribute('src');
      }
      if (fallbackTitle.textContent !== name) fallbackTitle.textContent = name;
      if (fallbackAddress.textContent !== address) fallbackAddress.textContent = address;
      fallbackLink.href = directionsUrl.href;
      frame.title = 'Mapa';
      frame.setAttribute('aria-label', 'Mapa interactivo de ' + name);

      const mapUrl = new URL('https://maps.google.com/maps');
      mapUrl.searchParams.set('q', address);
      mapUrl.searchParams.set('z', '16');
      mapUrl.searchParams.set('output', 'embed');
      if (frame.src !== mapUrl.href) {
        activeLocation = name;
        window.clearTimeout(loadTimer);
        fallback.hidden = true;
        frame.style.removeProperty('display');
        frame.removeAttribute('aria-hidden');
        frame.src = mapUrl.href;
        loadTimer = window.setTimeout(showFallback, 10000);
      } else if (activeLocation !== name) {
        activeLocation = name;
      }
    }

    let syncScheduled = false;
    function scheduleSync() {
      if (syncScheduled) return;
      syncScheduled = true;
      window.requestAnimationFrame(function () {
        syncScheduled = false;
        syncLocation();
      });
    }

    root.addEventListener('click', function (event) {
      if (event.target instanceof Element && event.target.closest('.branch-card')) {
        window.setTimeout(scheduleSync, 0);
      }
    }, true);
    const branchObserver = new MutationObserver(scheduleSync);
    branchObserver.observe(root, {
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'aria-pressed']
    });
    syncLocation();
    return true;
  }

  function prepareReservations() {
    const card = document.querySelector('.reserve-form-card');
    const form = card?.querySelector('form');
    if (!card || !form) return false;
    if (form.hasAttribute('data-reservation-enhanced')) return true;

    const fields = Array.from(form.querySelectorAll('input'));
    const nameInput = fields.find(function (input) {
      return input.type !== 'hidden' && input.type !== 'date' &&
        /nombre|name/i.test(input.placeholder || input.getAttribute('aria-label') || '');
    }) || fields.find(function (input) {
      return input.type !== 'hidden' && input.type !== 'date';
    });
    const dateInput = form.querySelector('input[type="date"]') ||
      fields.find(function (input) { return input.type === 'date'; });
    const timeSelect = form.querySelector('select');
    const peopleControl = Array.from(form.querySelectorAll('button')).find(function (button) {
      return button.getAttribute('aria-label') === '+' || button.getAttribute('aria-label') === '-';
    });
    if (!nameInput || !dateInput || !timeSelect || !peopleControl) return false;
    form.setAttribute('data-reservation-enhanced', 'true');

    const english = function () {
      return Array.from(document.querySelectorAll('.international-option'))
        .slice(0, 2)
        .some(function (button) {
          return button.textContent.trim() === 'EN' &&
            button.style.backgroundColor.replace(/\s/g, '').includes('255,194,14');
        });
    };
    nameInput.required = true;
    nameInput.autocomplete = 'name';
    nameInput.name = nameInput.name || 'name';

    dateInput.required = true;
    dateInput.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString().slice(0, 10);
    dateInput.name = dateInput.name || 'date';

    timeSelect.required = true;
    timeSelect.name = timeSelect.name || 'time';

    const nameField = nameInput.closest('label') || nameInput.parentElement;
    if (nameField) {
      const labelText = Array.from(nameField.childNodes).find(function (node) {
        return node.nodeType === Node.TEXT_NODE && node.textContent.trim();
      });
      if (labelText) labelText.textContent = english() ? 'FULL NAME' : 'NOMBRE Y APELLIDO';
    }

    const phoneField = document.createElement('label');
    phoneField.className = 'reserve-phone-field';
    const phoneLabel = document.createElement('span');
    phoneLabel.className = nameField?.querySelector('span')?.className || '';
    phoneLabel.textContent = english() ? 'PHONE OR WHATSAPP' : 'TELÉFONO O WHATSAPP';
    const phoneInput = document.createElement('input');
    phoneInput.type = 'tel';
    phoneInput.name = 'phone';
    phoneInput.autocomplete = 'tel';
    phoneInput.inputMode = 'tel';
    phoneInput.required = true;
    phoneInput.placeholder = '+54 11 1234-5678';
    phoneInput.className = nameInput.className;
    if (nameInput.getAttribute('style')) phoneInput.setAttribute('style', nameInput.getAttribute('style'));
    phoneField.append(phoneLabel, phoneInput);
    (nameField || nameInput).insertAdjacentElement('afterend', phoneField);

    const status = document.createElement('div');
    status.className = 'reserve-form-error';
    status.setAttribute('role', 'alert');
    status.hidden = true;
    form.appendChild(status);

    function activeBranch() {
      const branchButton = Array.from(form.querySelectorAll('button')).find(function (button) {
        return /Palermo|Once|Paseo La Plaza/.test(button.textContent) &&
          button.style.backgroundColor.includes('255, 194, 14');
      });
      return ['Palermo', 'Once', 'Paseo La Plaza'].find(function (branch) {
        return branchButton?.textContent.includes(branch);
      }) || '';
    }

    function showError(message, input) {
      status.textContent = message;
      status.hidden = false;
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        input.focus();
      }
    }

    function clearError() {
      status.hidden = true;
      status.textContent = '';
      form.querySelectorAll('[aria-invalid="true"]').forEach(function (input) {
        input.removeAttribute('aria-invalid');
      });
    }

    form.addEventListener('input', clearError);
    form.addEventListener('change', clearError);

    function makeConfirmation() {
      const branch = activeBranch();
      const date = dateInput.value;
      const time = timeSelect.value;
      const peopleText = Array.from(form.querySelectorAll('*')).find(function (element) {
        return element.children.length === 0 && /\d+\s*(personas|people)/i.test(element.textContent);
      })?.textContent.trim() || '';
      const personCount = peopleText.match(/\d+/)?.[0] || '1';
      const dateValue = new Date(date + 'T12:00:00');
      const dateLabel = Number.isNaN(dateValue.getTime()) ? date :
        new Intl.DateTimeFormat(english() ? 'en' : 'es-AR', {
          dateStyle: 'long'
        }).format(dateValue);

      const confirmation = document.createElement('section');
      confirmation.className = 'reserve-confirmation';
      confirmation.setAttribute('role', 'status');
      confirmation.setAttribute('aria-live', 'polite');
      const icon = document.createElement('span');
      icon.className = 'reserve-confirmation-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '✓';
      const title = document.createElement('h3');
      title.textContent = english() ? 'Request received!' : '¡Recibimos tu solicitud!';
      const demoNotice = document.createElement('p');
      demoNotice.className = 'reserve-demo-notice';
      demoNotice.textContent = english()
        ? 'DEMO — This form is not connected to a booking system. Your request was not sent and no availability is confirmed.'
        : 'DEMOSTRACIÓN — Este formulario no está conectado a un sistema de reservas. La solicitud no se envió y no hay disponibilidad confirmada.';
      const summary = document.createElement('dl');
      summary.className = 'reserve-confirmation-summary';
      [
        [english() ? 'Branch' : 'Sucursal', branch],
        [english() ? 'Date' : 'Fecha', dateLabel],
        [english() ? 'Time' : 'Horario', time],
        [english() ? 'Guests' : 'Personas', personCount]
      ].forEach(function (item) {
        const row = document.createElement('div');
        const label = document.createElement('dt');
        label.textContent = item[0];
        const value = document.createElement('dd');
        value.textContent = item[1];
        row.append(label, value);
        summary.appendChild(row);
      });
      const message = document.createElement('p');
      message.textContent = english()
        ? 'To request a real reservation, contact our team on WhatsApp to check availability.'
        : 'Para solicitar una reserva real, contactanos por WhatsApp para consultar disponibilidad.';
      const contact = document.createElement('a');
      contact.href = 'https://wa.me/5491166378394';
      contact.target = '_blank';
      contact.rel = 'noopener noreferrer';
      contact.className = 'reserve-confirmation-contact';
      contact.textContent = english() ? 'Contact us on WhatsApp' : 'Consultar por WhatsApp';
      const reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'reserve-confirmation-reset';
      reset.textContent = english() ? 'Start a new demo request' : 'Nueva solicitud de demostración';
      reset.addEventListener('click', function () {
        confirmation.remove();
        form.hidden = false;
        clearError();
        nameInput.focus();
      });
      confirmation.append(icon, title, demoNotice, summary, message, contact, reset);
      form.hidden = true;
      form.insertAdjacentElement('afterend', confirmation);
      confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function validateAndShowPreview(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      clearError();
      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();
      const digits = phone.replace(/\D/g, '');
      const branch = activeBranch();
      if (name.split(/\s+/).filter(Boolean).length < 2) {
        return showError(
          english() ? 'Enter your first and last name.' : 'Ingresá tu nombre y apellido.',
          nameInput
        );
      }
      if (!dateInput.value || dateInput.validity.rangeUnderflow) {
        return showError(
          english() ? 'Choose a valid date today or later.' : 'Elegí una fecha válida a partir de hoy.',
          dateInput
        );
      }
      if (!timeSelect.value) return showError(english() ? 'Choose a time.' : 'Elegí un horario.', timeSelect);
      if (digits.length < 8) {
        return showError(
          english() ? 'Enter a phone number with at least 8 digits.' : 'Ingresá un teléfono con al menos 8 dígitos.',
          phoneInput
        );
      }
      if (!branch) {
        return showError(
          english() ? 'Choose a branch.' : 'Elegí una sucursal.',
          form.querySelector('button')
        );
      }
      makeConfirmation();
    }

    form.addEventListener('submit', validateAndShowPreview, true);
    form.addEventListener('click', function (event) {
      const button = event.target instanceof Element ? event.target.closest('button') : null;
      if (button && /Confirmar reserva|Confirm booking/i.test(button.textContent)) {
        validateAndShowPreview(event);
      }
    }, true);
    return true;
  }

  function enhancePage() {
    const initialView = window.__initialView;
    if (initialView === 'inicio' && prepareHome()) return true;
    if (initialView === 'menu' && prepareMenu()) return true;
    if (prepareBranches()) return true;
    if (prepareReservations()) return true;
    return false;
  }

  const observer = new MutationObserver(function () {
    if (enhancePage()) observer.disconnect();
  });
  observer.observe(document, { childList: true, subtree: true });
  if (enhancePage()) observer.disconnect();

  const socialObserver = new MutationObserver(function () {
    if (applySocialLinks()) socialObserver.disconnect();
  });
  socialObserver.observe(document, { childList: true, subtree: true });
  if (applySocialLinks()) socialObserver.disconnect();
})();
