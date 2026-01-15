import { supabase } from '@/lib/supabase';

// The URL of the AI Tools app
const AI_TOOLS_CALLBACK_URL = 'https://my-ceo-ai-tools.vercel.app/auth/callback';

interface SSOTicketParams {
    actorType: 'child' | 'parent' | 'admin';
    actorId: string;
    parentId?: string; // Required for children
    plan?: string;
}

/**
 * Generate an SSO ticket and redirect the user to AI Tools
 * 
 * Usage:
 * - For a child: generateSSOTicketAndRedirect({ actorType: 'child', actorId: childId, parentId: parentId })
 * - For a parent: generateSSOTicketAndRedirect({ actorType: 'parent', actorId: parentId })
 * - For an admin: generateSSOTicketAndRedirect({ actorType: 'admin', actorId: adminId })
 */
export async function generateSSOTicketAndRedirect(params: SSOTicketParams): Promise<void> {
    const { actorType, actorId, parentId, plan = 'free' } = params;

    // Validation: children must have a parent_id
    if (actorType === 'child' && !parentId) {
        throw new Error('parent_id is required for child actor type');
    }

    try {
        // Generate a random ticket string: sso_tk_ + random UUID without dashes
        const randomPart = crypto.randomUUID().replace(/-/g, '');
        const ticket = `sso_tk_${randomPart}`;

        // Calculate expiration (30 seconds from now)
        const expiresAt = new Date(Date.now() + 30 * 1000).toISOString();

        // Insert the ticket into the sso_tokens table
        const { error } = await supabase
            .from('sso_tokens')
            .insert({
                ticket,
                actor_type: actorType,
                actor_id: actorId,
                parent_id: parentId || null,
                plan,
                expires_at: expiresAt,
            });

        if (error) {
            console.error('Failed to create SSO ticket:', error);
            throw new Error('Failed to generate login ticket');
        }

        // Redirect to AI Tools with the ticket
        const redirectUrl = `${AI_TOOLS_CALLBACK_URL}?ticket=${encodeURIComponent(ticket)}`;
        window.location.href = redirectUrl;

    } catch (err) {
        console.error('SSO redirect failed:', err);
        throw err;
    }
}

/**
 * Generate SSO ticket without redirecting (returns the ticket for custom handling)
 */
export async function generateSSOTicket(params: SSOTicketParams): Promise<string> {
    const { actorType, actorId, parentId, plan = 'free' } = params;

    if (actorType === 'child' && !parentId) {
        throw new Error('parent_id is required for child actor type');
    }

    const randomPart = crypto.randomUUID().replace(/-/g, '');
    const ticket = `sso_tk_${randomPart}`;
    const expiresAt = new Date(Date.now() + 30 * 1000).toISOString();

    const { error } = await supabase
        .from('sso_tokens')
        .insert({
            ticket,
            actor_type: actorType,
            actor_id: actorId,
            parent_id: parentId || null,
            plan,
            expires_at: expiresAt,
        });

    if (error) {
        console.error('Failed to create SSO ticket:', error);
        throw new Error('Failed to generate login ticket');
    }

    return ticket;
}

/**
 * Build the redirect URL for SSO (for use in links or buttons)
 */
export function buildAIToolsRedirectUrl(ticket: string): string {
    return `${AI_TOOLS_CALLBACK_URL}?ticket=${encodeURIComponent(ticket)}`;
}
