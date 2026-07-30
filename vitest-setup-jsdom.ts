import { JSDOM } from 'jsdom';

// This setup file ensures that jsdom tests have a working localStorage
// It runs before tests that explicitly opt-in to jsdom environment
if (typeof window !== 'undefined' && window.location.href.includes('localhost')) {
  // Reinitialize localStorage to make sure it has all methods
  const dom = new JSDOM('<!DOCTYPE html>', { url: 'http://localhost' });
  const properlyInitializedStorage = dom.window.localStorage;

  // Replace the broken localStorage with the properly initialized one
  Object.defineProperty(globalThis, 'localStorage', {
    value: properlyInitializedStorage,
    writable: true,
    configurable: true,
  });
}
