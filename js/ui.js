/**
 * PetFriends - UI Module v2
 * Enhanced UI with wheel, quests, games, co-op
 */

const UI = {
    currentScreen: 'home',
    createPetState: { step: 1, type: null, name: '', personality: null },
    
    init() {
        this.bindEvents();
        this.renderScreen('home');
        this.updateCoinsDisplay();
    },
    
    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.navigateTo(e.currentTarget.dataset.screen);
            });
        });
        
        // Modal
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') this.closeModal();
        });
        
        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        
        // Events
        Events.on(Events.PET_UPDATED, () => this.updateActivePetDisplay());
        Events.on(Events.COINS_CHANGED, () => this.updateCoinsDisplay());
        Events.on(Events.LEVEL_UP, (data) => this.showLevelUp(data));
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
            case 'events': this.initEventsScreen(); break;
            case 'wheel': this.initWheelScreen(); break;
            case 'quests': this.initQuestsScreen(); break;
            case 'games': this.initGamesScreen(); break;
        }
    },
    
    // ========== HOME SCREEN ==========
    initHomeScreen() {
        const pet = Storage.getActivePet();
        const noPet = document.getElementById('no-pet-message');
        
        if (!pet) {
            noPet.style.display = 'flex';
            document.getElementById('pet-display')?.style.setProperty('display', 'none');
            document.getElementById('quick-actions')?.style.setProperty('display', 'none');
            document.getElementById('create-first-pet-btn')?.addEventListener('click', () => this.showCreatePetModal());
            return;
        }
        
        noPet.style.display = 'none';
        this.updateActivePetDisplay();
        this.bindActionButtons();
        
        // Wheel button if can spin
        const daily = Storage.getDailyData();
        const canSpin = Storage.canSpinWheel();
        const wheelBtn = document.getElementById('wheel-btn');
        if (wheelBtn) {
            wheelBtn.style.opacity = canSpin ? '1' : '0.5';
            wheelBtn.querySelector('.btn-label').textContent = canSpin ? '🎰 Колесо' : '🎰 Завтра';
        }
        
        // Streak display
        const streakEl = document.getElementById('streak-display');
        if (streakEl && daily.streak > 1) {
            streakEl.style.display = 'flex';
            streakEl.querySelector('span').textContent = `🔥 ${daily.streak} дней`;
        }
    },
    
    updateActivePetDisplay() {
        const pet = Storage.getActivePet();
        if (!pet) return;
        
        const avatar = document.getElementById('active-pet-avatar');
        if (avatar) {
            avatar.textContent = PetTypes[pet.type]?.emoji || '🐾';
            avatar.className = 'pet-avatar';
            if (pet.stats.mood > 80) avatar.classList.add('happy');
            else if (pet.stats.hunger < 30) avatar.classList.add('sad');
            else if (pet.stats.hp < 30) avatar.classList.add('sick');
        }
        
        document.getElementById('pet-name').textContent = pet.name;
        document.getElementById('pet-level').textContent = `Ур. ${pet.stats.level}`;
        document.getElementById('pet-status-indicator').textContent = PetManager.getPetStatus(pet);
        
        this.updateStatBar('hp', pet.stats.hp);
        this.updateStatBar('hunger', pet.stats.hunger);
        this.updateStatBar('mood', pet.stats.mood);
        this.updateXPBar(pet.stats.xp, pet.stats.level);
    },
    
    updateStatBar(stat, value) {
        const bar = document.getElementById(`stat-${stat}`);
        const val = document.getElementById(`stat-${stat}-value`);
        if (bar) bar.style.width = `${Math.max(0, Math.min(100, value))}%`;
        if (val) val.textContent = Math.round(value);
    },
    
    updateXPBar(xp, level) {
        const bar = document.getElementById('stat-xp');
        const val = document.getElementById('stat-xp-value');
        const needed = 100 * level;
        if (bar) bar.style.width = `${(xp / needed) * 100}%`;
        if (val) val.textContent = `${Math.round(xp)}/${needed}`;
    },
    
    bindActionButtons() {
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleAction(btn.dataset.action);
                TelegramAPI.haptic('medium');
            });
        });
        
        document.getElementById('wheel-btn')?.addEventListener('click', () => {
            if (Storage.canSpinWheel()) {
                this.showWheelModal();
            } else {
                this.showToast('Колесо можно крутить раз в день!', 'warning');
            }
        });
    },
    
    handleAction(action) {
        switch (action) {
            case 'feed': this.showFeedModal(); break;
            case 'play': this.showPlayModal(); break;
            case 'care': this.showCareModal(); break;
        }
    },
    
    // ========== WHEEL OF FORTUNE ==========
    initWheelScreen() {
        const daily = Storage.getDailyData();
        const canSpin = Storage.canSpinWheel();
        
        const statusEl = document.getElementById('wheel-status');
        if (statusEl) {
            if (canSpin) {
                statusEl.innerHTML = '<span class="green">🎉 Колесо доступно!</span>';
                statusEl.nextElementSibling.style.display = 'block';
            } else {
                const timeLeft = 24 * 60 * 60 * 1000 - (Date.now() - (daily.lastSpin || 0));
                const hours = Math.floor(timeLeft / 3600000);
                const mins = Math.floor((timeLeft % 3600000) / 60000);
                statusEl.innerHTML = `<span>Следующее вращение через ${hours}ч ${mins}м</span>`;
                statusEl.nextElementSibling.style.display = 'none';
            }
        }
        
        // Spin button
        document.getElementById('spin-now-btn')?.addEventListener('click', () => {
            this.spinWheel();
        });
    },
    
    showWheelModal() {
        this.openModal('🎰 Колесо удачи', `
            <div class="wheel-modal">
                <p style="text-align: center; margin-bottom: 16px;">Крути колесо раз в день и получай награды!</p>
                <div class="wheel-preview" id="wheel-preview">
                    <div class="wheel-pointer">▼</div>
                    <div class="wheel-segments">
                        ${WheelPrizes.map(p => `<div class="wheel-segment"><span>${p.emoji}</span></div>`).join('')}
                    </div>
                </div>
                <button class="btn primary" id="modal-spin-btn" style="width: 100%; margin-top: 16px;">
                    🎰 КРУТИТЬ!
                </button>
            </div>
        `);
        
        document.getElementById('modal-spin-btn')?.addEventListener('click', () => {
            this.spinWheel();
        });
    },
    
    spinWheel() {
        const btn = document.getElementById('modal-spin-btn') || document.getElementById('spin-now-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Крутится...';
        }
        
        const result = PetManager.spinWheel();
        
        if (!result.success) {
            this.showToast(result.error, 'warning');
            return;
        }
        
        // Animation
        const wheel = document.querySelector('.wheel-segments') || document.getElementById('wheel-preview');
        if (wheel) {
            let rotations = 5 + Math.random() * 3;
            wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
            wheel.style.transform = `rotate(${rotations * 360}deg)`;
            
            setTimeout(() => {
                this.closeModal();
                this.showToast(`Выиграл: ${result.prize.name} ${result.prize.emoji}!`, 'success');
                TelegramAPI.haptic('success');
                
                if (wheel.style) wheel.style.transform = '';
            }, 4000);
        } else {
            this.closeModal();
            this.showToast(`Выиграл: ${result.prize.name} ${result.prize.emoji}!`, 'success');
            TelegramAPI.haptic('success');
        }
    },
    
    // ========== QUESTS ==========
    initQuestsScreen() {
        const quests = Storage.get('quests', []);
        const grid = document.getElementById('quests-grid');
        if (!grid) return;
        
        grid.innerHTML = quests.map(q => `
            <div class="quest-card ${q.completed ? 'completed' : ''}">
                <div class="quest-header">
                    <span class="quest-title">${q.title}</span>
                    <span class="quest-reward">+${q.reward} 🪙</span>
                </div>
                <div class="quest-progress">
                    <div class="quest-bar" style="width: ${(q.progress / q.target) * 100}%"></div>
                </div>
                <div class="quest-footer">
                    <span>${q.progress}/${q.target}</span>
                    ${q.completed ? '<button class="btn small accent claim-btn" data-quest="' + q.id + '">Забрать!</button>' : ''}
                </div>
            </div>
        `).join('');
        
        // Claim buttons
        grid.querySelectorAll('.claim-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const result = PetManager.claimQuestReward(btn.dataset.quest);
                if (result.success) {
                    this.showToast(`+${result.reward} монет!`, 'success');
                    this.initQuestsScreen();
                }
            });
        });
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
                this.startGame(card.dataset.game);
            });
        });
    },
    
    startGame(gameId) {
        const game = CoinGames[gameId];
        if (!game) return;
        
        if (gameId === 'quiz') {
            this.startQuizGame(game);
        } else if (gameId === 'reaction') {
            this.startReactionGame(game);
        }
    },
    
    startQuizGame(game) {
        let currentQ = 0;
        let score = 0;
        let timeLeft = game.duration;
        
        const showQuestion = () => {
            const q = game.questions[currentQ];
            this.openModal(`🧠 Викторина (${timeLeft}с)`, `
                <div class="quiz-modal">
                    <div class="quiz-progress">Вопрос ${currentQ + 1}/${game.questions.length}</div>
                    <div class="quiz-question">${q.q}</div>
                    <div class="quiz-answers">
                        ${q.answers.map((a, i) => `
                            <button class="quiz-answer" data-index="${i}">${a}</button>
                        `).join('')}
                    </div>
                </div>
            `);
            
            document.querySelectorAll('.quiz-answer').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.index);
                    if (idx === q.correct) {
                        score += game.rewardPerCorrect;
                        this.showToast('✓ Верно!', 'success');
                    } else {
                        this.showToast('✗ Неверно', 'danger');
                    }
                    currentQ++;
                    if (currentQ < game.questions.length) {
                        showQuestion();
                    } else {
                        this.endQuizGame(score, game.coinsBonus);
                    }
                });
            });
        };
        
        showQuestion();
    },
    
    endQuizGame(score, bonus) {
        const coins = Math.floor(score / 10) + bonus;
        Storage.addCoins(coins);
        Storage.addQuestProgress('earn', coins);
        
        this.closeModal();
        this.showToast(`Викторина завершена! +${coins} монет`, 'success');
        TelegramAPI.haptic('success');
    },
    
    startReactionGame(game) {
        let hits = 0;
        let timeLeft = game.duration;
        let targetInterval;
        
        this.openModal(`⚡ Реакция`, `
            <div class="reaction-modal">
                <div class="reaction-info">
                    <span>Попаданий: <span id="reaction-hits">0</span>/${game.targets}</span>
                    <span>Время: <span id="reaction-time">${timeLeft}</span>с</span>
                </div>
                <div class="reaction-area" id="reaction-area">
                    <p style="text-align: center; color: #888;">Нажми на цель!</p>
                </div>
            </div>
        `);
        
        const spawnTarget = () => {
            const area = document.getElementById('reaction-area');
            if (!area) return;
            
            area.innerHTML = '';
            const target = document.createElement('div');
            target.className = 'reaction-target';
            target.textContent = '🎯';
            target.style.cssText = `
                position: absolute;
                font-size: 40px;
                cursor: pointer;
                left: ${Math.random() * 70}%;
                top: ${Math.random() * 70}%;
            `;
            
            target.addEventListener('click', () => {
                hits++;
                document.getElementById('reaction-hits').textContent = hits;
                TelegramAPI.haptic('light');
                spawnTarget();
            });
            
            area.appendChild(target);
        };
        
        spawnTarget();
        
        const timer = setInterval(() => {
            timeLeft--;
            const timeEl = document.getElementById('reaction-time');
            if (timeEl) timeEl.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                clearTimeout(targetInterval);
                
                const coins = hits * game.rewardPerTarget + game.coinsBonus;
                Storage.addCoins(coins);
                Storage.addQuestProgress('earn', coins);
                
                this.closeModal();
                this.showToast(`Реакция: ${hits} попаданий! +${coins} монет`, 'success');
                TelegramAPI.haptic('success');
            }
        }, 1000);
    },
    
    // ========== PETS SCREEN ==========
    initPetsScreen() {
        this.renderPetsGrid();
        document.getElementById('add-pet-btn')?.addEventListener('click', () => this.showCreatePetModal());
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
                <div class="pet-card-icon">${PetTypes[p.type]?.emoji || '🐾'}</div>
                <span class="pet-card-name">${p.name}</span>
                <span class="pet-card-level">Ур. ${p.stats.level}</span>
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
        this.createPetState = { step: 1, type: null, name: '', personality: null };
        
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
        if (!flow) return;
        
        flow.querySelectorAll('.pet-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                flow.querySelectorAll('.pet-type-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.createPetState.type = btn.dataset.type;
            });
        });
        
        flow.querySelectorAll('.personality-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                flow.querySelectorAll('.personality-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.createPetState.personality = btn.dataset.pers;
            });
        });
        
        document.getElementById('create-back')?.addEventListener('click', () => this.navigateCreateStep(-1));
        document.getElementById('create-next')?.addEventListener('click', () => this.navigateCreateStep(1));
        document.getElementById('create-finish')?.addEventListener('click', () => this.finishCreate());
    },
    
    navigateCreateStep(dir) {
        const flow = document.getElementById('create-flow');
        const current = parseInt(flow.querySelector('.step:not([style*="display: none"])')?.dataset.step || 1);
        let next = current + dir;
        
        if (dir === 1) {
            if (next === 2 && !this.createPetState.type) { this.showToast('Выбери вид', 'warning'); return; }
            if (next === 3) {
                this.createPetState.name = document.getElementById('pet-name-input')?.value?.trim() || '';
                if (!this.createPetState.name) { this.showToast('Введи имя', 'warning'); return; }
            }
            if (next > 3 && !this.createPetState.personality) { this.showToast('Выбери характер', 'warning'); return; }
        }
        
        next = Math.max(1, Math.min(3, next));
        
        flow.querySelectorAll('.step').forEach(s => {
            s.style.display = s.dataset.step == next ? 'flex' : 'none';
        });
        
        document.getElementById('create-back').style.display = next > 1 ? 'block' : 'none';
        const finish = document.getElementById('create-finish');
        const nextBtn = document.getElementById('create-next');
        if (next === 3) { finish.classList.remove('hidden'); nextBtn.classList.add('hidden'); }
        else { finish.classList.add('hidden'); nextBtn.classList.remove('hidden'); }
    },
    
    finishCreate() {
        if (!this.createPetState.type || !this.createPetState.name || !this.createPetState.personality) {
            this.showToast('Заполни все поля', 'warning');
            return;
        }
        
        PetManager.createPet(this.createPetState);
        this.closeModal();
        this.showToast(`${this.createPetState.name} создан! 🎉`, 'success');
        this.navigateTo('home');
        TelegramAPI.haptic('success');
    },
    
    // ========== FEED/PLAY/CARE MODALS ==========
    showFeedModal() {
        const food = [...Object.values(FoodItems)];
        const inv = Storage.get('inventory', []);
        const cd = Storage.getCooldown('quickFeed');
        
        this.openModal('🍽️ Кормить', `
            <div class="action-content">
                <button class="action-option ${cd.active ? 'disabled' : ''}" data-action="quick" ${cd.active ? 'disabled' : ''}>
                    <span class="action-icon">🍽️</span>
                    <div>
                        <span class="action-name">Просто покормить ${cd.active ? `(${Math.ceil(cd.remaining/60000)}м)` : ''}</span>
                        <span class="action-effect">+20 голод, кулдаун 1 мин</span>
                    </div>
                </button>
                <div style="border-top: 1px solid var(--bg); margin: 12px 0;"></div>
                ${food.filter(f => !f.cooldownFree).map(f => {
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
        const modal = document.getElementById('modal-body');
        
        modal.querySelector('[data-action="quick"]')?.addEventListener('click', (e) => {
            if (e.target.disabled) return;
            const pet = Storage.getActivePet();
            if (!pet) return;
            
            const p = new Pet(pet);
            p.applyAction('feed');
            Storage.updatePet(p.id, p.toJSON());
            Storage.setCooldown('quickFeed', Cooldowns.quickFeed);
            
            this.closeModal();
            this.showToast(`${p.name} поел! +20 🍎`, 'success');
            TelegramAPI.haptic('success');
        });
        
        modal.querySelectorAll('[data-item]').forEach(btn => {
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
                <button class="action-option" data-action="pet">
                    <span class="action-icon">👋</span>
                    <div><span class="action-name">Погладить</span><span class="action-effect">+15 настроение</span></div>
                </button>
                <button class="action-option" data-action="ball">
                    <span class="action-icon">🎾</span>
                    <div><span class="action-name">Мячик</span><span class="action-effect">+25 настроение</span></div>
                </button>
                <button class="action-option" data-action="adventure">
                    <span class="action-icon">🏆</span>
                    <div><span class="action-name">Приключение</span><span class="action-effect">+50 настроение, +10 XP</span></div>
                </button>
            </div>
        `);
        
        this.bindPlayModal();
    },
    
    bindPlayModal() {
        const modal = document.getElementById('modal-body');
        const pet = Storage.getActivePet();
        
        modal.querySelectorAll('.action-option').forEach(btn => {
            btn.addEventListener('click', () => {
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
                
                Storage.addEvent({
                    petId: p.id,
                    petName: p.name,
                    icon: '🎮',
                    title: `${p.name} весело проводит время!`
                });
                
                this.closeModal();
                this.showToast('Питомец радуется!', 'success');
                TelegramAPI.haptic('success');
            });
        });
    },
    
    showCareModal() {
        this.openModal('🚿 Уход', `
            <div class="action-content">
                <button class="action-option" data-action="bath">
                    <span class="action-icon">🛁</span>
                    <div><span class="action-name">Купание</span><span class="action-effect">+10 настроение</span></div>
                </button>
                <button class="action-option" data-action="rest">
                    <span class="action-icon">💤</span>
                    <div><span class="action-name">Отдых</span><span class="action-effect">+10 HP</span></div>
                </button>
            </div>
        `);
        
        this.bindCareModal();
    },
    
    bindCareModal() {
        const modal = document.getElementById('modal-body');
        const pet = Storage.getActivePet();
        
        modal.querySelectorAll('.action-option').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!pet) return;
                
                let effects = {};
                switch (btn.dataset.action) {
                    case 'bath': effects = { mood: 10 }; break;
                    case 'rest': effects = { hp: 10 }; break;
                }
                
                const p = new Pet(pet);
                if (effects.hp) p.stats.hp = Math.min(100, p.stats.hp + effects.hp);
                if (effects.mood) p.stats.mood = Math.min(100, p.stats.mood + effects.mood);
                
                Storage.updatePet(p.id, p.toJSON());
                
                this.closeModal();
                this.showToast(`${p.name} освежился!`, 'success');
                TelegramAPI.haptic('success');
            });
        });
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
        const coins = Storage.get('coins', 0);
        const all = [
            ...Object.values(FoodItems).map(i => ({...i, cat: 'food'})),
            ...Object.values(CareItems).map(i => ({...i, cat: 'care'}))
        ];
        
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
                    TelegramAPI.haptic('success');
                } else {
                    this.showToast('Недостаточно монет!', 'warning');
                }
            });
        });
    },
    
    // ========== EVENTS ==========
    initEventsScreen() {
        this.renderEvents();
        document.getElementById('clear-events-btn')?.addEventListener('click', () => {
            Storage.clearEvents();
            this.renderEvents();
        });
    },
    
    renderEvents() {
        const list = document.getElementById('events-list');
        const empty = document.getElementById('events-empty');
        const events = Storage.get('events', []);
        
        if (!list) return;
        
        if (events.length === 0) {
            list.style.display = 'none';
            empty.style.display = 'flex';
            return;
        }
        
        list.style.display = 'flex';
        empty.style.display = 'none';
        
        list.innerHTML = events.map(e => `
            <div class="event-card ${e.special ? 'special' : ''}">
                <span class="event-icon">${e.icon}</span>
                <div class="event-content">
                    <span class="event-title">${e.title}</span>
                    <span class="event-time">${this.formatTime(e.timestamp)}</span>
                </div>
            </div>
        `).join('');
    },
    
    formatTime(ts) {
        const m = Math.floor((Date.now() - ts) / 60000);
        if (m < 1) return 'только что';
        if (m < 60) return `${m} мин. назад`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h} ч. назад`;
        return `${Math.floor(h / 24)} дн. назад`;
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
        
        document.getElementById('reset-data')?.addEventListener('click', async () => {
            if (confirm('Удалить всех питомцев?')) {
                Storage.clear();
                location.reload();
            }
        });
    },
    
    // ========== UTILS ==========
    updateCoinsDisplay() {
        const el = document.getElementById('coins-display');
        if (el) el.textContent = Storage.get('coins', 0);
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
