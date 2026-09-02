import { API_URL } from "@/config";
import type { Game, User } from "@chessu/types";

const GROWER_NAME_PATTERN = /^[A-Za-z0-9]{2,16}$/;

export const fetchProfileData = async (name: string) => {
    const normalizedName = name.trim();
    if (!GROWER_NAME_PATTERN.test(normalizedName)) return;

    try {
        // TODO: handle caching more efficiently?
        const res = await fetch(`${API_URL}/v1/users/${encodeURIComponent(normalizedName)}`, {
            next: { revalidate: 10 }
        });

        if (res && res.status === 200) {
            const data: User & { recentGames: Game[] } = await res.json();
            return data;
        }
    } catch (err) {
        console.error(err);
    }
};
