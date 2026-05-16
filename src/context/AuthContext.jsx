import { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updatePassword,
    deleteUser as firebaseDeleteUser
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    onSnapshot,
    query,
    where,
    deleteDoc,
    getDocs
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]); // For admin to see all users
    const [loading, setLoading] = useState(true);

    // Rate Limiting State (Local state only for immediate feedback, could be moved to DB)
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState(null);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch user profile from Firestore
                const docRef = doc(db, "users", firebaseUser.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setUser({ ...docSnap.data(), uid: firebaseUser.uid });
                } else {
                    // If profile doesn't exist, it means the user was deleted by admin
                    // Try to auto-delete the auth account
                    try {
                        await firebaseUser.delete();
                        setUser(null);
                    } catch (error) {
                        console.error("Auto-delete failed (likely needs re-auth):", error);
                        // Fallback to manual deletion page
                        setUser({ email: firebaseUser.email, uid: firebaseUser.uid, role: 'deleted' });
                    }
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Listen for all users (Admin feature)
    useEffect(() => {
        // Only listen if current user is admin
        if (user?.role === 'admin') {
            const q = query(collection(db, "users"));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const usersList = [];
                querySnapshot.forEach((doc) => {
                    usersList.push({ ...doc.data(), uid: doc.id });
                });
                setUsers(usersList);
            });
            return () => unsubscribe();
        }
    }, [user?.role]);

    const register = async (userData) => {
        try {
            // Generate sequence based username
            const now = new Date();
            const yearStr = now.getFullYear().toString();
            const monthStr = (now.getMonth() + 1).toString().padStart(2, '0');
            const prefix = `${yearStr}${monthStr}`;

            // Firestore rules prevent unauthenticated users from reading the 'users' collection.
            // Therefore, we cannot query the database to find the max sequence number.
            // Instead, we will generate a random 4-digit number to append.
            const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
            const newUsername = `${prefix}${randomSuffix}`;

            const syntheticEmail = `${newUsername}@dentalapp.local`;

            // Password is the same as username
            const userCredential = await createUserWithEmailAndPassword(auth, syntheticEmail, newUsername);
            const firebaseUser = userCredential.user;

            const newUserProfile = {
                ...userData,
                username: newUsername,
                uid: firebaseUser.uid,
                id: Date.now(),
                registrationDate: new Date().toISOString(),
                diagnoses: [],
                prosthesisStep: 0,
                role: 'user'
            };

            await setDoc(doc(db, "users", firebaseUser.uid), newUserProfile);
            setUser(newUserProfile);

            return newUserProfile;
        } catch (error) {
            console.error("Registration Error:", error);
            throw new Error('Kayıt işlemi sırasında bir hata oluştu: ' + error.message);
        }
    };

    const login = async (identifier, password) => {
        // Check Lockout
        if (lockoutUntil && new Date() < lockoutUntil) {
            const remaining = Math.ceil((lockoutUntil - new Date()) / 1000);
            throw new Error(`Çok fazla başarısız deneme. Lütfen ${remaining} saniye bekleyin.`);
        }

        try {
            // Admin Check
            if (identifier === 'mehmetgucel' && password === 'APPLEagree123.') {
                const adminEmail = 'mehmetgucel@dentalapp.admin';
                let userCredential;

                try {
                    // Try to login as admin
                    userCredential = await signInWithEmailAndPassword(auth, adminEmail, password);
                } catch (error) {
                    // If user not found, create it (Auto-provisioning)
                    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                        try {
                            userCredential = await createUserWithEmailAndPassword(auth, adminEmail, password);

                            // Create Admin Profile in Firestore
                            const adminUser = {
                                name: 'Admin',
                                surname: 'User',
                                role: 'admin',
                                username: 'mehmetgucel',
                                uid: userCredential.user.uid,
                                email: adminEmail,
                                registrationDate: new Date().toISOString()
                            };

                            await setDoc(doc(db, "users", userCredential.user.uid), adminUser);
                        } catch (createError) {
                            console.error("Admin creation failed:", createError);
                            // If create fails (e.g. email in use but wrong password), we can't recover client-side easily
                            throw new Error("Admin girişi yapılamadı. Lütfen konsolu kontrol edin.");
                        }
                    } else {
                        throw error;
                    }
                }

                // Fetch admin profile
                const docRef = doc(db, "users", userCredential.user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const adminData = docSnap.data();
                    setUser(adminData);
                    return adminData;
                } else {
                    // Should not happen if created above, but handle legacy/edge case
                    const adminUser = {
                        name: 'Admin',
                        role: 'admin',
                        username: 'mehmetgucel',
                        uid: userCredential.user.uid
                    };
                    setUser(adminUser);
                    return adminUser;
                }
            }

            // Regular User Login (Phone -> Synthetic Email)
            // If identifier looks like an email, try it as is (legacy support or admin email)
            // Otherwise treat as phone
            let emailToUse = identifier;
            if (!identifier.includes('@')) {
                const sanitizedIdentifier = identifier.replace(/\s/g, '');
                emailToUse = `${sanitizedIdentifier}@dentalapp.local`;
            }

            const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
            setLoginAttempts(0);
            setLockoutUntil(null);

            // Fetch user data to return it immediately for the caller
            const docRef = doc(db, "users", userCredential.user.uid);
            const docSnap = await getDoc(docRef);
            let userData = { uid: userCredential.user.uid };

            if (docSnap.exists()) {
                userData = { ...userData, ...docSnap.data() };
            } else {
                // If doc doesn't exist but auth does, it means admin deleted the record.
                // Auto-delete the auth account immediately since we have fresh credentials
                await userCredential.user.delete();
                throw new Error('USER_AUTO_DELETED');
            }

            return userData;
        } catch (error) {
            console.error("Login Error:", error);
            const newAttempts = loginAttempts + 1;
            setLoginAttempts(newAttempts);

            if (newAttempts >= 5) {
                const lockoutTime = new Date(new Date().getTime() + 30 * 1000);
                setLockoutUntil(lockoutTime);
                throw new Error('Çok fazla başarısız deneme. 30 saniye engellendiniz.');
            }

            // Better error handling for debugging
            if (error.code === 'auth/network-request-failed') {
                throw new Error('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
            }
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                throw new Error('Giriş başarısız. Telefon numarası veya şifre hatalı.');
            }

            if (error.message === 'USER_AUTO_DELETED') {
                throw error;
            }

            throw new Error(`Giriş hatası: ${error.message}`);
        }
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
    };

    const updateUser = async (updatedData) => {
        if (!user || !user.uid) return;

        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, updatedData);

        // Local state update is automatic via onSnapshot if we listened to it, 
        // but for current user we fetch once. Let's manually update local state for immediate feedback.
        setUser(prev => ({ ...prev, ...updatedData }));
    };

    const updateSpecificUser = async (targetUsername, updatedData) => {
        // Find user by username (Admin feature)
        const targetUser = users.find(u => u.username === targetUsername || u.phone === targetUsername);
        if (!targetUser) return;

        const userRef = doc(db, "users", targetUser.uid);
        await updateDoc(userRef, updatedData);
    };

    const deleteUser = async (username) => {
        // Admin only
        const targetUser = users.find(u => u.username === username || u.phone === username);
        if (!targetUser) return;

        try {
            await deleteDoc(doc(db, "users", targetUser.uid));
            // Update local state immediately for better UX
            setUsers(prev => prev.filter(u => u.uid !== targetUser.uid));
        } catch (error) {
            console.error("Error deleting user:", error);
            throw error;
        }
    };

    const deleteMyAccount = async () => {
        if (!auth.currentUser) return;
        try {
            // Delete from Auth
            await firebaseDeleteUser(auth.currentUser);
            setUser(null);
        } catch (error) {
            console.error("Error deleting auth account:", error);
            // If requires re-auth, we might need to handle that, but usually fresh login is enough.
            if (error.code === 'auth/requires-recent-login') {
                throw new Error("Güvenlik nedeniyle lütfen çıkış yapıp tekrar girdikten sonra deneyin.");
            }
            throw error;
        }
    };

    const saveDiagnosis = async (diagnosisData) => {
        if (!user) return;

        const newDiagnosis = {
            id: Date.now(),
            date: new Date().toISOString(),
            data: diagnosisData
        };

        const currentDiagnoses = user.diagnoses || [];
        const updatedDiagnoses = [...currentDiagnoses, newDiagnosis];

        await updateUser({ diagnoses: updatedDiagnoses });
    };

    const requestPasswordReset = async (username) => {
        // We need to find user by username
        const targetUser = users.find(u => u.username === username || u.phone === username);
        if (!targetUser) throw new Error('Kullanıcı bulunamadı.');

        console.log(`Password reset requested for ${targetUser.username || targetUser.phone}`);
        return true;
    };

    const resetPassword = async (username, newPassword) => {
        // Client side password update requires re-authentication, so we can't do it for another user easily.
        throw new Error("Admin tarafından şifre sıfırlama Firebase'de bu şekilde yapılamaz. Kullanıcıya şifre sıfırlama e-postası gönderilmelidir.");
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
            deleteMyAccount,
            saveDiagnosis,
            requestPasswordReset,
            resetPassword,
            users,
            loading
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
