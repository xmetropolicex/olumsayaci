/**
 * OBS Ölüm Sayacı - Overlay Görsel & Animasyon Yöneticisi
 */

document.addEventListener('DOMContentLoaded', () => {
    const cardWrapper = document.getElementById('cardWrapper');
    const deathCard = document.getElementById('deathCard');
    const avatarImg = document.getElementById('avatarImg');
    const gameTitleEl = document.getElementById('gameTitle');
    const charNameEl = document.getElementById('charName');
    const counterLabelEl = document.getElementById('counterLabel');
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
        gameTitleEl.textContent = state.gameTitle || 'OYUN ADI';
        charNameEl.textContent = state.characterName || '';
        counterLabelEl.textContent = state.counterLabel || 'ÖLÜM';

        // 2. Avatar / Kapak Resmi
        if (state.avatarUrl && avatarImg.src !== state.avatarUrl) {
            avatarImg.src = state.avatarUrl;
        }

        // 3. Tema Sınıfları
        const themes = ['theme-souls', 'theme-cyberpunk', 'theme-glass', 'theme-retro', 'theme-esports', 'theme-gold'];
        themes.forEach(t => cardWrapper.classList.remove(t));
        cardWrapper.classList.add(`theme-${state.theme || 'souls'}`);

        // 4. Düzen Sınıfları (Layout)
        const layouts = ['layout-horizontal', 'layout-vertical', 'layout-compact', 'layout-boss'];
        layouts.forEach(l => cardWrapper.classList.remove(l));
        cardWrapper.classList.add(`layout-${state.layout || 'horizontal'}`);

        // 5. Özel Renkler
        if (state.accentColor) {
            document.documentElement.style.setProperty('--accent', state.accentColor);
        }
        if (state.glowColor) {
            document.documentElement.style.setProperty('--accent-glow', state.glowColor);
        }

        // 6. Ölçekleme (Scale)
        const scaleVal = (state.scale || 100) / 100;
        document.documentElement.style.setProperty('--scale-factor', scaleVal);

        // 7. Sayaç Değeri (Animasyonsuz doğrudan güncelleme kontrolü)
        const newDeaths = parseInt(state.deaths, 10) || 0;
        if (newDeaths !== currentDeaths) {
            animateNumber(currentDeaths, newDeaths);
            currentDeaths = newDeaths;
        }
    }

    function animateNumber(from, to) {
        counterValueEl.textContent = to;
    }

    function triggerDeathEffects(delta, state) {
        const deltaNum = parseInt(delta, 10) || 1;

        // 1. Sayaç Titremesi ve Büyüme (Pop Animasyonu)
        counterValueEl.classList.remove('pop-anim');
        void counterValueEl.offsetWidth; // Reflow
        counterValueEl.classList.add('pop-anim');

        // 2. Kart Sarsıntı Efekti (Shake)
        if (state.shakeEffect) {
            deathCard.classList.remove('shake-anim');
            void deathCard.offsetWidth; // Reflow
            deathCard.classList.add('shake-anim');
        }

        // 3. Yüzen Parçacık (+1 / Delta)
        if (state.particlesEnabled !== false && deltaNum > 0) {
            spawnFloatingDelta(deltaNum);
        }

        // 4. Kırmızı Ekran Parıltısı
        if (flashOverlay) {
            flashOverlay.classList.remove('death-flash-active');
            void flashOverlay.offsetWidth;
            flashOverlay.classList.add('death-flash-active');
    }

    function spawnFloatingDelta(delta) {
        const particle = document.createElement('div');
        particle.className = 'floating-delta';
        particle.textContent = `+${delta}`;
        counterSection.appendChild(particle);

        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 1100);
    }

    // İlk yüklemede mevcut durumu render et
    renderState(sync.state);
});
