/**
 * MSW Server Configuration
 *
 * Creates the MSW server instance for Node.js testing.
 * This server intercepts network requests at the network layer.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Create the MSW server with the default handlers
export const server = setupServer(...handlers);
