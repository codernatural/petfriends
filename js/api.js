/**
 * PetFriends - API Client
 * Подключение к VPS серверу
 */

const API = {
    baseUrl: 'http://144.31.85.158:3000',
    token: null,
    
    // Инициализация
    async init() {
        // Пробуем подключиться к серверу
        try {
            const res = await fetch(`${this.baseUrl}/health`, { 
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (res.ok) {
                console.log('🐾 API сервер подключён');
                this.connected = true;
                return true;
            }
        } catch (e) {
            console.log('🐾 API сервер недоступен, используем локальный режим');
        }
        
        this.connected = false;
        return false;
    },
    
    connected: false,
    
    // Авторизация
    async auth() {
        if (!this.connected) return { success: false, offline: true };
        
        try {
            const initData = TelegramAPI.getInitData();
            
            const res = await fetch(`${this.baseUrl}/api/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    initData,
                    bot_token: '' // Опционально
                })
            });
            
            const data = await res.json();
            
            if (data.token) {
                this.token = data.token;
                Storage.set('api_token', data.token);
                return { success: true, user: data.user };
            }
            
            return { success: false, error: data.error };
        } catch (e) {
            console.error('Auth error:', e);
            return { success: false, offline: true };
        }
    },
    
    // Проверка токена
    async checkAuth() {
        const token = Storage.get('api_token');
        if (token) {
            this.token = token;
            try {
                const res = await fetch(`${this.baseUrl}/api/user`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) return true;
            } catch (e) {}
        }
        return false;
    },
    
    // GET запрос
    async get(endpoint) {
        if (!this.connected || !this.token) return null;
        
        try {
            const res = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            return await res.json();
        } catch (e) {
            console.error('GET error:', e);
            return null;
        }
    },
    
    // POST запрос
    async post(endpoint, body = {}) {
        if (!this.connected || !this.token) return null;
        
        try {
            const res = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(body)
            });
            return await res.json();
        } catch (e) {
            console.error('POST error:', e);
            return null;
        }
    },
    
    // PUT запрос
    async put(endpoint, body = {}) {
        if (!this.connected || !this.token) return null;
        
        try {
            const res = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(body)
            });
            return await res.json();
        } catch (e) {
            console.error('PUT error:', e);
            return null;
        }
    },
    
    // DELETE запрос
    async del(endpoint) {
        if (!this.connected || !this.token) return null;
        
        try {
            const res = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            return await res.json();
        } catch (e) {
            console.error('DEL error:', e);
            return null;
        }
    },
    
    // ============ PETS ============
    async getPets() {
        return await this.get('/api/pets');
    },
    
    async getSharedPets() {
        return await this.get('/api/pets/shared');
    },
    
    async createPet(config) {
        return await this.post('/api/pets', config);
    },
    
    async updatePet(petId, action, value) {
        return await this.put(`/api/pets/${petId}`, { action, value });
    },
    
    async inviteFriend(petId) {
        return await this.post(`/api/pets/${petId}/invite`);
    },
    
    async joinByCode(code) {
        return await this.post('/api/join', { code });
    },
    
    // ============ WHEEL ============
    async spinWheel() {
        return await this.post('/api/wheel/spin');
    },
    
    // ============ INVENTORY ============
    async getInventory() {
        return await this.get('/api/inventory');
    },
    
    async addItem(itemId, count = 1) {
        return await this.post('/api/inventory', { item_id: itemId, count });
    },
    
    async removeItem(itemId) {
        return await this.del(`/api/inventory/${itemId}`);
    },
    
    // ============ COINS ============
    async updateCoins(amount) {
        return await this.post('/api/coins', { amount });
    },
    
    // ============ EVENTS ============
    async getEvents() {
        return await this.get('/api/events');
    },
    
    async addEvent(event) {
        return await this.post('/api/events', event);
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}
