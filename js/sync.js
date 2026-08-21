/**
 * OBS Ölüm Sayacı - Hibrit Senkronizasyon Motoru (SyncEngine)
 * 1. BroadcastChannel (Aynı PC / OBS için 0ms gecikmeli yerel bağlantı)
 * 2. LocalStorage (Anında durum kaydı ve sekme arası yedek)
 * 3. MQTT WebSockets (Netlify / Telefon / Uzaktan kontrol için global bulut senkronizasyonu)
 */

class SyncEngine {
    constructor(options = {}) {
        this.roomId = options.roomId || this.getRoomIdFromUrl() || 'yayin-oda-1';
        this.isHost = options.isHost || false;
        this.onStateChange = options.onStateChange || (() => {});
        this.onDeathTrigger = options.onDeathTrigger || (() => {});
        this.onConnectionStatus = options.onConnectionStatus || (() => {});

        this.broadcastChannel = null;
        this.mqttClient = null;
        this.isConnectedMqtt = false;
        this.storageKey = `stream_dc_state_${this.roomId}`;

        // Default initial state
        this.state = {
            gameTitle: 'ELDEN RING',
            characterName: 'Tarnished',
            deaths: 0,
            avatarUrl: 'assets/presets/elden_ring.svg',
            theme: 'souls', // souls, cyberpunk, glass, retro, esports, gold
            layout: 'horizontal', // horizontal, vertical, compact, boss
            accentColor: '#e63946',
            glowColor: 'rgba(230, 57, 70, 0.6)',
            counterLabel: 'ÖLÜM SAYISI',
            soundEnabled: true,
            soundEffect: 'souls_death',
            shakeEffect: true,
            particlesEnabled: true,
            scale: 100,
            updatedAt: Date.now()
        };

        this.init();
    }

    getRoomIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('room') || 'yayin-oda-1';
    }

    init() {
        // 1. LocalStorage'dan son durumu yükle
        this.loadLocalState();

        // 2. BroadcastChannel'ı başlat (Yerel OBS & Tarayıcılar için)
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                this.broadcastChannel = new BroadcastChannel(`death_counter_bc_${this.roomId}`);
                this.broadcastChannel.onmessage = (event) => {
                    this.handleIncomingMessage(event.data, 'local');
                };
            } catch (e) {
                console.warn("BroadcastChannel başlatılamadı:", e);
            }
        }

        // 3. Storage Event Dinleyicisi
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    this.handleIncomingMessage({ type: 'STATE_UPDATE', state: parsed }, 'storage');
                } catch (err) {}
            }
        });

        // 4. MQTT WebSockets Bulut Bağlantısını Başlat (Telefon & Netlify için)
        this.initMqtt();
    }

    loadLocalState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.avatarUrl && parsed.avatarUrl.endsWith('.png')) {
                    parsed.avatarUrl = parsed.avatarUrl.replace('.png', '.svg');
                }
                this.state = { ...this.state, ...parsed };
            }
        } catch (e) {
            console.warn("LocalState yükleme hatası:", e);
        }
    }

    saveLocalState() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (e) {}
    }

    initMqtt() {
        // MQTT CDN kütüphanesi yüklü mü kontrol et
        if (typeof mqtt === 'undefined') {
            // mqtt CDN yüklenmemişse dinamik yükle veya yerel çalış
            console.log("MQTT istemcisi yükleniyor...");
            this.loadMqttScript(() => {
                this.connectMqtt();
            });
        } else {
            this.connectMqtt();
        }
    }

    loadMqttScript(callback) {
        if (typeof mqtt !== 'undefined') {
            if (callback) callback();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/mqtt@4.3.7/dist/mqtt.min.js';
        script.onload = () => {
            if (callback) callback();
        };
        script.onerror = () => {
            console.warn("MQTT CDN yüklenemedi. Sadece yerel senkronizasyon aktif.");
            this.onConnectionStatus({ status: 'local_only', text: 'Yerel Mod Aktif (Aynı PC)' });
        };
        document.head.appendChild(script);
    }

    connectMqtt() {
        if (typeof mqtt === 'undefined') return;

        const topic = `death_counter_room_v2/${this.roomId}`;
        const clientId = `dc_${Math.random().toString(16).substr(2, 8)}`;
        
        // Ücretsiz & Hızlı MQTT WebSocket Brokerları
        const brokers = [
            'wss://broker.emqx.io:8084/mqtt',
            'wss://broker.hivemq.com:8884/mqtt'
        ];

        let currentBrokerIndex = 0;

        const tryConnect = () => {
            if (currentBrokerIndex >= brokers.length) {
                console.warn("Tüm MQTT broker bağlantıları denendi. Yerel modda devam ediliyor.");
                this.onConnectionStatus({ status: 'local_only', text: 'Yerel Mod (BroadcastChannel)' });
                return;
            }

            const brokerUrl = brokers[currentBrokerIndex];
            console.log(`MQTT Broker'a bağlanılıyor: ${brokerUrl}`);

            try {
                this.mqttClient = mqtt.connect(brokerUrl, {
                    clientId: clientId,
                    clean: true,
                    connectTimeout: 5000,
                    reconnectPeriod: 3000
                });

                this.mqttClient.on('connect', () => {
                    console.log("MQTT Broker'a başarıyla bağlandı!");
                    this.isConnectedMqtt = true;
                    this.onConnectionStatus({ status: 'connected', text: 'Bulut & Yerel Senkronize' });

                    this.mqttClient.subscribe(topic, { qos: 0 }, (err) => {
                        if (!err) {
                            console.log(`Oda konusuna abone olundu: ${topic}`);
                            // Eğer overlay ise ve host değilse durumu talep et
                            if (!this.isHost) {
                                this.sendMessage({ type: 'REQUEST_STATE' });
                            }
                        }
                    });
                });

                this.mqttClient.on('message', (t, message) => {
                    try {
                        const parsed = JSON.parse(message.toString());
                        // Kendi gönderdiğimiz mesajları tekrar işlememek için clientId kontrolü
                        if (parsed.senderId !== clientId) {
                            this.handleIncomingMessage(parsed, 'mqtt');
                        }
                    } catch (e) {
                        console.error("MQTT mesaj parse hatası:", e);
                    }
                });

                this.mqttClient.on('error', (err) => {
                    console.warn("MQTT bağlantı hatası:", err);
                    this.mqttClient.end();
                    currentBrokerIndex++;
                    tryConnect();
                });

                this.mqttClient.on('close', () => {
                    this.isConnectedMqtt = false;
                });

            } catch (err) {
                console.warn("MQTT connect exception:", err);
                currentBrokerIndex++;
                tryConnect();
            }
        };

        tryConnect();
    }

    sendMessage(payload) {
        payload.senderId = this.mqttClient ? this.mqttClient.options?.clientId : 'local';
        payload.timestamp = Date.now();

        // 1. BroadcastChannel ile aynı PC'ye anında yolla
        if (this.broadcastChannel) {
            try {
                this.broadcastChannel.postMessage(payload);
            } catch (e) {}
        }

        // 2. MQTT ile buluta yolla (Telefon / Uzak cihazlar)
        if (this.mqttClient && this.isConnectedMqtt) {
            const topic = `death_counter_room_v2/${this.roomId}`;
            try {
                this.mqttClient.publish(topic, JSON.stringify(payload));
            } catch (e) {}
        }
    }

    handleIncomingMessage(message, source) {
        if (!message || !message.type) return;

        switch (message.type) {
            case 'STATE_UPDATE':
                if (message.state) {
                    this.state = { ...this.state, ...message.state };
                    this.saveLocalState();
                    this.onStateChange(this.state, source);
                }
                break;

            case 'DEATH_TRIGGER':
                // Ölüm artışı animasyon ve ses tetiklemesi
                if (message.state) {
                    this.state = { ...this.state, ...message.state };
                    this.saveLocalState();
                }
                this.onDeathTrigger(message.delta || 1, this.state);
                this.onStateChange(this.state, source);
                break;

            case 'REQUEST_STATE':
                // Yeni bağlanan istemciye güncel durumu ilet (Eğer host ise)
                if (this.isHost) {
                    this.broadcastState();
                }
                break;

            case 'RESET_TRIGGER':
                if (message.state) {
                    this.state = { ...this.state, ...message.state };
                    this.saveLocalState();
                    this.onStateChange(this.state, source);
                }
                break;
        }
    }

    // Durumu güncelle ve tüm bağlı ekranlara yayınla
    updateState(partialState, isDeathIncrement = false, delta = 1) {
        this.state = {
            ...this.state,
            ...partialState,
            updatedAt: Date.now()
        };

        this.saveLocalState();
        this.onStateChange(this.state, 'self');

        if (isDeathIncrement) {
            this.sendMessage({
                type: 'DEATH_TRIGGER',
                delta: delta,
                state: this.state
            });
            this.onDeathTrigger(delta, this.state);
        } else {
            this.sendMessage({
                type: 'STATE_UPDATE',
                state: this.state
            });
        }
    }

    // Sadece mevcut durumu yayınla
    broadcastState() {
        this.sendMessage({
            type: 'STATE_UPDATE',
            state: this.state
        });
    }

    // Hızlı ölüm arttırma
    incrementDeath(amount = 1) {
        const newDeaths = Math.max(0, (parseInt(this.state.deaths, 10) || 0) + amount);
        this.updateState({ deaths: newDeaths }, true, amount);
    }

    // Hızlı ölüm azaltma
    decrementDeath(amount = 1) {
        const newDeaths = Math.max(0, (parseInt(this.state.deaths, 10) || 0) - amount);
        this.updateState({ deaths: newDeaths }, false, -amount);
    }

    // Sıfırlama
    resetDeaths() {
        this.updateState({ deaths: 0 });
        this.sendMessage({
            type: 'RESET_TRIGGER',
            state: this.state
        });
    }

    // Oda değiştirme
    setRoom(newRoomId) {
        if (!newRoomId || newRoomId === this.roomId) return;
        this.roomId = newRoomId;
        this.storageKey = `stream_dc_state_${this.roomId}`;
        this.loadLocalState();
        if (this.broadcastChannel) {
            this.broadcastChannel.close();
            this.broadcastChannel = new BroadcastChannel(`death_counter_bc_${this.roomId}`);
            this.broadcastChannel.onmessage = (event) => {
                this.handleIncomingMessage(event.data, 'local');
            };
        }
        if (this.mqttClient && this.isConnectedMqtt) {
            this.mqttClient.subscribe(`death_counter_room_v2/${this.roomId}`);
        }
        this.onStateChange(this.state, 'room_change');
    }
}
