/**
 * PetFriends - Main Application
 * Entry point and initialization
 */

const App = {
    /**
     * Initialize the application
     */
    init() {
        console.log('🐾 PetFriends initializing...');
        
        try {
            // Initialize Telegram WebApp
            TelegramAPI.init();
            
            // Initialize Storage
            if (!Storage.init()) {
                console.error('Storage initialization failed');
            }
            
            // Initialize Pet Manager
            PetManager.init();
            
            // Initialize UI
            UI.init();
            
            // Setup visibility change handling
            this.setupVisibilityHandling();
            
            // Setup beforeunload handling
            this.setupBeforeUnload();
            
            console.log('🐾 PetFriends initialized successfully!');
            
        } catch (error) {
            console.error('App initialization error:', error);
            this.showInitError();
        }
    },
    
    /**
     * Setup visibility change handling for background updates
     */
    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // App became visible - update pet stats
                const activePet = Storage.getActivePet();
                if (activePet) {
                    // Calculate degradation since last interaction
                    const pet = new Pet(activePet);
                    pet.calculateDegradation(pet.lastInteraction);
                    Storage.updatePet(pet.id, pet.toJSON());
                    Events.emit(Events.PET_UPDATED, pet.toJSON());
                }
            }
        });
    },
    
    /**
     * Setup beforeunload handling
     */
    setupBeforeUnload() {
        window.addEventListener('beforeunload', () => {
            // Cleanup pet manager intervals
            PetManager.destroy();
            
            // Force save storage
            Storage.save();
        });
    },
    
    /**
     * Show initialization error
     */
    showInitError() {
        document.body.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center; font-family: system-ui;">
                <span style="font-size: 64px; margin-bottom: 20px;">😿</span>
                <h2 style="margin-bottom: 10px;">Что-то пошло не так</h2>
                <p style="color: #666; margin-bottom: 20px;">Не удалось загрузить приложение</p>
                <button onclick="location.reload()" style="padding: 12px 24px; background: #6C5CE7; color: white; border: none; border-radius: 12px; cursor: pointer;">
                    Попробовать снова
                </button>
            </div>
        `;
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
