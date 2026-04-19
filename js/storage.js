/**
 * PetFriends - Storage Module v3
 * LocalStorage + Shared Pets + Invite Codes
 */

const Storage = {
    PREFIX: 'petfriends_',
    DEBOUNCE_MS: 300,
    cache: {},
    saveTimers: {},
    
    init() {
        try {
            const userData = localStorage.getItem(this.PREFIX + 'user');
            if (userData) {
                this.cache = JSON.parse(userData);
            } else {
                this.cache = this.getDefaultData();
                this.save();
            }
            return true;
        } catch (error) {
            console.error('Storage init error:', error);
            return false;
        }
    },
    
    getDefaultData() {
        return {
            coins: 100,
            pets: [],
            activePetId: null,
            inventory: [],
            events: [],
            settings: { soundEnabled: true, hapticEnabled: true },
            daily: { lastSpin: 0, spinCount: 0, streak: 0, lastVisit: 0 },
            quests: [],
            completedQuests: [],
            cooldowns: {},
            coOpPets: [],
            sharedPets: [],
            inviteCodes: {},
            user: null,
            telegramId: null
        };
    },
    
    get(key, defaultValue = null) {
        if (this.cache[key] !== undefined) {
            return this.cache[key];
        }
        try {
            const value = localStorage.getItem(this.PREFIX + key);
            if (value !== null) {
                const parsed = JSON.parse(value);
                this.cache[key] = parsed;
                return parsed;
            }
        } catch (error) {
            console.error(`Storage get error for ${key}:`, error);
        }
        return defaultValue;
    },
    
    set(key, value, immediate = false) {
        this.cache[key] = value;
        if (immediate) {
            this.saveImmediate();
        } else {
            if (this.saveTimers[key]) clearTimeout(this.saveTimers[key]);
            this.saveTimers[key] = setTimeout(() => this.saveImmediate(), this.DEBOUNCE_MS);
        }
    },
    
    saveImmediate() {
        try {
            localStorage.setItem(this.PREFIX + 'user', JSON.stringify(this.cache));
        } catch (error) {
            console.error('Storage save error:', error);
        }
    },
    
    save() { this.saveImmediate(); },
    
    clear() {
        localStorage.removeItem(this.PREFIX + 'user');
        this.cache = {};
    },
    
    // User
    setUser(user) {
        this.cache.user = user;
        this.cache.telegramId = user?.id || null;
        this.saveImmediate();
    },
    
    getUser() {
        return this.cache.user || {
            id: 'local_' + Date.now(),
            first_name: 'Друг',
            username: 'local_user'
        };
    },
    
    // Coins
    addCoins(amount) {
        this.cache.coins = (this.cache.coins || 0) + amount;
        this.saveImmediate();
        return this.cache.coins;
    },
    
    spendCoins(amount) {
        if ((this.cache.coins || 0) < amount) return false;
        this.cache.coins -= amount;
        this.saveImmediate();
        return true;
    },
    
    getCoins() { return this.cache.coins || 0; },
    
    // Pets
    getAllPets() { return this.cache.pets || []; },
    
    getActivePet() {
        const activeId = this.get('activePetId');
        if (!activeId) return null;
        return this.cache.pets.find(p => p.id === activeId) || null;
    },
    
    setActivePet(petId) {
        this.cache.activePetId = petId;
        this.saveImmediate();
    },
    
    addPet(pet) {
        this.cache.pets = this.cache.pets || [];
        this.cache.pets.push(pet);
        if (!this.cache.activePetId) this.setActivePet(pet.id);
        this.saveImmediate();
    },
    
    updatePet(petId, updates) {
        const pets = this.cache.pets;
        const index = pets.findIndex(p => p.id === petId);
        if (index !== -1) {
            pets[index] = { ...pets[index], ...updates };
            this.saveImmediate();
        }
    },
    
    deletePet(petId) {
        this.cache.pets = (this.cache.pets || []).filter(p => p.id !== petId);
        if (this.cache.activePetId === petId) {
            this.setActivePet(this.cache.pets[0]?.id || null);
        }
        this.saveImmediate();
    },
    
    // Shared Pets
    getSharedPets() { return this.cache.sharedPets || []; },
    
    getMyInviteCodes() { return this.cache.inviteCodes || {}; },
    
    generateInviteCode(petId) {
        const code = this.generateCode();
        this.cache.inviteCodes = this.cache.inviteCodes || {};
        this.cache.inviteCodes[code] = { petId, createdAt: Date.now(), used: false };
        this.saveImmediate();
        return code;
    },
    
    generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    },
    
    joinByInviteCode(code) {
        const codes = this.cache.inviteCodes || {};
        const invite = codes[code];
        
        if (!invite || invite.used) {
            return { success: false, error: 'Неверный или использованный код' };
        }
        
        // Найти питомца в совместных
        const sharedPets = this.cache.sharedPets || [];
        const existing = sharedPets.find(p => p.id === invite.petId);
        
        if (existing) {
            // Уже присоединился
            return { success: false, error: 'Вы уже присоединились к этому питомцу' };
        }
        
        // Добавить в совместные
        const allPets = this.cache.pets || [];
        const pet = allPets.find(p => p.id === invite.petId);
        
        if (pet) {
            sharedPets.push({ ...pet, isCoOwner: true, joinedAt: Date.now() });
            this.cache.sharedPets = sharedPets;
            invite.used = true;
            this.saveImmediate();
            
            return { success: true, pet };
        }
        
        return { success: false, error: 'Питомец не найден' };
    },
    
    addToSharedPets(pet) {
        this.cache.sharedPets = this.cache.sharedPets || [];
        if (!this.cache.sharedPets.find(p => p.id === pet.id)) {
            this.cache.sharedPets.push({ ...pet, isCoOwner: true, joinedAt: Date.now() });
            this.saveImmediate();
        }
    },
    
    // Cooldowns
    getCooldown(key) {
        const cooldowns = this.cache.cooldowns || {};
        const expires = cooldowns[key];
        if (!expires) return { active: false, remaining: 0 };
        
        const remaining = expires - Date.now();
        return { active: remaining > 0, remaining: Math.max(0, remaining) };
    },
    
    setCooldown(key, durationMs) {
        this.cache.cooldowns = this.cache.cooldowns || {};
        this.cache.cooldowns[key] = Date.now() + durationMs;
        this.saveImmediate();
    },
    
    // Daily
    getDailyData() { return this.cache.daily || { lastSpin: 0, streak: 0, lastVisit: 0 }; },
    
    canSpinWheel() {
        const daily = this.getDailyData();
        return Date.now() - (daily.lastSpin || 0) >= 24 * 60 * 60 * 1000;
    },
    
    updateDaily(data) {
        this.cache.daily = { ...this.getDailyData(), ...data };
        this.saveImmediate();
    },
    
    // Inventory
    addToInventory(item, count = 1) {
        const inv = this.cache.inventory || [];
        const existing = inv.find(i => i.id === item.id);
        if (existing) {
            existing.count += count;
        } else {
            inv.push({ ...item, count });
        }
        this.cache.inventory = inv;
        this.saveImmediate();
    },
    
    removeFromInventory(itemId, count = 1) {
        const inv = this.cache.inventory || [];
        const existing = inv.find(i => i.id === itemId);
        if (!existing || existing.count < count) return false;
        
        existing.count -= count;
        if (existing.count <= 0) {
            const idx = inv.findIndex(i => i.id === itemId);
            inv.splice(idx, 1);
        }
        this.cache.inventory = inv;
        this.saveImmediate();
        return true;
    },
    
    getInventoryByCategory(category) {
        const inv = this.cache.inventory || [];
        if (category === 'all') return inv;
        return inv.filter(i => i.category === category);
    },
    
    // Quests
    addQuestProgress(action, amount = 1) {
        let quests = this.cache.quests || [];
        const quest = quests.find(q => q.action === action && !q.completed);
        if (quest) {
            quest.progress = (quest.progress || 0) + amount;
            if (quest.progress >= quest.target) {
                quest.completed = true;
                this.addCoins(quest.reward);
            }
            this.cache.quests = quests;
            this.saveImmediate();
        }
    },
    
    getQuests() { return this.cache.quests || []; },
    
    initDailyQuests() {
        if ((this.cache.quests || []).length === 0) {
            this.cache.quests = [
                { id: 'feed_5', title: 'Покорми питомца 5 раз', action: 'feed', target: 5, reward: 15, progress: 0, completed: false },
                { id: 'play_3', title: 'Поиграй 3 раза', action: 'play', target: 3, reward: 20, progress: 0, completed: false },
                { id: 'spin_wheel', title: 'Крути колесо', action: 'spin', target: 1, reward: 10, progress: 0, completed: false }
            ];
            this.saveImmediate();
        }
    },
    
    // Events
    addEvent(event) {
        const events = this.cache.events || [];
        events.unshift({ ...event, id: Date.now().toString(), timestamp: Date.now() });
        if (events.length > 50) events.pop();
        this.cache.events = events;
        this.saveImmediate();
    },
    
    clearEvents() {
        this.cache.events = [];
        this.saveImmediate();
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
