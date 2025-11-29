import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    });

    const [users, setUsers] = useState(() => {
        const saved = localStorage.getItem('users');
        return saved ? JSON.parse(saved) : [];
    });

    const register = (userData) => {
        // Check if phone already exists
        if (users.some(u => u.phone === userData.phone)) {
            throw new Error('Bu telefon numarası ile kayıtlı bir kullanıcı zaten var.');
        }
        // Check if email already exists
        if (users.some(u => u.email === userData.email)) {
            throw new Error('Bu e-posta adresi ile kayıtlı bir kullanıcı zaten var.');
        }
        const newUser = {
            ...userData,
            id: Date.now(),
            registrationDate: new Date().toISOString(), // Add registration date
            diagnoses: [], // Initialize empty diagnoses array
            prosthesisStep: 0 // Initialize prosthesis step
        };
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        return newUser;
    };

    // Rate Limiting State
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState(null);

    const login = (identifier, password) => {
        // Check Lockout
        if (lockoutUntil && new Date() < lockoutUntil) {
            const remaining = Math.ceil((lockoutUntil - new Date()) / 1000);
            throw new Error(`Çok fazla başarısız deneme. Lütfen ${remaining} saniye bekleyin.`);
        }

        // Check for Admin Login first
        if (identifier === 'admin' && password === 'admin123') {
            setLoginAttempts(0); // Reset on success
            setLockoutUntil(null);
            const adminUser = {
                name: 'Admin',
                role: 'admin',
                username: 'admin'
            };
            setUser(adminUser);
            localStorage.setItem('currentUser', JSON.stringify(adminUser));
            return adminUser;
        }

        // Check for Regular User Login
        const foundUser = users.find(u => u.phone === identifier && u.password === password);

        if (foundUser) {
            setLoginAttempts(0); // Reset on success
            setLockoutUntil(null);
            const userWithRole = { ...foundUser, role: 'user' };
            setUser(userWithRole);
            localStorage.setItem('currentUser', JSON.stringify(userWithRole));
            return userWithRole;
        }

        // Handle Failure
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        if (newAttempts >= 5) {
            const lockoutTime = new Date(new Date().getTime() + 30 * 1000); // 30 seconds lockout
            setLockoutUntil(lockoutTime);
            throw new Error('Çok fazla başarısız deneme. 30 saniye engellendiniz.');
        }

        throw new Error(`Giriş bilgileri hatalı. Kalan hakkınız: ${5 - newAttempts}`);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
    };

    const updateUser = (updatedData) => {
        if (!user) return;

        // Check uniqueness if phone or email is being changed
        if (updatedData.phone && updatedData.phone !== user.phone) {
            if (users.some(u => u.phone === updatedData.phone)) {
                throw new Error('Bu telefon numarası başka bir kullanıcı tarafından kullanılıyor.');
            }
        }
        if (updatedData.email && updatedData.email !== user.email) {
            if (users.some(u => u.email === updatedData.email)) {
                throw new Error('Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.');
            }
        }

        const updatedUser = { ...user, ...updatedData };
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        // Update in users array
        const updatedUsers = users.map(u => u.phone === user.phone ? updatedUser : u);
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
    };

    const updateSpecificUser = (targetPhone, updatedData) => {
        const targetUser = users.find(u => u.phone === targetPhone);
        if (!targetUser) return;

        // Check uniqueness if phone or email is being changed
        if (updatedData.phone && updatedData.phone !== targetUser.phone) {
            if (users.some(u => u.phone === updatedData.phone)) {
                throw new Error('Bu telefon numarası başka bir kullanıcı tarafından kullanılıyor.');
            }
        }
        if (updatedData.email && updatedData.email !== targetUser.email) {
            if (users.some(u => u.email === updatedData.email)) {
                throw new Error('Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.');
            }
        }

        const updatedUser = { ...targetUser, ...updatedData };

        // Update in users array
        const updatedUsers = users.map(u => u.phone === targetPhone ? updatedUser : u);
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));

        if (user && user.phone === targetPhone) {
            setUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
    };

    const deleteUser = (phone) => {
        const updatedUsers = users.filter(u => u.phone !== phone);
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
    };

    const saveDiagnosis = (diagnosisData) => {
        if (!user) return;

        const newDiagnosis = {
            id: Date.now(),
            date: new Date().toISOString(),
            data: diagnosisData
        };

        const currentDiagnoses = user.diagnoses || [];
        const updatedDiagnoses = [...currentDiagnoses, newDiagnosis];

        updateUser({ diagnoses: updatedDiagnoses });
        updateUser({ diagnoses: updatedDiagnoses });
    };

    const requestPasswordReset = (phone) => {
        const targetUser = users.find(u => u.phone === phone);
        if (!targetUser) {
            // Security: Don't reveal if user exists, but for this demo we might throw or just return false
            // Let's throw for UI feedback in this specific requirement context
            throw new Error('Bu telefon numarası ile kayıtlı kullanıcı bulunamadı.');
        }

        // Simulate Email Sending
        console.log(`
        ----------------------------------------
        [SİMÜLASYON] Şifre Sıfırlama E-postası
        Kime: ${targetUser.email}
        Konu: Şifre Sıfırlama Talebi
        
        Merhaba ${targetUser.name},
        
        Şifrenizi sıfırlamak için lütfen aşağıdaki bağlantıya tıklayın:
        http://localhost:5173/sifre-sifirla?phone=${phone}
        ----------------------------------------
        `);

        return true;
    };

    const resetPassword = (phone, newPassword) => {
        const targetUser = users.find(u => u.phone === phone);
        if (!targetUser) {
            throw new Error('Kullanıcı bulunamadı.');
        }

        const updatedUser = { ...targetUser, password: newPassword };

        // Update in users array
        const updatedUsers = users.map(u => u.phone === phone ? updatedUser : u);
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));

        return true;
    };

    return (
        <AuthContext.Provider value={{
            user,
            register,
            login,
            logout,
            updateUser,
            updateSpecificUser,
            deleteUser,
            saveDiagnosis,
            requestPasswordReset,
            resetPassword,
            users // Export users for admin panel
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
