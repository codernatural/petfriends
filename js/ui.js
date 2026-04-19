/**
 * PetFriends - UI Module v3.2
 * Profile + Real Shared Pets
 */

const UI = {
    currentScreen: 'home',
    
    init() {
        this.bindEvents();
        this.renderScreen('home');
        this.updateCoinsDisplay();
        this.initUserProfile();
        this.initAPI();
    },
    
    async initAPI() {
        const connected = await API.init();
        if (connected) {
            const authed = await API.auth();
            if (authed.success) {
                console.log('🐾 API авторизован');
                await this.syncFromServer();
            }
        }
    },
    
    async syncFromServer() {
        if (!API.connected) return;
        
        const pets = await API.getPets();
        const sharedPets = await API.getSharedPets();
        const inventory = await API.getInventory();
        
        if (pets) {
            Storage.set('pets', pets);
        }
        if (sharedPets) {
            Storage.set('sharedPets', sharedPets);
        }
        if (inventory) {
            Storage.set('inventory', inventory);
        }
    },
    
    bindEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.navigateTo(e.currentTarget.dataset.screen);
            });
        });
        
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') this.closeModal();
        });
        
        document.getElementById('profile-btn').addEventListener('click', () => this.navigateTo('profile'));
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        document.getElementById('coins-btn').addEventListener('click', () => {
            this.showToast(`🪙 ${Storage.getCoins()} монет`, 'default');
        });
        
        Events.on(Events.PET_UPDATED, () => this.updateActivePetDisplay());
        Events.on(Events.COINS_CHANGED, () => this.updateCoinsDisplay());
        Events.on(Events.LEVEL_UP, (data) => this.showLevelUp(data));
    },
    
    initUserProfile() {
        const tgUser = TelegramAPI.getUser();
        Storage.setUser(tgUser);
    },
    
    navigateTo(screen) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.screen === screen);
        });
        this.currentScreen = screen;
        this.renderScreen(screen);
        TelegramAPI.haptic('light');
    },
    
    renderScreen(screen) {
        const main = document.getElementById('main-content');
        const template = document.getElementById(`tpl-${screen}`);
        if (!template) return;
        
        main.innerHTML = '';
        main.appendChild(template.content.cloneNode(true));
        
        switch (screen) {
            case 'home': this.initHomeScreen(); break;
            case 'pets': this.initPetsScreen(); break;
            case 'inventory': this.initInventoryScreen(); break;
            case 'wheel': this.initWheelScreen(); break;
            case 'quests': this.initQuestsScreen(); break;
            case 'games': this.initGamesScreen(); break;
            case 'profile': this.initProfileScreen(); break;
        }
    },
    
    // ========== HOME ==========
    initHomeScreen() {
        const pet = Storage.getActivePet();
        
        if (!pet) {
            document.getElementById('no-pet-message').style.display = 'flex';
            document.getElementById('pet-display')?.style.setProperty('display', 'none');
            document.getElementById('quick-actions')?.style.setProperty('display', 'none');
            document.getElementById('create-first-pet-btn')?.addEventListener('click', () => this.showCreatePetModal());
            return;
        }
        
        this.updateActivePetDisplay();
        this.bindActionButtons();
        
        const daily = Storage.getDailyData();
        const streakEl = document.getElementById('streak-display');
        if (streakEl && daily.streak > 0) {
            streakEl.style.display = 'flex';
            streakEl.querySelector('span').textContent = `🔥 ${daily.streak} дней`;
        }
        
        const coOwnerEl = document.getElementById('co-owner-info');
        if (coOwnerEl) {
            const shared = Storage.getSharedPets();
            coOwnerEl.style.display = shared.find(p => p.id === pet.id) ? 'flex' : 'none';
        }
    },
    
    updateActivePetDisplay() {
        const pet = Storage.getActivePet();
        if (!pet) return;
        
        const avatar = document.getElementById('active-pet-avatar');
        if (avatar) {
            avatar.textContent = PetTypes[pet.type]?.emoji || '🐾';
            avatar.className = 'pet-avatar';
            if (pet.stats?.mood > 80) avatar.classList.add('happy');
            else if (pet.stats?.hunger < 30) avatar.classList.add('sad');
        }
        
        document.getElementById('pet-name').textContent = pet.name;
        document.getElementById('pet-level').textContent = `Ур. ${pet.stats?.level || 1}`;
        document.getElementById('pet-status-indicator').textContent = PetManager.getPetStatus(pet);
        
        this.updateStatBar('hp', pet.stats?.hp);
        this.updateStatBar('hunger', pet.stats?.hunger);
        this.updateStatBar('mood', pet.stats?.mood);
        this.updateXPBar(pet.stats?.xp, pet.stats?.level);
    },
    
    updateStatBar(stat, value) {
        const bar = document.getElementById(`stat-${stat}`);
        const val = document.getElementById(`stat-${stat}-value`);
        if (bar) bar.style.width = `${Math.max(0, Math.min(100, value || 0))}%`;
        if (val) val.textContent = Math.round(value || 0);
    },
    
    updateXPBar(xp, level) {
        const bar = document.getElementById('stat-xp');
        const val = document.getElementById('stat-xp-value');
        const needed = 100 * (level || 1);
        if (bar) bar.style.width = `${((xp || 0) / needed) * 100}%`;
        if (val) val.textContent = `${Math.round(xp || 0)}/${needed}`;
    },
    
    bindActionButtons() {
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleAction(btn.dataset.action);
                TelegramAPI.haptic('medium');
            });
        });
    },
    
    handleAction(action) {
        switch (action) {
            case 'feed': this.showFeedModal(); break;
            case 'play': this.showPlayModal(); break;
            case 'care': this.showCareModal(); break;
        }
    },
    
    // ========== PROFILE ==========
    async initProfileScreen() {
        const user = Storage.getUser();
        const daily = Storage.getDailyData();
        
        document.getElementById('profile-name').textContent = user.first_name || 'Друг';
        document.getElementById('profile-username').textContent = '@' + (user.username || 'user');
        document.getElementById('profile-coins').textContent = Storage.getCoins();
        document.getElementById('profile-pets').textContent = Storage.getAllPets().length + Storage.getSharedPets().length;
        document.getElementById('profile-streak').textContent = daily.streak || 0;
        
        // Invite button
        document.getElementById('invite-friend-btn')?.addEventListener('click', () => {
            document.getElementById('invite-section').style.display = 
                document.getElementById('invite-section').style.display === 'none' ? 'block' : 'none';
            document.getElementById('join-section').style.display = 'none';
            
            // Generate invite code via API
            this.generateInviteCode();
        });
        
        // Join button
        document.getElementById('join-pet-btn')?.addEventListener('click', () => {
            document.getElementById('join-section').style.display = 
                document.getElementById('join-section').style.display === 'none' ? 'block' : 'none';
            document.getElementById('invite-section').style.display = 'none';
        });
        
        // Copy code
        document.getElementById('copy-code-btn')?.addEventListener('click', () => {
            const code = document.getElementById('invite-code').textContent;
            navigator.clipboard?.writeText(code);
            this.showToast('Код скопирован!', 'success');
        });
        
        // Join by code
        document.getElementById('do-join-btn')?.addEventListener('click', () => {
            this.joinByCode();
        });
    },
    
    async generateInviteCode() {
        const pet = Storage.getActivePet();
        if (!pet) {
            this.showToast('Сначала создай питомца!', 'warning');
            return;
        }
        
        if (API.connected) {
            const result = await API.inviteFriend(pet.id);
            if (result?.code) {
                document.getElementById('invite-code').textContent = result.code;
                return;
            }
        }
        
        // Fallback: generate local code
        const code = crypto.randomUUID().substring(0, 8).toUpperCase();
        document.getElementById('invite-code').textContent = code;
        
        // Save to localStorage for demo
        Storage.set(`invite_${pet.id}`, code);
    },
    
    async joinByCode() {
        const code = document.getElementById('join-code-input')?.value?.trim().toUpperCase();
        if (!code) {
            this.showToast('Введите код', 'warning');
            return;
        }
        
        if (API.connected) {
            const result = await API.joinByCode(code);
            if (result?.pet) {
                Storage.addToSharedPets(result.pet);
                this.showToast(`Присоединился к ${result.pet.name}! 👥`, 'success');
                document.getElementById('join-code-input').value = '';
                this.navigateTo('pets');
                return;
            } else if (result?.error) {
                this.showToast(result.error, 'warning');
                return;
            }
        }
        
        // Offline mode
        this.showToast('Сервер недоступен. Попробуй позже!', 'warning');
    },
    
    // ========== PETS ==========
    initPetsScreen() {
        this.renderPetsGrid();
        this.renderSharedPetsGrid();
        
        document.getElementById('add-pet-btn')?.addEventListener('click', () => this.showCreatePetModal());
        document.getElementById('join-shared-btn')?.addEventListener('click', () => this.navigateTo('profile'));
    },
    
    renderPetsGrid() {
        const grid = document.getElementById('pets-grid');
        const empty = document.getElementById('pets-empty');
        const pets = Storage.getAllPets();
        const activeId = Storage.get('activePetId');
        
        if (!grid) return;
        
        if (pets.length === 0) {
            grid.style.display = 'none';
            empty.style.display = 'flex';
            return;
        }
        
        grid.style.display = 'grid';
        empty.style.display = 'none';
        
        grid.innerHTML = pets.map(p => `
            <div class="pet-card ${p.id === activeId ? 'active' : ''}" data-pet="${p.id}">
                <span class="pet-card-icon">${PetTypes[p.type]?.emoji || '🐾'}</span>
                <span class="pet-card-name">${p.name}</span>
                <span class="pet-card-level">Ур. ${p.stats?.level || 1}</span>
            </div>
        `).join('');
        
        grid.querySelectorAll('.pet-card').forEach(card => {
            card.addEventListener('click', () => {
                Storage.setActivePet(card.dataset.pet);
                this.navigateTo('home');
            });
        });
    },
    
    renderSharedPetsGrid() {
        const grid = document.getElementById('shared-pets-grid');
        const empty = document.getElementById('shared-empty');
        const shared = Storage.getSharedPets();
        
        if (!grid) return;
        
        if (shared.length === 0) {
            grid.style.display = 'none';
            empty.style.display = 'flex';
            return;
        }
        
        grid.style.display = 'grid';
        empty.style.display = 'none';
        
        grid.innerHTML = shared.map(p => `
            <div class="pet-card shared" data-pet="${p.id}">
                <span class="pet-card-icon">${PetTypes[p.type]?.emoji || '🐾'}</span>
                <span class="pet-card-name">${p.name}</span>
                <span class="pet-card-level">👥 Совместный</span>
            </div>
        `).join('');
        
        grid.querySelectorAll('.pet-card').forEach(card => {
            card.addEventListener('click', () => {
                Storage.setActivePet(card.dataset.pet);
                this.navigateTo('home');
            });
        });
    },
    
    // ========== CREATE PET ==========
    showCreatePetModal() {
        this.openModal('Создать питомца', `
            <div class="create-pet-flow" id="create-flow">
                <div class="step" data-step="1">
                    <h3 class="step-title">Выбери вид</h3>
                    <div class="pet-types-grid">
                        ${Object.entries(PetTypes).map(([t, d]) => `
                            <button class="pet-type-btn" data-type="${t}">
                                <span class="pet-type-icon">${d.emoji}</span>
                                <span class="pet-type-name">${d.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="step" data-step="2" style="display: none;">
                    <h3 class="step-title">Имя питомца</h3>
                    <input type="text" class="name-input" id="pet-name-input" placeholder="Введи имя..." maxlength="15">
                </div>
                <div class="step" data-step="3" style="display: none;">
                    <h3 class="step-title">Характер</h3>
                    <div class="personality-options">
                        ${Object.entries(Personalities).map(([k, d]) => `
                            <button class="personality-btn" data-pers="${k}">
                                <span class="personality-icon">${d.emoji}</span>
                                <span class="personality-name">${d.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="create-pet-nav">
                    <button class="btn secondary" id="create-back" style="display: none;">←</button>
                    <button class="btn primary" id="create-next">Далее →</button>
                    <button class="btn accent hidden" id="create-finish">Создать!</button>
                </div>
            </div>
        `);
        
        this.bindCreateFlow();
    },
    
    bindCreateFlow() {
        const flow = document.getElementById('create-flow');
        let state = { step: 1, type: null, name: '', personality: null };
        
        flow.querySelectorAll('.pet-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                flow.querySelectorAll('.pet-type-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                state.type = btn.dataset.type;
            });
        });
        
        flow.querySelectorAll('.personality-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                flow.querySelectorAll('.personality-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                state.personality = btn.dataset.pers;
            });
        });
        
        document.getElementById('create-back')?.addEventListener('click', () => {
            state.step = Math.max(1, state.step - 1);
            this.showCreateStep(state);
        });
        
        document.getElementById('create-next')?.addEventListener('click', () => {
            if (state.step === 1 && !state.type) { this.showToast('Выбери вид', 'warning'); return; }
            if (state.step === 2) {
                state.name = document.getElementById('pet-name-input')?.value?.trim() || '';
                if (!state.name) { this.showToast('Введи имя', 'warning'); return; }
            }
            state.step = Math.min(3, state.step + 1);
            this.showCreateStep(state);
        });
        
        document.getElementById('create-finish')?.addEventListener('click', async () => {
            if (!state.type || !state.name || !state.personality) {
                this.showToast('Заполни все поля', 'warning');
                return;
            }
            
            const pet = PetManager.createPet(state);
            
            // Sync to server
            if (API.connected) {
                await API.createPet(state);
            }
            
            this.closeModal();
            this.showToast(`${pet.name} создан! 🎉`, 'success');
            this.navigateTo('home');
            TelegramAPI.haptic('success');
        });
    },
    
    showCreateStep(state) {
        const flow = document.getElementById('create-flow');
        flow.querySelectorAll('.step').forEach(s => {
            s.style.display = s.dataset.step == state.step ? 'flex' : 'none';
        });
        
        document.getElementById('create-back').style.display = state.step > 1 ? 'block' : 'none';
        
        const finish = document.getElementById('create-finish');
        const nextBtn = document.getElementById('create-next');
        if (state.step === 3) {
            finish.classList.remove('hidden');
            nextBtn.classList.add('hidden');
        } else {
            finish.classList.add('hidden');
            nextBtn.classList.remove('hidden');
        }
    },
    
    // ========== FEED/PLAY/CARE ==========
    showFeedModal() {
        const food = Object.values(FoodItems);
        const inv = Storage.cache.inventory || [];
        
        this.openModal('🍽️ Кормить', `
            <div class="action-content">
                <button class="action-option" data-action="quick">
                    <span class="action-icon">🍽️</span>
                    <div>
                        <span class="action-name">Просто покормить</span>
                        <span class="action-effect">+20 голод</span>
                    </div>
                </button>
                <div style="border-top: 1px solid var(--bg); margin: 12px 0;"></div>
                ${food.map(f => {
                    const cnt = inv.find(i => i.id === f.id)?.count || 0;
                    return `
                        <button class="action-option ${cnt === 0 ? 'disabled' : ''}" data-item="${f.id}" ${cnt === 0 ? 'disabled' : ''}>
                            <span class="action-icon">${f.emoji}</span>
                            <div>
                                <span class="action-name">${f.name} ${cnt > 0 ? `(×${cnt})` : '(нет)'}</span>
                                <span class="action-effect">+${f.hunger} голод</span>
                            </div>
                        </button>
                    `;
                }).join('')}
            </div>
        `);
        
        this.bindFeedModal();
    },
    
    bindFeedModal() {
        const pet = Storage.getActivePet();
        
        document.querySelector('[data-action="quick"]')?.addEventListener('click', () => {
            if (!pet) return;
            PetManager.feedPet(pet.id);
            this.closeModal();
            this.showToast(`${pet.name} поел! +20`, 'success');
            TelegramAPI.haptic('success');
        });
        
        document.querySelectorAll('[data-item]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                const item = FoodItems[btn.dataset.item];
                const result = PetManager.feedPet(Storage.get('activePetId'), item);
                if (result.success) {
                    this.closeModal();
                    this.showToast(result.eventTitle, 'success');
                    TelegramAPI.haptic('success');
                }
            });
        });
    },
    
    showPlayModal() {
        this.openModal('🎮 Играть', `
            <div class="action-content">
                <button class="action-option" data-action="pet"><span class="action-icon">👋</span><div><span class="action-name">Погладить</span><span class="action-effect">+15 настроение</span></div></button>
                <button class="action-option" data-action="ball"><span class="action-icon">🎾</span><div><span class="action-name">Мячик</span><span class="action-effect">+25 настроение</span></div></button>
                <button class="action-option" data-action="adventure"><span class="action-icon">🏆</span><div><span class="action-name">Приключение</span><span class="action-effect">+50 настроение, +10 XP</span></div></button>
            </div>
        `);
        
        const pet = Storage.getActivePet();
        
        document.querySelectorAll('.action-option').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!pet) return;
                
                let effects = {};
                switch (btn.dataset.action) {
                    case 'pet': effects = { mood: 15 }; break;
                    case 'ball': effects = { mood: 25 }; break;
                    case 'adventure': effects = { mood: 50, xp: 10 }; break;
                }
                
                const p = new Pet(pet);
                p.stats.mood = Math.min(100, p.stats.mood + (effects.mood || 0));
                p.stats.xp += effects.xp || 0;
                p.checkLevelUp();
                
                Storage.updatePet(p.id, p.toJSON());
                
                // Sync to server
                if (API.connected) {
                    await API.updatePet(p.id, 'play', effects);
                }
                
                this.closeModal();
                this.showToast(`${p.name} весело проводит время!`, 'success');
                TelegramAPI.haptic('success');
            });
        });
    },
    
    showCareModal() {
        this.openModal('🚿 Уход', `
            <div class="action-content">
                <button class="action-option" data-action="bath"><span class="action-icon">🛁</span><div><span class="action-name">Купание</span><span class="action-effect">+10 настроение</span></div></button>
                <button class="action-option" data-action="rest"><span class="action-icon">💤</span><div><span class="action-name">Отдых</span><span class="action-effect">+10 HP</span></div></button>
            </div>
        `);
        
        const pet = Storage.getActivePet();
        
        document.querySelectorAll('.action-option').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!pet) return;
                
                const p = new Pet(pet);
                if (btn.dataset.action === 'bath') p.stats.mood = Math.min(100, p.stats.mood + 10);
                if (btn.dataset.action === 'rest') p.stats.hp = Math.min(100, p.stats.hp + 10);
                
                Storage.updatePet(p.id, p.toJSON());
                
                if (API.connected) {
                    await API.updatePet(p.id, 'care', { hp: 10 });
                }
                
                this.closeModal();
                this.showToast(`${p.name} освежился!`, 'success');
                TelegramAPI.haptic('success');
            });
        });
    },
    
    // ========== WHEEL ==========
    initWheelScreen() {
        const statusEl = document.getElementById('wheel-status');
        if (statusEl) {
            statusEl.innerHTML = Storage.canSpinWheel() 
                ? '<span class="green">🎉 Доступно!</span>'
                : '<span>Следующее вращение завтра</span>';
        }
        
        document.getElementById('spin-now-btn')?.addEventListener('click', () => this.spinWheel());
    },
    
    async spinWheel() {
        const result = PetManager.spinWheel();
        if (!result.success) {
            this.showToast(result.error, 'warning');
            return;
        }
        
        if (API.connected) {
            await API.spinWheel();
        }
        
        this.showToast(`Выиграл: ${result.prize.name} ${result.prize.emoji}!`, 'success');
        TelegramAPI.haptic('success');
    },
    
    // ========== QUESTS ==========
    initQuestsScreen() {
        const quests = Storage.getQuests();
        const grid = document.getElementById('quests-grid');
        if (!grid) return;
        
        grid.innerHTML = quests.map(q => `
            <div class="quest-card ${q.completed ? 'completed' : ''}">
                <div class="quest-header">
                    <span class="quest-title">${q.title}</span>
                    <span class="quest-reward">+${q.reward} 🪙</span>
                </div>
                <div class="quest-progress"><div class="quest-bar" style="width: ${(q.progress / q.target) * 100}%"></div></div>
                <div class="quest-footer">
                    <span>${q.progress}/${q.target}</span>
                    ${q.completed ? '<button class="btn small accent">Забрано ✓</button>' : ''}
                </div>
            </div>
        `).join('');
    },
    
    // ========== GAMES ==========
    initGamesScreen() {
        const gamesGrid = document.getElementById('games-grid');
        if (!gamesGrid) return;
        
        const games = Object.entries(CoinGames).map(([id, g]) => ({ id, ...g }));
        
        gamesGrid.innerHTML = games.map(g => `
            <div class="game-card" data-game="${g.id}">
                <span class="game-icon">${g.icon}</span>
                <span class="game-name">${g.name}</span>
                <span class="game-reward">+${g.coinsBonus} 🪙</span>
            </div>
        `).join('');
        
        gamesGrid.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                this.startQuizGame(CoinGames[card.dataset.game]);
            });
        });
    },
    
    startQuizGame(game) {
        if (!game) return;
        
        let currentQ = 0;
        let score = 0;
        
        const showQuestion = () => {
            const q = game.questions[currentQ];
            this.openModal(`🧠 Викторина`, `
                <div class="quiz-modal">
                    <div class="quiz-progress">Вопрос ${currentQ + 1}/${game.questions.length}</div>
                    <div class="quiz-question">${q.q}</div>
                    <div class="quiz-answers">
                        ${q.answers.map((a, i) => `<button class="quiz-answer" data-index="${i}">${a}</button>`).join('')}
                    </div>
                </div>
            `);
            
            document.querySelectorAll('.quiz-answer').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (parseInt(btn.dataset.index) === q.correct) {
                        score += game.rewardPerCorrect;
                        this.showToast('✓', 'success');
                    }
                    currentQ++;
                    if (currentQ < game.questions.length) {
                        showQuestion();
                    } else {
                        const coins = Math.floor(score / 10) + game.coinsBonus;
                        Storage.addCoins(coins);
                        this.closeModal();
                        this.showToast(`Викторина! +${coins} монет`, 'success');
                    }
                });
            });
        };
        
        showQuestion();
    },
    
    // ========== INVENTORY ==========
    initInventoryScreen() {
        this.renderInventory('food');
        
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(t => t.classList.toggle('active', t === e.target));
                this.renderInventory(e.target.dataset.tab);
            });
        });
        
        document.getElementById('shop-btn')?.addEventListener('click', () => this.showShopModal());
    },
    
    renderInventory(cat) {
        const grid = document.getElementById('inventory-grid');
        const empty = document.getElementById('inventory-empty');
        const inv = Storage.getInventoryByCategory(cat);
        
        if (!grid) return;
        
        if (inv.length === 0) {
            grid.style.display = 'none';
            empty.style.display = 'flex';
            return;
        }
        
        grid.style.display = 'grid';
        empty.style.display = 'none';
        
        grid.innerHTML = inv.map(i => `
            <div class="inv-item" data-id="${i.id}">
                <span class="inv-icon">${i.emoji}</span>
                <span class="inv-name">${i.name}</span>
                <span class="inv-count">×${i.count}</span>
            </div>
        `).join('');
    },
    
    showShopModal() {
        const coins = Storage.getCoins();
        const all = [...Object.values(FoodItems).map(i => ({...i, category: 'food'})),
                     ...Object.values(CareItems).map(i => ({...i, category: 'care'}))];
        
        this.openModal('🛒 Магазин', `
            <div style="text-align: center; margin-bottom: 16px;">
                <span>Баланс: </span><strong>🪙 ${coins}</strong>
            </div>
            <div class="shop-grid">
                ${all.map(i => `
                    <button class="shop-item" data-item='${JSON.stringify(i)}'>
                        <span class="shop-icon">${i.emoji}</span>
                        <span class="shop-name">${i.name}</span>
                        <span class="shop-price">🪙 ${i.price}</span>
                    </button>
                `).join('')}
            </div>
        `);
        
        document.querySelectorAll('.shop-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = JSON.parse(btn.dataset.item);
                if (Storage.spendCoins(item.price)) {
                    Storage.addToInventory(item);
                    this.closeModal();
                    this.showToast(`Куплено: ${item.emoji} ${item.name}!`, 'success');
                } else {
                    this.showToast('Недостаточно монет!', 'warning');
                }
            });
        });
    },
    
    // ========== SETTINGS ==========
    showSettings() {
        this.openModal('⚙️ Настройки', `
            <div class="settings-content">
                <button class="action-option" id="reset-data">
                    <span class="action-icon">🗑️</span>
                    <div>
                        <span class="action-name">Сбросить данные</span>
                        <span class="action-effect" style="color: var(--danger);">Удалить питомцев</span>
                    </div>
                </button>
            </div>
        `);
        
        document.getElementById('reset-data')?.addEventListener('click', () => {
            if (confirm('Удалить всех питомцев?')) {
                Storage.clear();
                location.reload();
            }
        });
    },
    
    // ========== UTILS ==========
    updateCoinsDisplay() {
        const el = document.getElementById('coins-display');
        if (el) el.textContent = Storage.getCoins();
    },
    
    openModal(title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal-overlay').classList.add('show');
        TelegramAPI.haptic('light');
    },
    
    closeModal() {
        document.getElementById('modal-overlay').classList.remove('show');
    },
    
    showToast(msg, type = 'default') {
        const c = document.getElementById('toast-container');
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.textContent = msg;
        c.appendChild(t);
        
        setTimeout(() => {
            t.style.animation = 'toastOut 0.3s forwards';
            setTimeout(() => t.remove(), 300);
        }, 2500);
    },
    
    showLevelUp(data) {
        const div = document.createElement('div');
        div.className = 'level-up-overlay';
        div.innerHTML = `
            <div class="level-up-content">
                <span class="level-up-icon">🎊</span>
                <span class="level-up-text">УРОВЕНЬ UP!</span>
                <span class="level-up-level">${data.pet.stats.level}</span>
            </div>
        `;
        document.body.appendChild(div);
        setTimeout(() => div.classList.add('show'), 50);
        TelegramAPI.haptic('success');
        setTimeout(() => {
            div.classList.remove('show');
            setTimeout(() => div.remove(), 300);
        }, 2500);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
