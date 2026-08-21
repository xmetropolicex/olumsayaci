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

        // 3. Yüzen Parçacık (+1 / -1)
        if (!state || state.particlesEnabled !== false) {
            spawnFloatingDelta(deltaNum, deltaNum < 0 ? 'decrease' : 'increase');
        }

        // 4. Kuru Kafa / Yeşil Artı Şifa Efekti
        if (!state || state.flashEffect !== false) {
            if (deltaNum < 0) {
                spawnHealBurst();
            } else {
                spawnSkullBurst();
            }
        }
    }

    function spawnFloatingDelta(delta, type = 'increase') {
        if (!counterSection) return;
        const particle = document.createElement('div');
        particle.className = `floating-delta ${type}`;
        particle.textContent = delta > 0 ? `+${delta}` : `${delta}`;
        counterSection.appendChild(particle);

        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 900);
    }

    function spawnHealBurst() {
        if (!counterSection) return;
        const container = document.createElement('div');
        container.className = 'heal-burst-container';
        container.innerHTML = `
          <svg class="heal-burst-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="28" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" stroke-width="3"/>
            <path d="M38 18H26V26H18V38H26V46H38V38H46V26H38V18Z" fill="#34D399" stroke="#10B981" stroke-width="2"/>
          </svg>
          <div class="heal-ring"></div>
        `;
        counterSection.appendChild(container);

        setTimeout(() => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }, 1700);
    }

    function spawnSkullBurst() {
        if (!counterSection) return;
        const container = document.createElement('div');
        container.className = 'skull-burst-container';
        container.innerHTML = `
          <svg class="skull-burst-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Kafatası Ana Gövdesi -->
            <path d="M32 4C17.64 4 6 15.64 6 30C6 38.2 9.8 45.5 15.8 50.2V56C15.8 58.2 17.6 60 19.8 60H44.2C46.4 60 48.2 58.2 48.2 56V50.2C54.2 45.5 58 38.2 58 30C58 15.64 46.36 4 32 4Z" fill="#F8FAFC"/>
            <!-- Kafatası Çatlak Detayı -->
            <path d="M30 6L33 14L28 20L31 24" stroke="#334155" stroke-width="1.8" stroke-linecap="round"/>
            <!-- Derin Karanlık Göz Çukurları -->
            <ellipse cx="21" cy="31" rx="7.5" ry="9" fill="#090A0F"/>
            <ellipse cx="43" cy="31" rx="7.5" ry="9" fill="#090A0F"/>
            <!-- Burun Boşluğu -->
            <path d="M32 36L28.5 45H35.5L32 36Z" fill="#090A0F"/>
            <!-- Elmacık Kemiği Çizgileri -->
            <path d="M13 41C13 41 16 43 18 41" stroke="#64748B" stroke-width="2" stroke-linecap="round"/>
            <path d="M51 41C51 41 48 43 46 41" stroke="#64748B" stroke-width="2" stroke-linecap="round"/>
            <!-- Çene ve Dişler -->
            <rect x="20" y="51" width="4" height="7" rx="1.5" fill="#090A0F"/>
            <rect x="26" y="50" width="4" height="8" rx="1.5" fill="#090A0F"/>
            <rect x="34" y="50" width="4" height="8" rx="1.5" fill="#090A0F"/>
            <rect x="40" y="51" width="4" height="7" rx="1.5" fill="#090A0F"/>
            <line x1="18" y1="54" x2="46" y2="54" stroke="#090A0F" stroke-width="1.5"/>
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
        }, 1700);
    }

    // İlk yüklemede mevcut durumu render et
    renderState(sync.state);
});
