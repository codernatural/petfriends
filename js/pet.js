/**
 * PetFriends - Pet System & Game Mechanics
 * Pet logic, quests, minigames, wheel of fortune
 */

// Pet types
const PetTypes = {
    cat: { emoji: '🐱', name: 'Кот', trait: 'независимый' },
    dog: { emoji: '🐶', name: 'Собака', trait: 'энергичный' },
    rabbit: { emoji: '🐰', name: 'Кролик', trait: 'тихий' },
    fox: { emoji: '🦊', name: 'Лиса', trait: 'хитрая' },
    bear: { emoji: '🐻', name: 'Медведь', trait: 'сильный' },
    panda: { emoji: '🐼', name: 'Панда', trait: 'ленивый' },
    koala: { emoji: '🐨', name: 'Коала', trait: 'сонный' },
    frog: { emoji: '🐸', name: 'Лягушка', trait: 'весёлый' }
};

const Personalities = {
    active: { name: 'Активный', emoji: '😊', growthRate: 1.2, foodRate: 1.3 },
    calm: { name: 'Спокойный', emoji: '😴', growthRate: 0.8, foodRate: 0.7 },
    curious: { name: 'Любопытный', emoji: '⭐', growthRate: 1.0, foodRate: 1.0, discoveryChance: 0.3 }
};

// Food items with cooldowns
const FoodItems = {
    apple: { id: 'apple', emoji: '🍎', name: 'Яблоко', hunger: 20, hp: 5, xp: 2, price: 5, cooldownFree: true },
    milk: { id: 'milk', emoji: '🥛', name: 'Молоко', hunger: 30, hp: 10, xp: 5, price: 10, cooldownFree: true },
    cake: { id: 'cake', emoji: '🍰', name: 'Торт', hunger: 50, hp: 20, mood: 10, xp: 10, price: 25 },
    fish: { id: 'fish', emoji: '🐟', name: 'Рыба', hunger: 40, hp: 15, mood: 5, xp: 8, price: 15 },
    cookie: { id: 'cookie', emoji: '🍪', name: 'Печенье', hunger: 15, hp: 5, mood: 5, xp: 5, price: 10, cooldownFree: true },
    honey: { id: 'honey', emoji: '🍯', name: 'Мёд', hunger: 60, hp: 25, mood: 15, xp: 15, price: 35 },
    delicacy: { id: 'delicacy', emoji: '🦐', name: 'Деликатес', hunger: 70, hp: 30, mood: 20, xp: 20, price: 50 },
    carrot: { id: 'carrot', emoji: '🥕', name: 'Морковь', hunger: 25, hp: 5, xp: 3, price: 8, cooldownFree: true }
};

// Care items
const CareItems = {
    bandage: { id: 'bandage', emoji: '🩹', name: 'Аптечка', hp: 30, mood: 5, price: 20 },
    medicine: { id: 'medicine', emoji: '💊', name: 'Лекарство', hp: 50, mood: 10, price: 40 },
    bath: { id: 'bath', emoji: '🛁', name: 'Купание', hp: 5, mood: 10, xp: 5, price: 15 },
    brush: { id: 'brush', emoji: '🧹', name: 'Расчёска', mood: 15, xp: 3, price: 10 },
    toy: { id: 'toy', emoji: '🧸', name: 'Игрушка', mood: 20, xp: 10, price: 25 }
};

// Wheel of Fortune prizes
const WheelPrizes = [
    { emoji: '🍎', name: 'Яблоко', type: 'item', item: FoodItems.apple, count: 3, weight: 20 },
    { emoji: '🍪', name: 'Печенье', type: 'item', item: FoodItems.cookie, count: 2, weight: 15 },
    { emoji: '🪙', name: '10 монет', type: 'coins', amount: 10, weight: 25 },
    { emoji: '🪙🪙', name: '25 монет', type: 'coins', amount: 25, weight: 15 },
    { emoji: '⭐', name: '50 XP', type: 'xp', amount: 50, weight: 10 },
    { emoji: '💎', name: 'Супер приз! 100 монет', type: 'coins', amount: 100, weight: 5 },
    { emoji: '🧸', name: 'Игрушка', type: 'item', item: CareItems.toy, count: 1, weight: 5 },
    { emoji: '💊', name: 'Лекарство', type: 'item', item: CareItems.medicine, count: 1, weight: 5 }
];

// Quests system
const QuestTemplates = [
    { id: 'feed_5', title: 'Покорми питомца 5 раз', action: 'feed', target: 5, reward: 15, description: 'Покорми питомца' },
    { id: 'play_3', title: 'Поиграй 3 раза', action: 'play', target: 3, reward: 20, description: 'Поиграй с питомцем' },
    { id: 'visit_3', title: 'Заходи 3 дня подряд', action: 'visit', target: 3, reward: 30, description: 'Ежедневное посещение' },
    { id: 'earn_100', title: 'Заработай 100 монет', action: 'earn', target: 100, reward: 50, description: 'Заработай монеты' },
    { id: 'spin_wheel', title: 'Крути колесо удачи', action: 'spin', target: 1, reward: 10, description: 'Крутани колесо' },
    { id: 'level_up', title: 'Повысь уровень', action: 'levelup', target: 1, reward: 40, description: 'Достигни нового уровня' }
];

// Minigames for earning coins
const CoinGames = {
    quiz: {
        name: 'Викторина',
        icon: '🧠',
        duration: 30,
        questions: [
            { q: 'Какой питомец любит спать?', answers: ['🐱 Кот', '🐶 Собака'], correct: 0 },
            { q: 'Какой характер быстрее растёт?', answers: ['😊 Активный', '😴 Спокойный'], correct: 0 },
            { q: 'Сколько стоит Яблоко?', answers: ['🍎 5 монет', '🍎 10 монет'], correct: 0 },
            { q: 'Какой предмет лечит?', answers: ['🩹 Аптечка', '🧹 Расчёска'], correct: 0 },
            { q: 'Что повышает настроение?', answers: ['🎮 Игра', '📦 Рюкзак'], correct: 0 }
        ],
        rewardPerCorrect: 8,
        coinsBonus: 20
    },
    memory: {
        name: 'Найди пару',
        icon: '🃏',
        duration: 45,
        pairs: 6,
        rewardPerPair: 10,
        coinsBonus: 30
    },
    reaction: {
        name: 'Реакция',
        icon: '⚡',
        duration: 20,
        targets: 15,
        rewardPerTarget: 5,
        coinsBonus: 25
    },
    typing: {
        name: 'Скорость печати',
        icon: '⌨️',
        duration: 30,
        words: ['кот', 'собака', 'игра', 'еда', 'монета', 'друг', 'любовь', 'счастье'],
        rewardPerWord: 6,
        coinsBonus: 22
    }
};

// Cooldown durations (in ms)
const Cooldowns = {
    quickFeed: 60000,      // 1 minute
    petAction: 30000,      // 30 seconds
    adventure: 300000,      // 5 minutes
    dailyVisit: 86400000    // 24 hours
};

class Pet {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || 'Питомец';
        this.type = data.type || 'cat';
        this.personality = data.personality || 'active';
        this.stats = data.stats || { hp: 100, hunger: 100, mood: 100, xp: 0, level: 1 };
        this.createdAt = data.createdAt || Date.now();
        this.lastInteraction = data.lastInteraction || Date.now();
        this.evolutionStage = data.evolutionStage || 1;
        this.coOwnerId = data.coOwnerId || null; // Для совместных питомцев
    }
    
    generateId() {
        return 'pet_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
    
    getEmoji() {
        return PetTypes[this.type]?.emoji || '🐾';
    }
    
    isAlive() { return this.stats.hp > 0; }
    isHappy() { return this.stats.mood > 70 && this.stats.hunger > 50; }
    isHungry() { return this.stats.hunger < 30; }
    isSad() { return this.stats.mood < 30; }
    needsAttention() { return this.stats.hunger < 50 || this.stats.mood < 50 || this.stats.hp < 50; }
    
    calculateDegradation(lastInteraction) {
        const timeDiff = Date.now() - lastInteraction;
        const minutes = Math.floor(timeDiff / 60000);
        const hungerRate = 0.5 * (Personalities[this.personality]?.foodRate || 1);
        
        this.stats.hunger = Math.max(0, this.stats.hunger - (minutes * hungerRate));
        this.stats.mood = Math.max(0, this.stats.mood - (minutes * 0.3));
        
        let hpDegradation = minutes * 0.2;
        if (this.stats.hunger < 20) hpDegradation *= 2;
        if (this.stats.mood < 20) hpDegradation *= 1.5;
        
        this.stats.hp = Math.max(0, this.stats.hp - hpDegradation);
        return this;
    }
    
    applyAction(action, item = null) {
        let effects = {};
        let eventTitle = '';
        let leveledUp = false;
        
        switch (action) {
            case 'feed':
                const food = item || FoodItems.apple;
                effects = { hunger: food.hunger || 20, hp: food.hp || 5, mood: food.mood || 0, xp: food.xp || 2 };
                eventTitle = `${this.name} кушает ${food.name}! ${food.emoji}`;
                Storage.addQuestProgress('feed');
                break;
                
            case 'play':
                effects = { mood: 15, hunger: -5, xp: 5 };
                eventTitle = `${this.name} весело играет! 🎮`;
                Storage.addQuestProgress('play');
                break;
                
            case 'care':
                effects = { hp: (item?.hp || 5), mood: (item?.mood || 5), xp: (item?.xp || 0) };
                eventTitle = `${this.name} получает внимание! 💕`;
                break;
        }
        
        this.stats.hp = Math.min(100, Math.max(0, this.stats.hp + (effects.hp || 0)));
        this.stats.hunger = Math.min(100, Math.max(0, this.stats.hunger + (effects.hunger || 0)));
        this.stats.mood = Math.min(100, Math.max(0, this.stats.mood + (effects.mood || 0)));
        this.stats.xp += effects.xp || 0;
        
        const oldLevel = this.stats.level;
        this.checkLevelUp();
        leveledUp = this.stats.level > oldLevel;
        
        if (leveledUp) {
            eventTitle = `${this.name} повысил уровень до ${this.stats.level}! 🎊`;
            Storage.addQuestProgress('levelup');
        }
        
        this.lastInteraction = Date.now();
        
        return { effects, eventTitle, leveledUp };
    }
    
    checkLevelUp() {
        const xpNeeded = 100 * this.stats.level;
        while (this.stats.xp >= xpNeeded) {
            this.stats.xp -= xpNeeded;
            this.stats.level++;
            if ([5, 10, 15].includes(this.stats.level)) {
                this.evolutionStage = Math.floor(this.stats.level / 5) + 1;
            }
        }
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            personality: this.personality,
            stats: { ...this.stats },
            createdAt: this.createdAt,
            lastInteraction: this.lastInteraction,
            evolutionStage: this.evolutionStage,
            coOwnerId: this.coOwnerId
        };
    }
}

const PetManager = {
    decayInterval: null,
    eventInterval: null,
    
    init() {
        this.startDecayTimer();
        this.startEventGenerator();
        this.initDailyQuests();
        this.checkDailyStreak();
    },
    
    startDecayTimer() {
        this.decayInterval = setInterval(() => {
            const activePet = Storage.getActivePet();
            if (activePet) {
                const pet = new Pet(activePet);
                pet.calculateDegradation(pet.lastInteraction);
                Storage.updatePet(pet.id, pet.toJSON());
                Events.emit(Events.PET_UPDATED, pet.toJSON());
            }
        }, 60000);
    },
    
    startEventGenerator() {
        this.eventInterval = setInterval(() => {
            const activePet = Storage.getActivePet();
            if (!activePet) return;
            
            const pet = new Pet(activePet);
            const rand = Math.random();
            
            let event = null;
            if (pet.stats.hunger < 30 && rand < 0.3) {
                event = { icon: '🍽️', title: `${pet.name} голодный...`, effect: { hp: -10 } };
            } else if (pet.stats.mood < 30 && rand < 0.2) {
                event = { icon: '😢', title: `${pet.name} грустит...`, effect: { mood: -10 } };
            } else if (pet.stats.hp < 30 && rand < 0.1) {
                event = { icon: '🤒', title: `${pet.name} заболел!`, effect: { hp: -15 } };
            } else if (pet.stats.mood > 80 && rand < 0.2) {
                event = { icon: '🎉', title: `${pet.name} счастлив!`, effect: { mood: 5 } };
            }
            
            if (event && event.effect) {
                if (event.effect.hp) pet.stats.hp = Math.max(0, pet.stats.hp + event.effect.hp);
                if (event.effect.mood) pet.stats.mood = Math.max(0, pet.stats.mood + event.effect.mood);
                pet.checkLevelUp();
                Storage.updatePet(pet.id, pet.toJSON());
                
                Storage.addEvent({
                    petId: pet.id,
                    petName: pet.name,
                    icon: event.icon,
                    title: event.title
                });
                
                Events.emit(Events.PET_UPDATED, pet.toJSON());
            }
        }, 90000);
    },
    
    initDailyQuests() {
        const completed = Storage.get('completedQuests', []);
        const quests = Storage.get('quests', []);
        
        // Инициализируем квест�� если их нет
        if (quests.length === 0) {
            const dailyQuests = QuestTemplates.filter(q => 
                q.id.startsWith('feed_5') || q.id.startsWith('play_3') || q.id.startsWith('spin_wheel')
            );
            Storage.set('quests', dailyQuests.map(q => ({
                ...q,
                progress: 0,
                completed: false
            })), true);
        }
    },
    
    checkDailyStreak() {
        const daily = Storage.getDailyData();
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        
        if (daily.lastVisit) {
            const daysSince = Math.floor((now - daily.lastVisit) / dayMs);
            if (daysSince === 1) {
                // Продолжаем streak
                daily.streak = (daily.streak || 0) + 1;
                // Бонус за streak
                const streakBonus = Math.min(daily.streak * 5, 50);
                if (streakBonus > 0) {
                    Storage.addCoins(streakBonus);
                    Storage.addEvent({
                        icon: '🔥',
                        title: `Серия ${daily.streak} дней! +${streakBonus} монет`,
                        special: true
                    });
                }
            } else if (daysSince > 1) {
                // Сбрасываем streak
                daily.streak = 1;
            }
        } else {
            daily.streak = 1;
        }
        
        daily.lastVisit = now;
        Storage.updateDaily(daily);
        Storage.addQuestProgress('visit');
    },
    
    createPet(config) {
        const pet = new Pet({
            name: config.name,
            type: config.type,
            personality: config.personality,
            coOwnerId: config.coOwnerId || null
        });
        
        Storage.addPet(pet.toJSON());
        Storage.addToInventory(FoodItems.apple, 3);
        Storage.addToInventory(FoodItems.cookie, 2);
        
        Storage.addEvent({
            petId: pet.id,
            petName: pet.name,
            icon: pet.getEmoji(),
            title: `${pet.name} появился! 🎉`
        });
        
        Events.emit(Events.PET_CREATED, pet.toJSON());
        return pet;
    },
    
    feedPet(petId, item) {
        const petData = Storage.getAllPets().find(p => p.id === petId);
        if (!petData) return { success: false };
        
        // Проверяем кулдаун для бесплатной еды
        if (item?.cooldownFree) {
            const cd = Storage.getCooldown('quickFeed');
            if (cd.active) {
                const mins = Math.ceil(cd.remaining / 60000);
                return { success: false, error: `Подожди ${mins} мин!` };
            }
        }
        
        const pet = new Pet(petData);
        const result = pet.applyAction('feed', item);
        
        Storage.updatePet(petId, pet.toJSON());
        if (item) {
            Storage.removeFromInventory(item.id);
        } else {
            // Устанавливаем кулдаун на бесплатное кормление
            Storage.setCooldown('quickFeed', Cooldowns.quickFeed);
        }
        
        Storage.addEvent({
            petId: pet.id,
            petName: pet.name,
            icon: '🍽️',
            title: result.eventTitle
        });
        
        Events.emit(Events.PET_UPDATED, pet.toJSON());
        if (result.leveledUp) {
            Events.emit(Events.LEVEL_UP, { pet: pet.toJSON() });
        }
        
        return { success: true, ...result };
    },
    
    playWithPet(petId, item = null) {
        const petData = Storage.getAllPets().find(p => p.id === petId);
        if (!petData) return { success: false };
        
        const pet = new Pet(petData);
        const result = pet.applyAction('play', item);
        
        Storage.updatePet(petId, pet.toJSON());
        if (item) Storage.removeFromInventory(item.id);
        
        Storage.addEvent({
            petId: pet.id,
            petName: pet.name,
            icon: '🎮',
            title: result.eventTitle
        });
        
        Events.emit(Events.PET_UPDATED, pet.toJSON());
        return { success: true, ...result };
    },
    
    careForPet(petId, item) {
        const petData = Storage.getAllPets().find(p => p.id === petId);
        if (!petData) return { success: false };
        
        const pet = new Pet(petData);
        const result = pet.applyAction('care', item);
        
        Storage.updatePet(petId, pet.toJSON());
        Storage.removeFromInventory(item.id);
        
        Events.emit(Events.PET_UPDATED, pet.toJSON());
        return { success: true, ...result };
    },
    
    // Колесо удачи
    spinWheel() {
        if (!Storage.canSpinWheel()) {
            return { success: false, error: 'Колесо уже крутили сегодня!' };
        }
        
        // Взвешенный выбор приза
        const totalWeight = WheelPrizes.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;
        let prize = WheelPrizes[WheelPrizes.length - 1];
        
        for (const p of WheelPrizes) {
            random -= p.weight;
            if (random <= 0) {
                prize = p;
                break;
            }
        }
        
        // Выдаём приз
        switch (prize.type) {
            case 'coins':
                Storage.addCoins(prize.amount);
                Storage.addEvent({
                    icon: '🪙',
                    title: `Выиграл ${prize.amount} монет! ${prize.emoji}`,
                    special: true
                });
                Storage.addQuestProgress('earn', prize.amount);
                Storage.addQuestProgress('spin');
                break;
            case 'xp':
                const pet = Storage.getActivePet();
                if (pet) {
                    const p = new Pet(pet);
                    p.stats.xp += prize.amount;
                    p.checkLevelUp();
                    Storage.updatePet(p.id, p.toJSON());
                }
                break;
            case 'item':
                Storage.addToInventory(prize.item, prize.count);
                Storage.addEvent({
                    icon: prize.item.emoji,
                    title: `Получил ${prize.item.name} ×${prize.count}!`,
                    special: true
                });
                break;
        }
        
        // Обновляем daily данные
        const daily = Storage.getDailyData();
        daily.lastSpin = Date.now();
        daily.spinCount++;
        Storage.updateDaily(daily);
        
        return { success: true, prize };
    },
    
    // Проверка и выдача награды за квест
    claimQuestReward(questId) {
        const quests = Storage.get('quests', []);
        const quest = quests.find(q => q.id === questId);
        
        if (!quest || !quest.completed) return { success: false };
        
        Storage.addCoins(quest.reward);
        Storage.completeQuest(questId);
        
        Storage.addEvent({
            icon: '🏆',
            title: `Квест "${quest.title}" завершён! +${quest.reward} монет`,
            special: true
        });
        
        return { success: true, reward: quest.reward };
    },
    
    getPetStatus(petData) {
        const pet = new Pet(petData);
        if (!pet.isAlive()) return '💀';
        if (pet.isHappy()) return '😊';
        if (pet.needsAttention()) return '😟';
        if (pet.isHungry()) return '🍽️';
        if (pet.isSad()) return '😢';
        return '😌';
    },
    
    destroy() {
        if (this.decayInterval) clearInterval(this.decayInterval);
        if (this.eventInterval) clearInterval(this.eventInterval);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Pet, PetManager, PetTypes, Personalities, FoodItems, CareItems, WheelPrizes, QuestTemplates, CoinGames, Cooldowns };
}
