/**
 * OBS Ölüm Sayacı - Overlay Görsel & Animasyon Yöneticisi
 */

document.addEventListener('DOMContentLoaded', () => {
    // Eski önbellekten kalan etiketleri kesin olarak temizle
    document.querySelectorAll('.label-pill, #counterLabel').forEach(el => el.remove());

    const cardWrapper = document.getElementById('cardWrapper');
    const deathCard = document.getElementById('deathCard');
    const avatarImg = document.getElementById('avatarImg');
    const bgWatermarkImg = document.getElementById('bgWatermarkImg');
    const gameTitleEl = document.getElementById('gameTitle');
    const charNameEl = document.getElementById('charName');
    const counterValueEl = document.getElementById('counterValue');
    const counterSection = document.getElementById('counterSection');
    const flashOverlay = document.getElementById('flashOverlay');

    let currentDeaths = 0;

    // Senkronizasyon Motorunu Başlat
    const sync = new SyncEngine({
        isHost: false,
        onStateChange: (state, source) => {
            renderState(state);
        },
        onDeathTrigger: (delta, state) => {
            triggerDeathEffects(delta, state);
        }
    });

    function renderState(state) {
        if (!state) return;

        // 1. Metin Değerleri
        if (gameTitleEl) gameTitleEl.textContent = state.gameTitle || 'OYUN ADI';
        if (charNameEl) charNameEl.textContent = state.characterName || '';

        // 2. Avatar / Kapak Resmi & Arka Plan Watermark
        if (state.avatarUrl) {
            if (avatarImg && avatarImg.src !== state.avatarUrl) {
                avatarImg.src = state.avatarUrl;
            }
            if (bgWatermarkImg && bgWatermarkImg.src !== state.avatarUrl) {
                bgWatermarkImg.src = state.avatarUrl;
            }
        }

        // 3. Tema Sınıfları
        if (cardWrapper) {
            const themes = ['theme-souls', 'theme-cyberpunk', 'theme-glass', 'theme-retro', 'theme-esports', 'theme-gold'];
            themes.forEach(t => cardWrapper.classList.remove(t));
            cardWrapper.classList.add(`theme-${state.theme || 'souls'}`);

            // 4. Düzen Sınıfları (Layout)
            const layouts = ['layout-horizontal', 'layout-vertical', 'layout-compact', 'layout-boss'];
            layouts.forEach(l => cardWrapper.classList.remove(l));
            cardWrapper.classList.add(`layout-${state.layout || 'horizontal'}`);
        }

        // 5. Özel Renkler
        if (state.accentColor) {
            document.documentElement.style.setProperty('--accent', state.accentColor);
        }

        // 6. Sayaç Değeri
        const newDeaths = parseInt(state.deaths, 10) || 0;
        if (counterValueEl) {
            counterValueEl.textContent = newDeaths;
        }
        currentDeaths = newDeaths;
    }

    function triggerDeathEffects(delta, state) {
        const deltaNum = parseInt(delta, 10) || 1;

        // 1. Sayaç Büyüme (Pop Animasyonu)
        if (counterValueEl) {
            counterValueEl.classList.remove('pop-anim');
            void counterValueEl.offsetWidth; // Reflow
            counterValueEl.classList.add('pop-anim');
        }

        // 2. Kart Sarsıntı Efekti (Shake)
        if (deathCard && (!state || state.shakeEffect !== false)) {
            deathCard.classList.remove('shake-anim');
            void deathCard.offsetWidth; // Reflow
            deathCard.classList.add('shake-anim');
        }

        // 3. Yüzen Parçacık (+1 / Delta)
        if (!state || state.particlesEnabled !== false) {
            spawnFloatingDelta(deltaNum);
        }

        // 4. Kuru Kafa Patlama & Buhar (Pof) Efekti
        if (!state || state.flashEffect !== false) {
            spawnSkullBurst();
        }

        // 5. Ekran Parlaması
        if (flashOverlay && (!state || state.flashEffect !== false)) {
            flashOverlay.classList.remove('death-flash-active');
            void flashOverlay.offsetWidth;
            flashOverlay.classList.add('death-flash-active');
        }
    }

    function spawnFloatingDelta(delta) {
        if (!counterSection) return;
        const particle = document.createElement('div');
        particle.className = 'floating-delta';
        particle.textContent = `+${delta}`;
        counterSection.appendChild(particle);

        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 900);
    }

    function spawnSkullBurst() {
        if (!counterSection) return;
        const container = document.createElement('div');
        container.className = 'skull-burst-container';
        container.innerHTML = `
          <svg class="skull-burst-icon" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 15.5 3.79 18.57 6.5 20.35V22H17.5V20.35C20.21 18.57 22 15.5 22 12C22 6.48 17.52 2 12 2ZM9 11C8.17 11 7.5 10.33 7.5 9.5C7.5 8.67 8.17 8 9 8C9.83 8 10.5 8.67 10.5 9.5C10.5 10.33 9.83 11 9 11ZM15 11C14.17 11 13.5 10.33 13.5 9.5C13.5 8.67 14.17 8 15 8C15.83 8 16.5 8.67 16.5 9.5C16.5 10.33 15.83 11 15 11ZM9.5 18H8V15.5H9.5V18ZM12.75 18H11.25V15.5H12.75V18ZM16 18H14.5V15.5H16V18Z"/>
          </svg>
          <div class="smoke-ring"></div>
          <div class="smoke-ring ring-delayed"></div>
          <div class="smoke-puff p1"></div>
          <div class="smoke-puff p2"></div>
          <div class="smoke-puff p3"></div>
          <div class="smoke-puff p4"></div>
          <div class="smoke-puff p5"></div>
          <div class="smoke-puff p6"></div>
        `;
        counterSection.appendChild(container);

        setTimeout(() => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }, 850);
    }

    // İlk yüklemede mevcut durumu render et
    renderState(sync.state);
});
