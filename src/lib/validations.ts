//valid email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
    return EMAIL_REGEX.test(email);
}

//valid password
export function isValidPassword(password: string): string | null {
    if (password.length < 8) {
        return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter";
    }
    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number";
    }
    return null;
}

//valid name
export function isValidName(name: string): string | null {
    if (!name || name.trim().length < 2) {
        return "Name must be at least 2 characters long";
    }
    if (name.trim().length > 50) {
        return "Name must be less than 50 characters";
    }
    return null;
}
