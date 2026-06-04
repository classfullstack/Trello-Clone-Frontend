import { createApi } from '@trello/ui';

export const api = createApi('/api');

export const SYSTEM_ROLES = ['super_admin', 'admin', 'support'];
