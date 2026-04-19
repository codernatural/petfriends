/**
 * PetFriends - Event System
 * Custom event dispatcher for app-wide communication
 */

const Events = {
    // Event names
    PET_UPDATED: 'pet:updated',
    PET_CREATED: 'pet:created',
    PET_DELETED: 'pet:deleted',
    PET_SELECTED: 'pet:selected',
    STAT_CHANGED: 'stat:changed',
    INVENTORY_UPDATED: 'inventory:updated',
    COINS_CHANGED: 'coins:changed',
    EVENT_ADDED: 'event:added',
    SCREEN_CHANGED: 'screen:changed',
    LEVEL_UP: 'level:up',
    MODAL_OPENED: 'modal:opened',
    MODAL_CLOSED: 'modal:closed',
    MINIGAME_STARTED: 'minigame:started',
    MINIGAME_ENDED: 'minigame:ended',
    
    // Event listeners storage
    listeners: {},
    
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     * @returns {function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    },
    
    /**
     * Subscribe to an event (fires once)
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     */
    once(event, callback) {
        const onceCallback = (data) => {
            callback(data);
            this.off(event, onceCallback);
        };
        this.on(event, onceCallback);
    },
    
    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     */
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    },
    
    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });
    },
    
    /**
     * Remove all listeners for an event or all events
     * @param {string} [event] - Event name (optional)
     */
    removeAllListeners(event) {
        if (event) {
            delete this.listeners[event];
        } else {
            this.listeners = {};
        }
    }
};

// Freeze the Events object to prevent modifications
Object.freeze(Events);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Events;
}
