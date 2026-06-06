/**
 * @jest-environment jsdom
 */
const { state, store_load, store_save, store_addSession, store_clear, store_updateSession } = require('../js/store.js');

describe('State Management & Storage', () => {
  beforeEach(() => {
    localStorage.clear();
    state.sessions = [];
    state.profile = null;
  });

  test('store_save and store_load successfully persist and retrieve data', () => {
    state.profile = { name: "Test User" };
    state.sessions = [{ id: "123", mood: 5 }];
    
    store_save();
    
    // reset state
    state.profile = null;
    state.sessions = [];
    
    store_load();
    
    expect(state.profile.name).toBe("Test User");
    expect(state.sessions[0].mood).toBe(5);
  });

  test('store_addSession appends to sessions and saves', () => {
    const session = { id: "456", mood: 3, messages: [] };
    store_addSession(session);
    
    expect(state.sessions.length).toBe(1);
    expect(state.sessions[0].id).toBe("456");
    
    const stored = JSON.parse(localStorage.getItem('kivi_data'));
    expect(stored.sessions[0].id).toBe("456");
  });

  test('store_updateSession adds message to correct session', () => {
    state.sessions = [{ id: "789", messages: [] }];
    store_updateSession("789", { role: "user", content: "hello" });
    
    expect(state.sessions[0].messages.length).toBe(1);
    expect(state.sessions[0].messages[0].content).toBe("hello");
  });

  test('store_clear removes data and reloads', () => {
    localStorage.setItem('kivi_data', 'test');
    try {
      store_clear();
    } catch(e) {
      // jsdom throws "Not implemented: navigation" for location.reload()
    }
    expect(localStorage.getItem('kivi_data')).toBeNull();
  });
});
