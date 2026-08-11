/**
 * getAvatarColor
 * ──────────────
 * Returns a consistent Tailwind bg + text class pair based on the input string (name/id).
 * The same name always maps to the same color across the app.
 */
const AVATAR_COLORS = [
    'bg-violet-500 text-white',
    'bg-blue-500 text-white',
    'bg-cyan-500 text-white',
    'bg-emerald-500 text-white',
    'bg-amber-500 text-white',
    'bg-orange-500 text-white',
    'bg-rose-500 text-white',
    'bg-pink-500 text-white',
    'bg-indigo-500 text-white',
    'bg-teal-500 text-white',
    'bg-lime-500 text-white',
    'bg-fuchsia-500 text-white',
];

export function getAvatarColor(name: string): string {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
        hash |= 0; // Convert to 32-bit int
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
}
