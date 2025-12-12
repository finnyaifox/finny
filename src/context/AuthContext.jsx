import { createContext, useContext, useState, useEffect } from 'react';

// Demo user credentials
const DEMO_USER = {
    username: 'Max',
    password: '12345',
    displayName: 'Max Mustermann',
    email: 'max@finny-gmbh.de',
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for stored session on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('finny_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (username, password) => {
        return new Promise((resolve, reject) => {
            // Simulate API call
            setTimeout(() => {
                if (username === DEMO_USER.username && password === DEMO_USER.password) {
                    const userData = {
                        username: DEMO_USER.username,
                        displayName: DEMO_USER.displayName,
                        email: DEMO_USER.email,
                    };
                    setUser(userData);
                    localStorage.setItem('finny_user', JSON.stringify(userData));
                    resolve(userData);
                } else {
                    reject(new Error('Ungültige Anmeldedaten'));
                }
            }, 500);
        });
    };

    const register = (username, email, password) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // In a real app, this would create a new user
                const userData = {
                    username,
                    displayName: username,
                    email,
                };
                setUser(userData);
                localStorage.setItem('finny_user', JSON.stringify(userData));
                resolve(userData);
            }, 500);
        });
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('finny_user');
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
