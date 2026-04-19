/**
 * PetFriends - Storage Module
 * LocalStorage wrapper with debounced persistence
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
            achievements: [],
            inventory: [],
            events: [],
            settings: {
                soundEnabled: true,
                hapticEnabled: true
            },
            daily: {
                lastSpin: 0,
                spinCount: 0,
                streak: 0,
                lastVisit: 0
            },
            quests: [],
            completedQuests: [],
            cooldowns: {},
            coOpPets: []
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
            if (this.saveTimers[key]) {
                clearTimeout(this.saveTimers[key]);
            }
            this.saveTimers[key] = setTimeout(() => {
                this.saveImmediate();
            }, this.DEBOUNCE_MS);
        }
    },
    
    saveImmediate() {
        try {
            const userData = JSON.stringify(this.cache);
            localStorage.setItem(this.PREFIX + 'user', userData);
        } catch (error) {
            console.error('Storage save error:', error);
        }
    },
    
    save() {
        try {
            const userData = JSON.stringify(this.cache);
            localStorage.setItem(this.PREFIX + 'user', userData);
        } catch (error) {
            console.error('Storage save error:', error);
        }
    },
    
    getUser() {
        return {
            coins: this.get('coins', 100),
            pets: this.get('pets', []),
            activePetId: this.get('activePetId', null),
            achievements: this.get('achievements', []),
            inventory: this.get('inventory', []),
            events: this.get('events', []),
            settings: this.get('settings', { soundEnabled: true, hapticEnabled: true }),
            daily: this.get('daily', { lastSpin: 0, spinCount: 0, streak: 0, lastVisit: 0 }),
            quests: this.get('quests', []),
            completedQuests: this.get('completedQuests', []),
            cooldowns: this.get('cooldowns', {}),
            coOpPets: this.get('coOpPets', [])
        };
    },
    
    saveUser(userData) {
        Object.keys(userData).forEach(key => {
            this.set(key, userData[key], true);
        });
    },
    
    // Очистка всех данных
    clear() {
        localStorage.removeItem(this.PREFIX + 'user');
        this.cache = {};
    },
    
    // Работа с монетами
    addCoins(amount) {
        const current = this.get('coins', 0);
        const newTotal = current + amount;
        this.set('coins', newTotal, true);
        return newTotal;
    },
    
    spendCoins(amount) {
        const current = this.get('coins', 0);
        if (current < amount) return false;
        this.set('coins', current - amount, true);
        return true;
    },
    
    // Работа с питомцами
    getActivePet() {
        const activeId = this.get('activePetId');
        if (!activeId) return null;
        const pets = this.get('pets', []);
        return pets.find(p => p.id === activeId) || null;
    },
    
    setActivePet(petId) {
        this.set('activePetId', petId, true);
    },
    
    getAllPets() {
        return this.get('pets', []);
    },
    
    addPet(pet) {
        const pets = this.get('pets', []);
        pets.push(pet);
        this.set('pets', pets, true);
        if (pets.length === 1) {
            this.setActivePet(pet.id);
        }
    },
    
    updatePet(petId, updates) {
        const pets = this.get('pets', []);
        const index = pets.findIndex(p => p.id === petId);
        if (index !== -1) {
            pets[index] = { ...pets[index], ...updates };
            this.set('pets', pets, true);
        }
    },
    
    deletePet(petId) {
        let pets = this.get('pets', []);
        pets = pets.filter(p => p.id !== petId);
        this.set('pets', pets, true);
        if (this.get('activePetId') === petId) {
            this.setActivePet(pets.length > 0 ? pets[0].id : null);
        }
    },
    
    // Работа с кулдаунами
    getCooldown(key) {
        const cooldowns = this.get('cooldowns', {});
        const cooldown = cooldowns[key];
        if (!cooldown) return { active: false, remaining: 0 };
        
        const remaining = cooldown - Date.now();
        return {
            active: remaining > 0,
            remaining: Math.max(0, remaining)
        };
    },
    
    setCooldown(key, durationMs) {
        const cooldowns = this.get('cooldowns', {});
        cooldowns[key] = Date.now() + durationMs;
        this.set('cooldowns', cooldowns, true);
    },
    
    // Работа с ежедневными наградами
    getDailyData() {
        return this.get('daily', { lastSpin: 0, spinCount: 0, streak: 0, lastVisit: 0 });
    },
    
    updateDaily(data) {
        this.set('daily', data, true);
    },
    
    canSpinWheel() {
        const daily = this.getDailyData();
        const lastSpin = daily.lastSpin || 0;
        const dayMs = 24 * 60 * 60 * 1000;
        return Date.now() - lastSpin >= dayMs;
    },
    
    // Работа с квестами
    getQuests() {
        return this.get('quests', []);
    },
    
    getCompletedQuests() {
        return this.get('completedQuests', []);
    },
    
    completeQuest(questId) {
        const completed = this.get('completedQuests', []);
        if (!completed.includes(questId)) {
            completed.push(questId);
            this.set('completedQuests', completed, true);
        }
    },
    
    addQuestProgress(action, amount = 1) {
        const quests = this.get('quests', []);
        const questIndex = quests.findIndex(q => q.action === action && !q.completed);
        if (questIndex !== -1) {
            quests[questIndex].progress = (quests[questIndex].progress || 0) + amount;
            if (quests[questIndex].progress >= quests[questIndex].target) {
                quests[questIndex].completed = true;
            }
            this.set('quests', quests, true);
        }
    },
    
    // Работа с инвентарём
    addToInventory(item, count = 1) {
        const inventory = this.get('inventory', []);
        const existing = inventory.find(i => i.id === item.id);
        if (existing) {
            existing.count += count;
        } else {
            inventory.push({ ...item, count });
        }
        this.set('inventory', count > 0 ? inventory : inventory.filter(i => i.count > 0), true);
    },
    
    removeFromInventory(itemId, count = 1) {
        const inventory = this.get('inventory', []);
        const existing = inventory.find(i => i.id === itemId);
        if (!existing || existing.count < count) return false;
        
        existing.count -= count;
        if (existing.count <= 0) {
            const index = inventory.findIndex(i => i.id === itemId);
            inventory.splice(index, 1);
        }
        this.set('inventory', inventory, true);
        return true;
    },
    
    getInventoryByCategory(category) {
        const inventory = this.get('inventory', []);
        if (category === 'all') return inventory;
        return inventory.filter(i => i.category === category);
    },
    
    // Работа с событиями
    addEvent(event) {
        const events = this.get('events', []);
        events.unshift({
            ...event,
            id: Date.now().toString(),
            timestamp: Date.now()
        });
        if (events.length > 50) {
            events.pop();
        }
        this.set('events', events, true);
    },
    
    clearEvents() {
        this.set('events', [], true);
    },
    
    // Совместные питомцы
    getCoOpPets() {
        return this.get('coOpPets', []);
    },
    
    addCoOpPet(pet) {
        const coOpPets = this.get('coOpPets', []);
        coOpPets.push(pet);
        this.set('coOpPets', coOpPets, true);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
