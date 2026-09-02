import { API_URL } from "@/config";
import type { User } from "@chessu/types";

async function readServerMessage(res: Response, fallback: string) {
    try {
        const body = (await res.json()) as { message?: unknown };
        if (typeof body.message === "string" && body.message.trim()) {
            return body.message;
        }
    } catch {
        // Fall back to a client-safe message when the response has no JSON body.
    }
    return fallback;
}

export const fetchSession = async () => {
    try {
        const res = await fetch(`${API_URL}/v1/auth`, {
            credentials: "include"
        });

        if (res && res.status === 200) {
            const user: User = await res.json();
            return user;
        }
    } catch (err) {
        // do nothing
    }
};

export const setGuestSession = async (name: string) => {
    try {
        const res = await fetch(`${API_URL}/v1/auth/guest`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name })
        });
        if (res.status === 201) {
            const user: User = await res.json();
            return user;
        }
        if (!res.ok) {
            return readServerMessage(res, "Unable to enter as a guest grower.");
        }
    } catch (err) {
        console.error(err);
        return "Unable to reach the Kush Kings server.";
    }
};

export const register = async (name: string, password: string, email?: string) => {
    try {
        const res = await fetch(`${API_URL}/v1/auth/register`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, password, email })
        });
        if (res.status === 201) {
            const user: User = await res.json();
            return user;
        }
        if (!res.ok) {
            return readServerMessage(res, "Unable to create the grower account.");
        }
    } catch (err) {
        console.error(err);
        return "Unable to reach the Kush Kings server.";
    }
};

export const login = async (name: string, password: string) => {
    try {
        const res = await fetch(`${API_URL}/v1/auth/login`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, password })
        });
        if (res.status === 200) {
            const user: User = await res.json();
            return user;
        }
        if (!res.ok) {
            return readServerMessage(res, "Unable to sign in to the grower account.");
        }
    } catch (err) {
        console.error(err);
        return "Unable to reach the Kush Kings server.";
    }
};

export const logout = async () => {
    try {
        const res = await fetch(`${API_URL}/v1/auth/logout`, {
            method: "POST",
            credentials: "include"
        });
        if (res.status === 204) {
            return true;
        }
    } catch (err) {
        console.error(err);
    }
};

export const updateUser = async (name?: string, email?: string, password?: string) => {
    try {
        if (!name && email === undefined && !password) return;
        const res = await fetch(`${API_URL}/v1/auth/`, {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        });
        if (res.status === 200) {
            const user: User = await res.json();
            return user;
        }
        if (!res.ok) {
            return readServerMessage(res, "Unable to update the grower profile.");
        }
    } catch (err) {
        console.error(err);
        return "Unable to reach the Kush Kings server.";
    }
};
