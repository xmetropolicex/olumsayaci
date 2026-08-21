/**
 * OBS Ölüm Sayacı - Senkronizasyon Motoru (SyncEngine)
 * Anında, çift yönlü ve deduplication (çift tetikleme engelli) eşitleme
 */

class SyncEngine {
    constructor(options = {}) {
        this.instanceId = 'inst_' + Math.random().toString(36).substr(2, 9);
        this.processedMsgIds = new Set();
        this.roomId = options.roomId || this.getRoomIdFromUrl() || 'yayin-oda-1';
        this.isHost = options.isHost || false;
        this.onStateChange = options.onStateChange || (() => {});
        this.onDeathTrigger = options.onDeathTrigger || (() => {});
        this.onConnectionStatus = options.onConnectionStatus || (() => {});

        this.broadcastChannel = null;
        this.mqttClient = null;
        this.isConnectedMqtt = false;
        this.storageKey = `stream_dc_state_${this.roomId}`;

        // Varsayılan Temiz Durum
        this.state = {
            gameTitle: 'ELDEN RING',
            characterName: 'TARNISHED',
            deaths: 0,
            avatarUrl: 'assets/presets/elden_ring.svg',
            theme: 'souls',
            layout: 'horizontal',
            accentColor: '#ef4444',
            counterLabel: 'ÖLÜM SAYISI',
            shakeEffect: true,
            flashEffect: true,
            particlesEnabled: true,
            updatedAt: Date.now()
        };

        this.init();
    }

    getRoomIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('room') || 'yayin-oda-1';
    }

    init() {
        // 1. LocalStorage'dan mevcut durumu yükle
        this.loadLocalState();

        // 2. BroadcastChannel'ı başlat (Aynı PC / OBS için 0ms)
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                this.broadcastChannel = new BroadcastChannel(`death_counter_bc_${this.roomId}`);
                this.broadcastChannel.onmessage = (event) => {
                    if (event.data) {
                        this.handleIncomingMessage(event.data, 'local');
                    }
                };
            } catch (e) {
                console.warn("BroadcastChannel başlatılamadı:", e);
            }
        }

        // 3. Storage Event (Sekmeler arası eşitleme)
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (parsed) {
                        this.state = { ...this.state, ...parsed };
                        this.onStateChange(this.state, 'storage');
                    }
                } catch (err) {}
            }
        });

        // 4. MQTT WebSockets Bulut Bağlantısı (Telefon & Netlify için)
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
        if (typeof mqtt === 'undefined') {
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
            this.onConnectionStatus({ status: 'local_only', text: 'Yerel Mod' });
        };
        document.head.appendChild(script);
    }

    connectMqtt() {
        if (typeof mqtt === 'undefined') return;

        const topic = `death_counter_room_v5/${this.roomId}`;
        const clientId = `dc_${Math.random().toString(16).substr(2, 8)}`;
        
        const brokers = [
            'wss://broker.emqx.io:8084/mqtt',
            'wss://broker.hivemq.com:8884/mqtt'
        ];

        let currentBrokerIndex = 0;

        const tryConnect = () => {
            if (currentBrokerIndex >= brokers.length) {
                this.onConnectionStatus({ status: 'local_only', text: 'Yerel Mod' });
                return;
            }

            const brokerUrl = brokers[currentBrokerIndex];

            try {
                this.mqttClient = mqtt.connect(brokerUrl, {
                    clientId: clientId,
                    clean: true,
                    connectTimeout: 4000,
                    reconnectPeriod: 3000
                });

                this.mqttClient.on('connect', () => {
                    this.isConnectedMqtt = true;
                    this.onConnectionStatus({ status: 'connected', text: 'Senkronize' });

                    this.mqttClient.subscribe(topic, { qos: 0 }, (err) => {
                        if (!err && !this.isHost) {
                            this.sendMessage({ type: 'REQUEST_STATE' });
                        }
                    });
                });

                this.mqttClient.on('message', (t, message) => {
                    try {
                        const parsed = JSON.parse(message.toString());
                        this.handleIncomingMessage(parsed, 'mqtt');
                    } catch (e) {}
                });

                this.mqttClient.on('error', () => {
                    this.mqttClient.end();
                    currentBrokerIndex++;
                    tryConnect();
                });

                this.mqttClient.on('close', () => {
                    this.isConnectedMqtt = false;
                });

            } catch (err) {
                currentBrokerIndex++;
                tryConnect();
            }
        };

        tryConnect();
    }

    sendMessage(payload) {
        payload.instanceId = this.instanceId;
        payload.msgId = `${this.instanceId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        payload.timestamp = Date.now();

        // 1. BroadcastChannel (Aynı PC)
        if (this.broadcastChannel) {
            try {
                this.broadcastChannel.postMessage(payload);
            } catch (e) {}
        }

        // 2. MQTT (Uzak cihazlar)
        if (this.mqttClient && this.isConnectedMqtt) {
            const topic = `death_counter_room_v5/${this.roomId}`;
            try {
                this.mqttClient.publish(topic, JSON.stringify(payload));
            } catch (e) {}
        }
    }

    handleIncomingMessage(message, source) {
        if (!message || !message.type) return;

        // Kendi sekmemizin gönderdiği mesajı yut
        if (message.instanceId === this.instanceId) return;

        // Çift işlemeyi (duplicate trigger) engelle
        if (message.msgId) {
            if (this.processedMsgIds.has(message.msgId)) return;
            this.processedMsgIds.add(message.msgId);
            if (this.processedMsgIds.size > 80) {
                const first = this.processedMsgIds.values().next().value;
                this.processedMsgIds.delete(first);
            }
        }

        switch (message.type) {
            case 'STATE_UPDATE':
                if (message.state) {
                    this.state = { ...this.state, ...message.state };
                    this.saveLocalState();
                    this.onStateChange(this.state, source);
                }
                break;

            case 'DEATH_TRIGGER':
                if (message.state) {
                    this.state = { ...this.state, ...message.state };
                    this.saveLocalState();
                }
                this.onDeathTrigger(message.delta || 1, this.state);
                this.onStateChange(this.state, source);
                break;

            case 'REQUEST_STATE':
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

    broadcastState() {
        this.sendMessage({
            type: 'STATE_UPDATE',
            state: this.state
        });
    }

    incrementDeath(amount = 1) {
        const newDeaths = Math.max(0, (parseInt(this.state.deaths, 10) || 0) + amount);
        this.updateState({ deaths: newDeaths }, true, amount);
    }

    decrementDeath(amount = 1) {
        const newDeaths = Math.max(0, (parseInt(this.state.deaths, 10) || 0) - amount);
        this.updateState({ deaths: newDeaths }, false, -amount);
    }

    resetDeaths() {
        this.updateState({ deaths: 0 });
        this.sendMessage({
            type: 'RESET_TRIGGER',
            state: this.state
        });
    }

    setRoom(newRoomId) {
        if (!newRoomId || newRoomId === this.roomId) return;
        this.roomId = newRoomId;
        this.storageKey = `stream_dc_state_${this.roomId}`;
        this.loadLocalState();
        if (this.broadcastChannel) {
            this.broadcastChannel.close();
            this.broadcastChannel = new BroadcastChannel(`death_counter_bc_${this.roomId}`);
            this.broadcastChannel.onmessage = (event) => {
                if (event.data) {
                    this.handleIncomingMessage(event.data, 'local');
                }
            };
        }
        if (this.mqttClient && this.isConnectedMqtt) {
            this.mqttClient.subscribe(`death_counter_room_v5/${this.roomId}`);
        }
        this.onStateChange(this.state, 'room_change');
    }
}
