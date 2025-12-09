import { User } from '../types';

/**
 * SERVIÇO DE PERMISSÕES (GATEKEEPER)
 * Centraliza a lógica de "quem pode fazer o que".
 * Se no futuro você quiser bloquear o plano Free de usar IA, altere aqui.
 */

export const permissions = {
    canUseAI: (user: User) => {
        // Exemplo: return user.plan !== 'free';
        // Por enquanto, deixamos aberto (retorna true sempre) para testes/venda fácil
        return true; 
    },

    canMineLeads: (user: User) => {
        // Mineração de leads consome muito recurso, ideal para PRO
        // return user.plan === 'pro' || user.plan === 'enterprise';
        return true; 
    },

    canAccessAdmin: (user: User) => {
        return !!user.isAdmin;
    },

    getMaxDailySends: (user: User) => {
        if (user.plan === 'enterprise') return 10000;
        if (user.plan === 'pro') return 2000;
        return 50; // Free limit
    },

    getMaxCampaigns: (user: User) => {
        if (user.plan === 'enterprise') return 999;
        if (user.plan === 'pro') return 20;
        return 1;
    }
};