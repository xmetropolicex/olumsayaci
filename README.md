# 🎮 OBS Canlı Yayın Ölüm Sayacı (Death Counter)

Yayıncılar için özel olarak tasarlanmış; şık kart tasarımlarına sahip, bilgisayardan görsel/avatar yüklenebilen, ses efektli ve **hem aynı bilgisayardan hem de Netlify üzerinden telefondan uzaktan kontrol edilebilen** yeni nesil OBS Ölüm Sayacı.

---

## ✨ Öne Çıkan Özellikler

- 🌟 **OBS Şeffaf Kart Tasarımı**: Tamamen şeffaf arka plan, yayını kaplamayan kompakt ve şık widget. OBS üzerinde istediğin köşeye kolayca sürükleyebilirsin.
- 📱 **Telefondan Uzaktan Kontrol**: Netlify'a tek tıkla yükleyip QR kodu telefonunla okutarak canlı yayında telefonunu kablosuz bir kumandaya dönüştürebilirsin.
- 📁 **Bilgisayardan Fotoğraf / Avatar Yükleme**: Bilgisayarındaki herhangi bir karakter resmini veya oyun kapağını yükle (otomatik optimize edilir).
- 🎨 **6 Farklı Şık Tema**:
  - 🗡️ **Dark Souls / Blood Red** (Gotik ve kan kırmızısı)
  - ⚡ **Cyberpunk Neon** (Cyan & Glitch)
  - 💎 **Modern Glassmorphism** (Buzlu cam ve minimalist)
  - 👾 **Retro 8-Bit Arcade** (Piksel nostalji)
  - 🏆 **Esports Pro / Valorant** (Keskin çizgiler)
  - 👑 **Midnight Gold** (Koyu altın)
- 🔔 **Dahili Web Ses Efektleri**: Ekstra dosya indirmeden çalışan Dark Souls Çanı, Retro Game Over, Minecraft Punch, Sub Boom, Glitch vb.
- 💥 **Canlı Animasyonlar**: Ölüm eklendiğinde sayaç büyümesi, kart titremesi (shake), yükselen `+1` parçacıkları ve kırmızı ekran parıltısı.
- ⌨️ **Klavye Kısayolları**: `[Numpad +]`, `[Numpad -]` veya `[Boşluk]` tuşları.

---

## 🚀 1. Hızlı Başlangıç (Aynı Bilgisayarda Kullanım)

1. **Overlay'i OBS'e Ekleme**:
   - OBS Studio'yu açın.
   - **Kaynaklar (Sources)** kutusundaki `+` butonuna tıklayın ve **Tarayıcı (Browser)** seçeneğini seçin.
   - **Yerel Dosya (Local File)** kutucuğunu işaretleyin ve `overlay.html` dosyasını seçin.
   - Genişlik (Width): `500`, Yükseklik (Height): `220` (veya tam ekran için `1920x1080`) yazın.
   - Tamam'a tıklayın. Kartı yayında istediğiniz yere sürükleyip boyutlandırın.

2. **Admin Panelini Açma**:
   - `index.html` dosyasına çift tıklayarak tarayıcınızda veya ikinci monitörünüzde açın.
   - `+1 ÖLÜM EKLE` butonuna bastığınızda OBS ekranınızdaki sayaç **anında** güncellenecektir!

---

## 🌐 2. Netlify'a Yükleme & Telefondan Kontrol Etme (1 Dakika)

Sayacı Netlify'a ücretsiz yükleyerek telefonundan kontrol etmek çok kolaydır:

1. **[app.netlify.com/drop](https://app.netlify.com/drop)** adresine gidin (Ücretsiz giriş yapın).
2. Bu klasörün tamamını (`olum sayaci`) fareyle tutup Netlify'ın yükleme kutusuna sürükleyip bırakın.
3. Netlify size anında ücretsiz bir web linki verecektir (Örnek: `https://yayin-sayacim.netlify.app`).
4. **OBS'e Ekleme**:
   - OBS'te Tarayıcı Kaynağı ekleyin ve URL kısmına:  
     `https://yayin-sayacim.netlify.app/overlay.html?room=yayin123` yazın.
5. **Telefondan Kontrol Etme**:
   - Telefonunuzun tarayıcısından `https://yayin-sayacim.netlify.app/?room=yayin123` adresini açın veya Admin panelindeki **"📱 Telefonla Kontrol (QR)"** butonuna basıp QR kodu telefonunuzla okutun.
   - Artık oyunu oynarken telefonunuzdaki büyük kırmızı `+1` butonuna her bastığınızda OBS anında değişecektir!

---

## 🕹️ 3. Hazır Oyun Modları

Panelin üst kısmındaki hızlı oyun çiplerine tıklayarak tek dokunuşla oyun ayarlarını değiştirebilirsiniz:
- **Elden Ring** ➔ Altın halkalar & Souls teması & Çan sesi
- **Dark Souls** ➔ Gotik kuru kafa & Kan kırmızısı tema
- **Sekiro** ➔ Ölüm kanjisi & Samuray teması
- **Minecraft** ➔ Piksel kalp & Retro piksel tema & Oof sesi
- **Valorant** ➔ Radiant ikon & Esports teması
- **Counter-Strike 2** ➔ Taktiksel nişangah & Esports teması
- **Cyberpunk 2077** ➔ Sibernetik neon & Glitch ses efekti

---

## 📂 Dosya Yapısı

```
c:\olum sayaci\
├── index.html          # Yönetim / Kumanda Paneli
├── overlay.html        # OBS Tarayıcı Kaynağı (Stream Overlay)
├── css/
│   ├── style.css       # Admin paneli modern koyu tema stilleri
│   └── overlay.css     # OBS saydam kart ve animasyon stilleri
├── js/
│   ├── audio.js        # Dahili Web Audio ses sentezleyici
│   ├── sync.js         # BroadcastChannel + MQTT WebSocket hibrit senkronizasyon motoru
│   └── overlay.js      # Overlay animasyon yöneticisi
├── assets/
│   └── presets/        # SVG oyun ve avatar ikonları
├── netlify.toml        # Netlify dağıtım ayarları
├── _redirects          # Netlify rota yönlendirmeleri
└── README.md           # Kullanım kılavuzu
```
