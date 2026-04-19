/**
 * PetFriends - API Client
 * Подключение к VPS серверу
 */

const API = {
    baseUrl: 'http://144.31.85.158:3001',
    token: null,
    connected: false,
    
    async init() {
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
    
    async auth() {
        if (!this.connected) return { success: false, offline: true };
        
        try {
            const initData = TelegramAPI.getInitData();
            const res = await fetch(`${this.baseUrl}/api/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData })
            });
            
            const data = await res.json();
            
            if (data.token) {
                this.token = data.token;
                Storage.set('api_token', data.token);
                return { success: true, user: data.user };
            }
            
            return { success: false, error: data.error };
        } catch (e) {
            return { success: false, offline: true };
        }
    },
    
    async get(endpoint) {
        if (!this.connected || !this.token) return null;
        
        try {
            const res = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            return await res.json();
        } catch (e) {
            return null;
        }
    },
    
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
            return null;
        }
    },
    
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
            return null;
        }
    },
    
    async del(endpoint) {
        if (!this.connected || !this.token) return null;
        
        try {
            const res = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            return await res.json();
        } catch (e) {
            return null;
        }
    },
    
    async getPets() { return await this.get('/api/pets'); },
    async getSharedPets() { return await this.get('/api/pets/shared'); },
    async createPet(config) { return await this.post('/api/pets', config); },
    async updatePet(petId, action, value) { return await this.put(`/api/pets/${petId}`, { action, value }); },
    async inviteFriend(petId) { return await this.post(`/api/pets/${petId}/invite`); },
    async joinByCode(code) { return await this.post('/api/join', { code }); },
    async spinWheel() { return await this.post('/api/wheel/spin'); },
    async getInventory() { return await this.get('/api/inventory'); },
    async addItem(itemId, count = 1) { return await this.post('/api/inventory', { item_id: itemId, count }); },
    async removeItem(itemId) { return await this.del(`/api/inventory/${itemId}`); },
    async updateCoins(amount) { return await this.post('/api/coins', { amount }); },
    async getEvents() { return await this.get('/api/events'); },
    async addEvent(event) { return await this.post('/api/events', event); }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}
