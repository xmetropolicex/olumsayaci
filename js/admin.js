/**
 * OBS Ölüm Sayacı - Admin Panel Kontrolcüsü
 */

document.addEventListener('DOMContentLoaded', () => {
    // Eski önbellekten kalan etiketleri kesin olarak temizle
    document.querySelectorAll('.label-pill, #previewCounterLabel, #counterLabel').forEach(el => el.remove());

    // URL'den veya Hafızadaki Son Oda Kodu
    const urlParams = new URLSearchParams(window.location.search);
    const initialRoom = urlParams.get('room') || localStorage.getItem('stream_dc_last_active_room') || 'yayin-oda-1';

    // DOM Elementleri
    const roomInput = document.getElementById('roomInput');
    const btnNewRoom = document.getElementById('btnNewRoom');
    const btnCopyObs = document.getElementById('btnCopyObs');
    const btnOpenOverlay = document.getElementById('btnOpenOverlay');
    const btnQrCode = document.getElementById('btnQrCode');
    const statusPill = document.getElementById('statusPill');
    const statusText = document.getElementById('statusText');

    // Hero Sayaç
    const heroDeathCount = document.getElementById('heroDeathCount');
    const btnHeroAdd = document.getElementById('btnHeroAdd');
    const btnAdd5 = document.getElementById('btnAdd5');
    const btnSub1 = document.getElementById('btnSub1');
    const btnReset = document.getElementById('btnReset');
    const btnManualSet = document.getElementById('btnManualSet');

    // Oyun & Görsel Formları
    const gameTitleInput = document.getElementById('gameTitleInput');
    const charNameInput = document.getElementById('charNameInput');
    const fileUploadInput = document.getElementById('fileUploadInput');
    const avatarUploadArea = document.getElementById('avatarUploadArea');
    const previewThumb = document.getElementById('previewThumb');
    const imageUrlInput = document.getElementById('imageUrlInput');
    const btnApplyImageUrl = document.getElementById('btnApplyImageUrl');

    // Efektler
    const shakeToggle = document.getElementById('shakeToggle');
    const flashToggle = document.getElementById('flashToggle');
    const particlesToggle = document.getElementById('particlesToggle');

    // Canlı Önizleme Kartı Elementleri
    const previewWrapper = document.getElementById('previewWrapper');
    const previewCard = document.getElementById('previewCard');
    const previewBgWatermark = document.getElementById('previewBgWatermark');
    const previewAvatar = document.getElementById('previewAvatar');
    const previewGameTitle = document.getElementById('previewGameTitle');
    const previewCharName = document.getElementById('previewCharName');
    const previewCounterVal = document.getElementById('previewCounterVal');

    // Modallar
    const qrModal = document.getElementById('qrModal');
    const resetModal = document.getElementById('resetModal');
    const manualModal = document.getElementById('manualModal');
    const manualInput = document.getElementById('manualInput');
    const btnConfirmReset = document.getElementById('btnConfirmReset');
    const btnConfirmManual = document.getElementById('btnConfirmManual');
    const toast = document.getElementById('toast');

    roomInput.value = initialRoom;

    // 1. Senkronizasyon Motorunu Başlat (Host Modunda)
    const sync = new SyncEngine({
        roomId: initialRoom,
        isHost: true,
        onStateChange: (state, source) => {
            updateAdminUI(state);
            updatePreviewUI(state);
        },
        onDeathTrigger: (delta, state) => {
            triggerPreviewEffects(delta, state);
        },
        onConnectionStatus: (statusObj) => {
            if (statusObj.status === 'connected') {
                statusPill.style.background = 'rgba(16, 185, 129, 0.15)';
                statusPill.style.color = '#34d399';
                statusPill.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                statusText.textContent = 'Senkronize (Bulut & Yerel)';
            } else if (statusObj.status === 'local_only') {
                statusPill.style.background = 'rgba(245, 158, 11, 0.15)';
                statusPill.style.color = '#fbbf24';
                statusPill.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                statusText.textContent = 'Yerel Mod (Aynı PC)';
            }
        }
    });

    // 2. Admin Arayüzünü Güncelleme
    function updateAdminUI(state) {
        if (!state) return;
        heroDeathCount.textContent = state.deaths || 0;

        if (document.activeElement !== gameTitleInput) {
            gameTitleInput.value = state.gameTitle || '';
        }
        if (document.activeElement !== charNameInput) {
            charNameInput.value = state.characterName || '';
        }
        if (previewThumb && state.avatarUrl) {
            previewThumb.src = state.avatarUrl;
        }

        // Temalar
        document.querySelectorAll('.theme-card-option').forEach(el => {
            el.classList.toggle('active', el.dataset.theme === state.theme);
        });

        // Düzenler
        document.querySelectorAll('.layout-btn').forEach(el => {
            el.classList.toggle('active', el.dataset.layout === state.layout);
        });

        // Efektler
        if (shakeToggle) shakeToggle.checked = state.shakeEffect !== false;
        if (flashToggle) flashToggle.checked = state.flashEffect !== false;
        if (particlesToggle) particlesToggle.checked = state.particlesEnabled !== false;
    }

    // 3. Mini Canlı Önizleme Kartını Güncelleme
    function updatePreviewUI(state) {
        if (!state || !previewWrapper) return;

        previewGameTitle.textContent = state.gameTitle || 'OYUN ADI';
        previewCharName.textContent = state.characterName || '';
        previewCounterVal.textContent = state.deaths || 0;

        if (state.avatarUrl) {
            if (previewAvatar) previewAvatar.src = state.avatarUrl;
            if (previewBgWatermark) previewBgWatermark.src = state.avatarUrl;
        }

        // Tema
        const themes = ['theme-souls', 'theme-cyberpunk', 'theme-glass', 'theme-retro', 'theme-esports', 'theme-gold'];
        themes.forEach(t => previewWrapper.classList.remove(t));
        previewWrapper.classList.add(`theme-${state.theme || 'souls'}`);

        // Düzen
        const layouts = ['layout-horizontal', 'layout-vertical', 'layout-compact', 'layout-boss'];
        layouts.forEach(l => previewWrapper.classList.remove(l));
        previewWrapper.classList.add(`layout-${state.layout || 'horizontal'}`);
    }

    function triggerPreviewEffects(delta, state) {
        const deltaNum = parseInt(delta, 10) || 1;

        if (previewCounterVal) {
            previewCounterVal.classList.remove('pop-anim');
            void previewCounterVal.offsetWidth;
            previewCounterVal.classList.add('pop-anim');
        }

        if (previewCard && (!state || state.shakeEffect !== false)) {
            previewCard.classList.remove('shake-anim');
            void previewCard.offsetWidth;
            previewCard.classList.add('shake-anim');
        }

        const previewCounterSec = document.querySelector('.live-preview-box .counter-section');
        if (previewCounterSec) {
            // 1. Yüzen +1 Parçacığı
            if (!state || state.particlesEnabled !== false) {
                const particle = document.createElement('div');
                particle.className = 'floating-delta';
                particle.textContent = `+${deltaNum}`;
                previewCounterSec.appendChild(particle);
                setTimeout(() => {
                    if (particle.parentNode) particle.parentNode.removeChild(particle);
                }, 900);
            }

            // 2. Kuru Kafa Patlama & Buhar (Pof) Efekti
            if (!state || state.flashEffect !== false) {
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
                previewCounterSec.appendChild(container);
                setTimeout(() => {
                    if (container.parentNode) container.parentNode.removeChild(container);
                }, 2400);
            }
        }
    }

    // ================= BUTON VE KONTROL ETKİNLİKLERİ =================

    // +1 ÖLÜM Butonu
    btnHeroAdd.addEventListener('click', () => {
        // Telefonda titreşim geri bildirimi
        if (navigator.vibrate) navigator.vibrate(40);
        sync.incrementDeath(1);
        showToast('+1 Ölüm Eklendi!');
    });

    // +5 Ölüm
    btnAdd5.addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(60);
        sync.incrementDeath(5);
        showToast('+5 Ölüm Eklendi!');
    });

    // -1 Ölüm
    btnSub1.addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(30);
        sync.decrementDeath(1);
        showToast('-1 Ölüm Düşüldü');
    });

    // Sıfırla Modalı Aç
    btnReset.addEventListener('click', () => {
        openModal(resetModal);
    });

    // Sıfırlama Onayla
    btnConfirmReset.addEventListener('click', () => {
        sync.resetDeaths();
        closeModal(resetModal);
        showToast('Ölüm Sayacı Sıfırlandı!');
    });

    // Manuel Sayı Modalı Aç
    btnManualSet.addEventListener('click', () => {
        manualInput.value = sync.state.deaths || 0;
        openModal(manualModal);
        manualInput.focus();
    });

    // Manuel Sayı Onayla
    btnConfirmManual.addEventListener('click', () => {
        const val = parseInt(manualInput.value, 10);
        if (!isNaN(val) && val >= 0) {
            sync.updateState({ deaths: val });
            closeModal(manualModal);
            showToast(`Ölüm Sayısı ${val} Olarak Ayarlandı!`);
        }
    });

    // Klavye Kısayolları (Numpad + / - ve Boşluk)
    document.addEventListener('keydown', (e) => {
        // Eğer bir input alanına yazı yazılıyorsa kısayolları yutma
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

        if (e.code === 'NumpadAdd' || e.key === '+' || e.code === 'Space') {
            e.preventDefault();
            btnHeroAdd.click();
        } else if (e.code === 'NumpadSubtract' || e.key === '-') {
            e.preventDefault();
            btnSub1.click();
        }
    });

    // Form Değişikliklerini Eşitleme
    gameTitleInput.addEventListener('input', (e) => {
        sync.updateState({ gameTitle: e.target.value.toUpperCase() });
    });

    charNameInput.addEventListener('input', (e) => {
        sync.updateState({ characterName: e.target.value.toUpperCase() });
    });

    // ================= GÖRSEL YÜKLEME (PC'DEN) =================
    avatarUploadArea.addEventListener('click', () => {
        fileUploadInput.click();
    });

    fileUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Görseli Canvas ile sıkıştır (WebRTC/MQTT anında iletilsin)
                const canvas = document.createElement('canvas');
                const maxSize = 256;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL('image/webp', 0.85);
                sync.updateState({ avatarUrl: compressedDataUrl });
                previewThumb.src = compressedDataUrl;
                showToast('Görsel Başarıyla Yüklendi ve Eşitlendi!');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Görsel URL Uygula
    btnApplyImageUrl.addEventListener('click', () => {
        const url = imageUrlInput.value.trim();
        if (url) {
            sync.updateState({ avatarUrl: url });
            previewThumb.src = url;
            showToast('Görsel URL Güncellendi!');
        }
    });

    // Hazır İkonlara Tıklama
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const iconPath = btn.dataset.src;
            sync.updateState({ avatarUrl: iconPath });
            previewThumb.src = iconPath;
            showToast('Hazır İkon Seçildi!');
        });
    });

    // Hazır Oyun Butonları (Tek Tıkla Oyun Modu)
    const gamePresets = {
        'elden_ring': { title: 'ELDEN RING', char: 'TARNISHED', icon: 'assets/presets/elden_ring.svg', theme: 'souls' },
        'dark_souls': { title: 'DARK SOULS', char: 'ASHLEN ONE', icon: 'assets/presets/souls_skull.svg', theme: 'souls' },
        'sekiro': { title: 'SEKIRO', char: 'WOLF', icon: 'assets/presets/katana_samurai.svg', theme: 'souls' },
        'minecraft': { title: 'MINECRAFT', char: 'STEVE', icon: 'assets/presets/minecraft.svg', theme: 'retro' },
        'valorant': { title: 'VALORANT', char: 'RADIANT', icon: 'assets/presets/valorant.svg', theme: 'esports' },
        'cs2': { title: 'COUNTER-STRIKE 2', char: 'TERRORIST', icon: 'assets/presets/cs2.svg', theme: 'esports' },
        'cyberpunk': { title: 'CYBERPUNK 2077', char: 'V', icon: 'assets/presets/cyber_skull.svg', theme: 'cyberpunk' }
    };

    document.querySelectorAll('.game-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const key = chip.dataset.preset;
            const preset = gamePresets[key];
            if (preset) {
                sync.updateState({
                    gameTitle: preset.title,
                    characterName: preset.char,
                    avatarUrl: preset.icon,
                    theme: preset.theme
                });
                showToast(`${preset.title} Moduna Geçildi!`);
            }
        });
    });

    // ================= TEMA & DÜZEN SEÇİCİLER =================
    document.querySelectorAll('.theme-card-option').forEach(card => {
        card.addEventListener('click', () => {
            const theme = card.dataset.theme;
            sync.updateState({ theme });
            showToast(`Tema: ${card.querySelector('h4, h5').textContent}`);
        });
    });

    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const layout = btn.dataset.layout;
            sync.updateState({ layout });
            showToast(`Düzen Değiştirildi`);
        });
    });

    // ================= EFEKTLER =================
    shakeToggle.addEventListener('change', (e) => {
        sync.updateState({ shakeEffect: e.target.checked });
    });

    flashToggle.addEventListener('change', (e) => {
        sync.updateState({ flashEffect: e.target.checked });
    });

    particlesToggle.addEventListener('change', (e) => {
        sync.updateState({ particlesEnabled: e.target.checked });
    });



    // ================= ODA VE BAĞLANTI YÖNETİMİ =================
    roomInput.addEventListener('change', (e) => {
        const newRoom = e.target.value.trim().toLowerCase();
        if (newRoom) {
            sync.setRoom(newRoom);
            // URL'yi güncelle
            const newUrl = `${window.location.pathname}?room=${encodeURIComponent(newRoom)}`;
            window.history.replaceState({}, '', newUrl);
            showToast(`Oda Değiştirildi: ${newRoom}`);
        }
    });

    btnNewRoom.addEventListener('click', () => {
        const randomRoom = `yayin-${Math.floor(1000 + Math.random() * 9000)}`;
        roomInput.value = randomRoom;
        sync.setRoom(randomRoom);
        const newUrl = `${window.location.pathname}?room=${encodeURIComponent(randomRoom)}`;
        window.history.replaceState({}, '', newUrl);
        showToast(`Yeni Oda Oluşturuldu: ${randomRoom}`);
    });

    // OBS Linkini Kopyala
    btnCopyObs.addEventListener('click', () => {
        const room = roomInput.value.trim() || 'yayin-oda-1';
        const baseUrl = window.location.href.split('?')[0].replace('index.html', '').replace(/\/$/, '');
        const overlayUrl = `${baseUrl}/overlay.html?room=${encodeURIComponent(room)}`;

        navigator.clipboard.writeText(overlayUrl).then(() => {
            showToast('📋 OBS Tarayıcı Kaynağı Linki Kopyalandı!');
        }).catch(() => {
            prompt('OBS Linkinizi kopyalayın:', overlayUrl);
        });
    });

    // Overlay'i Yeni Sekmede Aç
    btnOpenOverlay.addEventListener('click', () => {
        const room = roomInput.value.trim() || 'yayin-oda-1';
        window.open(`overlay.html?room=${encodeURIComponent(room)}`, '_blank');
    });

    // QR Kod Modalı
    btnQrCode.addEventListener('click', () => {
        const room = roomInput.value.trim() || 'yayin-oda-1';
        let panelUrl = `https://olumsayaci.netlify.app/?room=${encodeURIComponent(room)}`;
        
        if (window.location.protocol.startsWith('http')) {
            const baseUrl = window.location.href.split('?')[0].replace('index.html', '').replace(/\/$/, '');
            panelUrl = `${baseUrl}/?room=${encodeURIComponent(room)}`;
        }
        
        document.getElementById('qrUrlText').textContent = panelUrl;
        generateQrCode(panelUrl);
        openModal(qrModal);
    });

    // ================= YARDIMCI FONKSİYONLAR =================
    function generateQrCode(text) {
        const qrContainer = document.getElementById('qrCanvasContainer');
        qrContainer.innerHTML = '';
        if (typeof QRCode !== 'undefined') {
            new QRCode(qrContainer, {
                text: text,
                width: 200,
                height: 200,
                colorDark : "#0b0f19",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        } else {
            // QR Code CDN fallback (Google Chart API / QuickChart)
            const img = document.createElement('img');
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
            img.width = 200;
            img.height = 200;
            qrContainer.appendChild(img);
        }
    }

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2400);
    }

    function openModal(modal) {
        if (modal) modal.classList.add('active');
    }

    function closeModal(modal) {
        if (modal) modal.classList.remove('active');
    }

    document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay') || e.target.closest('.modal-backdrop');
            closeModal(modal);
        });
    });

    // İlk Durumu Yükle
    updateAdminUI(sync.state);
    updatePreviewUI(sync.state);
});
