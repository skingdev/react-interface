// Loaded by Mocha before any spec (see .mocharc.json).
// Provides a browser-like DOM (jsdom) and resets state between tests.
import 'global-jsdom/register';
import sinon from 'sinon';
import { cleanup } from '@testing-library/react';

// Tell React that updates are wrapped in act() by Testing Library.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

export const mochaHooks = {
  afterEach() {
    cleanup();
    sinon.restore();
  },
};
