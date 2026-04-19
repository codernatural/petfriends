/**
 * PetFriends Server - API Backend
 * Express + Telegram WebApp Auth + Shared Pets
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// ============ IN-MEMORY DATABASE (для демо, заменить на MongoDB в проде) ============
const db = {
    users: new Map(),
    pets: new Map(),
    quests: new Map(),
    inventory: new Map(),
    events: new Map(),
    dailyRewards: new Map(),
    friends: new Map(),
    cooldowns: new Map()
};

// ============ TELEGRAM AUTH ============
function verifyTelegramWebAppData(initData) {
    if (!TELEGRAM_BOT_TOKEN) {
        console.log('No bot token configured, skipping verification');
        return true;
    }
    
    try {
        const params = new URLSearchParams(initData);
        const hash = params.get('hash');
        params.delete('hash');
        
        const dataCheckString = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        
        const secretKey = crypto.createHmac('sha256', TELEGRAM_BOT_TOKEN).update('WebAppData');
        const calculatedHash = crypto.createHmac('sha256', secretKey.digest()).update(dataCheckString).digest('hex');
        
        return hash === calculatedHash;
    } catch (e) {
        console.error('Telegram auth error:', e);
        return false;
    }
}

function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

function verifyToken(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'No token' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

// ============ USER ROUTES ============
app.post('/api/auth', (req, res) => {
    const { initData } = req.body;
    
    if (!verifyTelegramWebAppData(initData)) {
        return res.status(403).json({ error: 'Invalid Telegram data' });
    }
    
    // Parse init data
    const params = new URLSearchParams(initData);
    const userData = JSON.parse(params.get('user') || '{}');
    
    if (!userData.id) {
        return res.status(400).json({ error: 'No user data' });
    }
    
    const telegramId = userData.id;
    
    // Find or create user
    let user = Array.from(db.users.values()).find(u => u.telegram_id === telegramId);
    
    if (!user) {
        user = {
            _id: crypto.randomUUID(),
            telegram_id: telegramId,
            telegram_username: userData.username || '',
            telegram_first_name: userData.first_name || '',
            telegram_photo_url: userData.photo_url || '',
            coins: 100,
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
            streak: { current: 0, best: 0, last_visit: null }
        };
        db.users.set(user._id, user);
    }
    
    // Update last active
    user.last_active = new Date().toISOString();
    
    // Check streak
    const dayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    if (user.streak.last_visit) {
        const daysSince = Math.floor((now - new Date(user.streak.last_visit).getTime()) / dayMs);
        if (daysSince === 1) {
            user.streak.current++;
        } else if (daysSince > 1) {
            user.streak.current = 1;
        }
    } else {
        user.streak.current = 1;
    }
    
    if (user.streak.current > user.streak.best) {
        user.streak.best = user.streak.current;
    }
    
    user.streak.last_visit = new Date().toISOString();
    db.users.set(user._id, user);
    
    const token = generateToken(user._id);
    
    res.json({
        token,
        user: {
            id: user._id,
            name: user.telegram_first_name,
            username: user.telegram_username,
            coins: user.coins,
            streak: user.streak.current
        }
    });
});

app.get('/api/user', verifyToken, (req, res) => {
    const user = db.users.get(req.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
        id: user._id,
        name: user.telegram_first_name,
        username: user.telegram_username,
        coins: user.coins,
        streak: user.streak.current
    });
});

// ============ PETS ROUTES ============
app.get('/api/pets', verifyToken, (req, res) => {
    const userPets = Array.from(db.pets.values()).filter(p => 
        p.owner_ids.includes(req.userId)
    );
    
    res.json(userPets);
});

app.get('/api/pets/shared', verifyToken, (req, res) => {
    // Питомцы, которыми владеют несколько пользователей
    const sharedPets = Array.from(db.pets.values()).filter(p => 
        p.owner_ids.length > 1 && p.owner_ids.includes(req.userId)
    );
    
    res.json(sharedPets);
});

app.post('/api/pets', verifyToken, (req, res) => {
    const { name, type, personality } = req.body;
    
    const pet = {
        _id: crypto.randomUUID(),
        owner_ids: [req.userId],
        name: name || 'Питомец',
        type: type || 'cat',
        personality: personality || 'active',
        stats: { hp: 100, hunger: 100, mood: 100, xp: 0, level: 1 },
        evolution_stage: 1,
        created_at: new Date().toISOString(),
        last_interaction: new Date().toISOString()
    };
    
    db.pets.set(pet._id, pet);
    
    // Добавить стартовые предметы
    addToInventory(req.userId, 'apple', 3);
    addToInventory(req.userId, 'cookie', 2);
    
    res.json(pet);
});

app.put('/api/pets/:id', verifyToken, (req, res) => {
    const pet = db.pets.get(req.params.id);
    
    if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
    }
    
    if (!pet.owner_ids.includes(req.userId)) {
        return res.status(403).json({ error: 'Not your pet' });
    }
    
    const { action, item } = req.body;
    
    if (action === 'feed') {
        pet.stats.hunger = Math.min(100, pet.stats.hunger + (item?.hunger || 20));
        pet.stats.hp = Math.min(100, pet.stats.hp + (item?.hp || 5));
        pet.stats.mood = Math.min(100, pet.stats.mood + (item?.mood || 0));
        pet.stats.xp += item?.xp || 2;
    } else if (action === 'play') {
        pet.stats.mood = Math.min(100, pet.stats.mood + (item?.mood || 15));
        pet.stats.hunger = Math.max(0, pet.stats.hunger - (item?.hunger || 5));
        pet.stats.xp += 5;
    } else if (action === 'care') {
        pet.stats.hp = Math.min(100, pet.stats.hp + (item?.hp || 5));
        pet.stats.mood = Math.min(100, pet.stats.mood + (item?.mood || 5));
    }
    
    // Level up check
    const xpNeeded = 100 * pet.stats.level;
    while (pet.stats.xp >= xpNeeded) {
        pet.stats.xp -= xpNeeded;
        pet.stats.level++;
        if ([5, 10, 15].includes(pet.stats.level)) {
            pet.evolution_stage = Math.floor(pet.stats.level / 5) + 1;
        }
    }
    
    pet.last_interaction = new Date().toISOString();
    db.pets.set(pet._id, pet);
    
    res.json(pet);
});

app.post('/api/pets/:id/invite', verifyToken, (req, res) => {
    const pet = db.pets.get(req.params.id);
    
    if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
    }
    
    if (!pet.owner_ids.includes(req.userId)) {
        return res.status(403).json({ error: 'Not your pet' });
    }
    
    // Создаём приглашение (в реальном приложении - через Telegram бот)
    const inviteCode = crypto.randomUUID().substring(0, 8).toUpperCase();
    
    res.json({
        invite_code: inviteCode,
        pet_name: pet.name
    });
});

app.post('/api/pets/join', verifyToken, (req, res) => {
    const { inviteCode } = req.body;
    
    // Найти питомца по коду приглашения (упрощённо)
    // В реальном приложении - база приглашений
    const allPets = Array.from(db.pets.values());
    const pet = allPets.find(p => p.invite_code === inviteCode);
    
    if (!pet) {
        return res.status(404).json({ error: 'Invalid invite code' });
    }
    
    if (pet.owner_ids.includes(req.userId)) {
        return res.status(400).json({ error: 'Already an owner' });
    }
    
    pet.owner_ids.push(req.userId);
    delete pet.invite_code;
    db.pets.set(pet._id, pet);
    
    res.json(pet);
});

// ============ INVENTORY ============
function addToInventory(userId, itemId, count) {
    const key = `${userId}:${itemId}`;
    const existing = db.inventory.get(key);
    
    if (existing) {
        existing.count += count;
        db.inventory.set(key, existing);
    } else {
        db.inventory.set(key, {
            _id: crypto.randomUUID(),
            user_id: userId,
            item_id: itemId,
            count: count
        });
    }
}

app.get('/api/inventory', verifyToken, (req, res) => {
    const userInventory = Array.from(db.inventory.values())
        .filter(i => i.user_id === req.userId);
    
    res.json(userInventory);
});

app.post('/api/inventory', verifyToken, (req, res) => {
    const { item_id, count } = req.body;
    addToInventory(req.userId, item_id, count || 1);
    res.json({ success: true });
});

app.delete('/api/inventory/:itemId', verifyToken, (req, res) => {
    const key = `${req.userId}:${req.params.itemId}`;
    const item = db.inventory.get(key);
    
    if (!item || item.count < 1) {
        return res.status(400).json({ error: 'No such item' });
    }
    
    item.count--;
    
    if (item.count <= 0) {
        db.inventory.delete(key);
    } else {
        db.inventory.set(key, item);
    }
    
    res.json({ success: true });
});

// ============ QUESTS ============
app.get('/api/quests', verifyToken, (req, res) => {
    const userQuests = Array.from(db.quests.values())
        .filter(q => q.user_id === req.userId);
    
    res.json(userQuests);
});

app.post('/api/quests/progress', verifyToken, (req, res) => {
    const { action, amount } = req.body;
    
    let quest = Array.from(db.quests.values())
        .find(q => q.user_id === req.userId && q.action === action && !q.completed);
    
    if (!quest) {
        // Создать новый квест
        quest = {
            _id: crypto.randomUUID(),
            user_id: req.userId,
            action: action,
            target: getQuestTarget(action),
            progress: 0,
            completed: false,
            reward: getQuestReward(action)
        };
        db.quests.set(quest._id, quest);
    }
    
    quest.progress += amount || 1;
    
    if (quest.progress >= quest.target && !quest.completed) {
        quest.completed = true;
        quest.completed_at = new Date().toISOString();
        
        // Выдать награду
        const user = db.users.get(req.userId);
        if (user) {
            user.coins += quest.reward;
            db.users.set(user._id, user);
        }
    }
    
    db.quests.set(quest._id, quest);
    
    res.json(quest);
});

function getQuestTarget(action) {
    const targets = { feed: 5, play: 3, visit: 3, earn: 100, spin: 1, levelup: 1 };
    return targets[action] || 1;
}

function getQuestReward(action) {
    const rewards = { feed: 15, play: 20, visit: 30, earn: 50, spin: 10, levelup: 40 };
    return rewards[action] || 10;
}

// ============ WHEEL OF FORTUNE ============
app.post('/api/wheel/spin', verifyToken, (req, res) => {
    const key = `wheel:${req.userId}`;
    const lastSpin = db.cooldowns.get(key);
    
    if (lastSpin && Date.now() - lastSpin < 24 * 60 * 60 * 1000) {
        return res.status(400).json({ error: 'Already spun today' });
    }
    
    db.cooldowns.set(key, Date.now());
    
    // Приз
    const prizes = [
        { type: 'coins', amount: 10 },
        { type: 'coins', amount: 25 },
        { type: 'coins', amount: 50 },
        { type: 'coins', amount: 100 },
        { type: 'item', item: 'apple', count: 3 },
        { type: 'item', item: 'cookie', count: 2 },
        { type: 'xp', amount: 50 }
    ];
    
    const prize = prizes[Math.floor(Math.random() * prizes.length)];
    
    if (prize.type === 'coins') {
        const user = db.users.get(req.userId);
        user.coins += prize.amount;
        db.users.set(user._id, user);
    } else if (prize.type === 'item') {
        addToInventory(req.userId, prize.item, prize.count);
    } else if (prize.type === 'xp') {
        // Добавить XP всем питомцам
        const userPets = Array.from(db.pets.values()).filter(p => p.owner_ids.includes(req.userId));
        userPets.forEach(pet => {
            pet.stats.xp += prize.amount;
        });
    }
    
    res.json({ prize });
});

// ============ COINS ============
app.post('/api/coins', verifyToken, (req, res) => {
    const { amount } = req.body;
    const user = db.users.get(req.userId);
    
    if (amount > 0) {
        user.coins += amount;
    } else if (amount < 0 && user.coins >= Math.abs(amount)) {
        user.coins += amount;
    } else {
        return res.status(400).json({ error: 'Not enough coins' });
    }
    
    db.users.set(user._id, user);
    res.json({ coins: user.coins });
});

// ============ EVENTS ============
app.get('/api/events', verifyToken, (req, res) => {
    const userEvents = Array.from(db.events.values())
        .filter(e => e.user_id === req.userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 50);
    
    res.json(userEvents);
});

app.post('/api/events', verifyToken, (req, res) => {
    const { pet_id, icon, title, is_special, is_warning } = req.body;
    
    const event = {
        _id: crypto.randomUUID(),
        pet_id: pet_id,
        user_id: req.userId,
        icon: icon,
        title: title,
        is_special: is_special || false,
        is_warning: is_warning || false,
        created_at: new Date().toISOString()
    };
    
    db.events.set(event._id, event);
    res.json(event);
});

// ============ START ============
app.listen(PORT, () => {
    console.log(`🐾 PetFriends API running on port ${PORT}`);
});
