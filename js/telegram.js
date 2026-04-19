/**
 * PetFriends - Telegram WebApp API v2
 * Автовход через Telegram, интеграция с Mini App SDK
 */

const TelegramAPI = {
    webapp: null,
    isAvailable: false,
    user: null,
    initDataRaw: null,
    
    init() {
        if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
            this.webapp = window.Telegram.WebApp;
            this.isAvailable = true;
            
            // Расширяем на весь экран
            this.webapp.expand();
            
            // Подтверждение закрытия
            this.webapp.enableClosingConfirmation();
            
            // Получаем данные пользователя
            this.user = this.webapp.initDataUnsafe?.user || null;
            this.initDataRaw = this.webapp.initData;
            
            // Применяем тему
            this.applyTheme();
            
            console.log('🐾 Telegram WebApp initialized');
            console.log('User:', this.user?.first_name, this.user?.id);
            
            return true;
        }
        
        console.log('🐾 Running in browser mode (no Telegram)');
        return false;
    },
    
    applyTheme() {
        if (!this.isAvailable) return;
        
        const tp = this.webapp.themeParams;
        if (tp) {
            document.documentElement.style.setProperty('--primary', tp.button_color || '#6C5CE7');
            document.documentElement.style.setProperty('--bg', this.webapp.backgroundColor || '#F8F9FA');
        }
    },
    
    getUser() {
        if (!this.user) {
            return {
                id: 'local_' + Date.now(),
                first_name: 'Друг',
                username: 'local_user'
            };
        }
        
        return {
            id: this.user.id,
            first_name: this.user.first_name,
            username: this.user.username || '',
            last_name: this.user.last_name || '',
            photo_url: this.user.photo_url || ''
        };
    },
    
    getInitData() {
        return this.initDataRaw || '';
    },
    
    haptic(type = 'light') {
        if (!this.isAvailable) return;
        
        try {
            const types = {
                light: 'impactLight',
                medium: 'impactMedium', 
                heavy: 'impactHeavy',
                selection: 'selection',
                success: 'notificationSuccess',
                warning: 'notificationWarning',
                error: 'notificationError'
            };
            
            const impactType = types[type] || 'impactLight';
            
            if (impactType.startsWith('impact')) {
                this.webapp.HapticFeedback.impactOccurred(impactType.replace('impact', '').toLowerCase());
            } else {
                this.webapp.HapticFeedback.notificationOccurred(impactType.replace('notification', '').toLowerCase());
            }
        } catch (e) {
            // Haptic не поддерживается
        }
    },
    
    showPopup(options) {
        if (!this.isAvailable) {
            alert(options.message);
            return Promise.resolve({ button_id: 'ok' });
        }
        
        return new Promise((resolve) => {
            this.webapp.showPopup({
                title: options.title || '',
                message: options.message,
                buttons: options.buttons || [{ type: 'ok' }]
            }, (buttonId) => {
                resolve({ button_id: buttonId });
            });
        });
    },
    
    close() {
        if (this.isAvailable) {
            this.webapp.close();
        }
    },
    
    // Для Telegram Mini App - п��казываем кнопку "Назад"
    showBackButton(onClick) {
        if (!this.isAvailable) return;
        
        this.webapp.BackButton.show();
        this.webapp.onEvent('backButtonClicked', onClick);
    },
    
    hideBackButton() {
        if (!this.isAvailable) return;
        this.webapp.BackButton.hide();
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelegramAPI;
}
