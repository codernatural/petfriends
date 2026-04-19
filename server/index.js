/**
 * PetFriends Server - Full API Backend
 * VPS Deployment Ready
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-key';
const HOST = '0.0.0.0'; // Слушать на всех интерфейсах

// Простая in-memory база данных
const db = {
    users: new Map(),
    pets: new Map(),
    quests: new Map(),
    inventory: new Map(),
    events: new Map(),
    cooldowns: new Map(),
    invites: new Map() // Ключ: код приглашения, Значение: { petId, userId, createdAt }
};

// ============ TELEGRAM AUTH ============
function verifyTelegramData(initData, botToken) {
    if (!botToken || !initData) return true;
    
    try {
        const params = new URLSearchParams(initData);
        const hash = params.get('hash');
        params.delete('hash');
        
        const dataCheckString = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        
        const secretKey = crypto.createHmac('sha256', botToken).update('WebAppData').digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
        
        return hash === calculatedHash;
    } catch (e) {
        console.error('Auth error:', e.message);
        return false;
    }
}

function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

// ============ AUTH ============
app.post('/api/auth', (req, res) => {
    const { initData, bot_token } = req.body;
    
    // Верификация (опционально)
    if (bot_token && !verifyTelegramData(initData, bot_token)) {
        return res.status(403).json({ error: 'Invalid data' });
    }
    
    // Парсим данные пользователя
    let userData = { id: Date.now(), first_name: 'User', username: 'user' };
    
    if (initData) {
        try {
            const params = new URLSearchParams(initData);
            const user = JSON.parse(params.get('user') || '{}');
            if (user.id) userData = user;
        } catch (e) {}
    }
    
    // Найти или создать пользователя
    let user = Array.from(db.users.values()).find(u => u.telegram_id === userData.id);
    
    if (!user) {
        user = {
            _id: crypto.randomUUID(),
            telegram_id: userData.id,
            telegram_username: userData.username || '',
            telegram_first_name: userData.first_name || '',
            coins: 100,
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
            streak: { current: 0, best: 0, last_visit: null }
        };
        db.users.set(user._id, user);
    }
    
    // Обновить streak
    user.last_active = new Date().toISOString();
    const dayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    if (user.streak.last_visit) {
        const days = Math.floor((now - new Date(user.streak.last_visit).getTime()) / dayMs);
        if (days === 1) user.streak.current++;
        else if (days > 1) user.streak.current = 1;
    } else {
        user.streak.current = 1;
    }
    
    if (user.streak.current > user.streak.best) user.streak.best = user.streak.current;
    user.streak.last_visit = new Date().toISOString();
    
    db.users.set(user._id, user);
    
    res.json({
        token: generateToken(user._id),
        user: {
            id: user._id,
            name: user.telegram_first_name,
            username: user.telegram_username,
            coins: user.coins,
            streak: user.streak.current
        }
    });
});

app.get('/api/user', authMiddleware, (req, res) => {
    const user = db.users.get(req.userId);
    if (!user) return res.status(404).json({ error: 'Not found' });
    
    res.json({
        id: user._id,
        name: user.telegram_first_name,
        username: user.telegram_username,
        coins: user.coins,
        streak: user.streak.current
    });
});

// ============ PETS ============
app.get('/api/pets', authMiddleware, (req, res) => {
    const pets = Array.from(db.pets.values()).filter(p => p.owner_ids.includes(req.userId));
    res.json(pets);
});

app.get('/api/pets/shared', authMiddleware, (req, res) => {
    const pets = Array.from(db.pets.values()).filter(p => 
        p.owner_ids.length > 1 && p.owner_ids.includes(req.userId)
    );
    res.json(pets);
});

app.post('/api/pets', authMiddleware, (req, res) => {
    const { name, type, personality } = req.body;
    
    const pet = {
        _id: crypto.randomUUID(),
        owner_ids: [req.userId],
        name: name || 'Питомец',
        type: type || 'cat',
        personality: personality || 'active',
        stats: { hp: 100, hunger: 100, mood: 100, xp: 0, level: 1 },
        created_at: new Date().toISOString(),
        last_interaction: new Date().toISOString()
    };
    
    db.pets.set(pet._id, pet);
    
    // Стартовые предметы
    addToInventory(req.userId, 'apple', 3);
    
    res.json(pet);
});

app.put('/api/pets/:id', authMiddleware, (req, res) => {
    const pet = db.pets.get(req.params.id);
    if (!pet) return res.status(404).json({ error: 'Not found' });
    if (!pet.owner_ids.includes(req.userId)) return res.status(403).json({ error: 'Forbidden' });
    
    const { action, value } = req.body;
    
    switch (action) {
        case 'feed':
            pet.stats.hunger = Math.min(100, pet.stats.hunger + (value?.hunger || 20));
            pet.stats.hp = Math.min(100, pet.stats.hp + (value?.hp || 5));
            pet.stats.xp += 2;
            break;
        case 'play':
            pet.stats.mood = Math.min(100, pet.stats.mood + (value?.mood || 15));
            pet.stats.xp += 5;
            break;
        case 'care':
            pet.stats.hp = Math.min(100, pet.stats.hp + (value?.hp || 10));
            pet.stats.mood = Math.min(100, pet.stats.mood + (value?.mood || 5));
            break;
    }
    
    // Level up
    const xpNeeded = 100 * pet.stats.level;
    while (pet.stats.xp >= xpNeeded) {
        pet.stats.xp -= xpNeeded;
        pet.stats.level++;
    }
    
    pet.last_interaction = new Date().toISOString();
    db.pets.set(pet._id, pet);
    
    res.json(pet);
});

app.delete('/api/pets/:id', authMiddleware, (req, res) => {
    const pet = db.pets.get(req.params.id);
    if (!pet || !pet.owner_ids.includes(req.userId)) {
        return res.status(403).json({ error: 'Cannot delete' });
    }
    db.pets.delete(req.params.id);
    res.json({ success: true });
});

// ============ INVITES ============
app.post('/api/pets/:id/invite', authMiddleware, (req, res) => {
    const pet = db.pets.get(req.params.id);
    if (!pet) return res.status(404).json({ error: 'Pet not found' });
    if (!pet.owner_ids.includes(req.userId)) return res.status(403).json({ error: 'Not owner' });
    
    // Генерируем код
    const code = crypto.randomUUID().substring(0, 8).toUpperCase();
    
    db.invites.set(code, {
        petId: pet._id,
        ownerId: req.userId,
        createdAt: Date.now()
    });
    
    res.json({ code, petName: pet.name });
});

app.post('/api/join', authMiddleware, (req, res) => {
    const { code } = req.body;
    
    const invite = db.invites.get(code?.toUpperCase());
    if (!invite) return res.status(404).json({ error: 'Invalid code' });
    
    const pet = db.pets.get(invite.petId);
    if (!pet) return res.status(404).json({ error: 'Pet not found' });
    
    if (pet.owner_ids.includes(req.userId)) {
        return res.status(400).json({ error: 'Already owner' });
    }
    
    // Добавляем нового владельца
    pet.owner_ids.push(req.userId);
    db.pets.set(pet._id, pet);
    
    // Удаляем использованный код
    db.invites.delete(code.toUpperCase());
    
    res.json({ pet, success: true });
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

app.get('/api/inventory', authMiddleware, (req, res) => {
    const items = Array.from(db.inventory.values()).filter(i => i.user_id === req.userId);
    res.json(items);
});

app.post('/api/inventory', authMiddleware, (req, res) => {
    const { item_id, count } = req.body;
    addToInventory(req.userId, item_id, count || 1);
    res.json({ success: true });
});

app.delete('/api/inventory/:itemId', authMiddleware, (req, res) => {
    const key = `${req.userId}:${req.params.itemId}`;
    const item = db.inventory.get(key);
    
    if (item && item.count > 0) {
        item.count--;
        if (item.count <= 0) db.inventory.delete(key);
        else db.inventory.set(key, item);
    }
    
    res.json({ success: true });
});

// ============ WHEEL ============
app.post('/api/wheel/spin', authMiddleware, (req, res) => {
    const key = `wheel:${req.userId}`;
    const lastSpin = db.cooldowns.get(key);
    
    if (lastSpin && Date.now() - lastSpin < 24 * 60 * 60 * 1000) {
        return res.status(400).json({ error: 'Already spun today' });
    }
    
    db.cooldowns.set(key, Date.now());
    
    const prizes = [
        { type: 'coins', amount: 10 },
        { type: 'coins', amount: 25 },
        { type: 'coins', amount: 50 },
        { type: 'item', item: 'apple', count: 3 },
        { type: 'xp', amount: 30 }
    ];
    
    const prize = prizes[Math.floor(Math.random() * prizes.length)];
    
    if (prize.type === 'coins') {
        const user = db.users.get(req.userId);
        user.coins += prize.amount;
        db.users.set(user._id, user);
    } else if (prize.type === 'item') {
        addToInventory(req.userId, prize.item, prize.count);
    }
    
    res.json({ prize });
});

// ============ COINS ============
app.post('/api/coins', authMiddleware, (req, res) => {
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
app.get('/api/events', authMiddleware, (req, res) => {
    const events = Array.from(db.events.values())
        .filter(e => e.user_id === req.userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 50);
    
    res.json(events);
});

app.post('/api/events', authMiddleware, (req, res) => {
    const { pet_id, icon, title, is_special } = req.body;
    
    const event = {
        _id: crypto.randomUUID(),
        pet_id,
        user_id: req.userId,
        icon,
        title,
        is_special: is_special || false,
        created_at: new Date().toISOString()
    };
    
    db.events.set(event._id, event);
    res.json(event);
});

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        uptime: process.uptime(),
        users: db.users.size,
        pets: db.pets.size
    });
});

app.get('/', (req, res) => {
    res.send('🐾 PetFriends API Server Running!');
});

// ============ START ============
app.listen(PORT, HOST, () => {
    console.log(`🐾 PetFriends API running on http://${HOST}:${PORT}`);
    console.log(`📡 Accepting connections from anywhere`);
});
