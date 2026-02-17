import { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase.config';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isFirebaseConfigured || !auth) {
            setLoading(false);
            return;
        }

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                    photoURL: firebaseUser.photoURL,
                    createdAt: firebaseUser.metadata.creationTime
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        if (!isFirebaseConfigured) {
            return { success: false, error: 'Firebase is not configured. Please check your .env file.' };
        }
        setError(null);
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: result.user };
        } catch (err) {
            const errorMessage = getErrorMessage(err.code);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const signup = async (name, email, password) => {
        if (!isFirebaseConfigured) {
            return { success: false, error: 'Firebase is not configured. Please check your .env file.' };
        }
        setError(null);
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            // Update profile with display name
            await updateProfile(result.user, {
                displayName: name
            });
            return { success: true, user: result.user };
        } catch (err) {
            const errorMessage = getErrorMessage(err.code);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const loginWithGoogle = async () => {
        if (!isFirebaseConfigured) {
            return { success: false, error: 'Firebase is not configured. Please check your .env file.' };
        }
        setError(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return { success: true, user: result.user };
        } catch (err) {
            const errorMessage = getErrorMessage(err.code);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const loginWithFacebook = async () => {
        if (!isFirebaseConfigured) {
            return { success: false, error: 'Firebase is not configured. Please check your .env file.' };
        }
        setError(null);
        try {
            const result = await signInWithPopup(auth, facebookProvider);
            return { success: true, user: result.user };
        } catch (err) {
            const errorMessage = getErrorMessage(err.code);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        if (!isFirebaseConfigured) {
            setUser(null);
            return { success: true };
        }
        try {
            await signOut(auth);
            return { success: true };
        } catch (err) {
            const errorMessage = getErrorMessage(err.code);
            return { success: false, error: errorMessage };
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        signup,
        loginWithGoogle,
        loginWithFacebook,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="min-h-screen flex flex-col items-center justify-center bg-bg-main">
                    <div className="logo-box"><div className="logo-inner"></div></div>
                    <p className="preloader-title">AurisTitutum <span>| PRO</span></p>
                </div>
            ) : !isFirebaseConfigured ? (
                <div className="min-h-screen flex items-center justify-center bg-bg-main p-6 text-center">
                    <div className="max-w-md space-y-6">
                        <div className="w-16 h-16 bg-accent-dim rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border-color">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tighter text-text-primary uppercase">Configuration Required</h1>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            Firebase environment variables are missing or invalid. To enable authentication:
                        </p>
                        <div className="bg-card-bg border border-border-color rounded-xl p-4 text-left font-mono text-[10px] space-y-2">
                            <p className="text-success">1. Rename .env.example to .env</p>
                            <p className="text-success">2. Add your Firebase API Keys</p>
                            <p className="text-success">3. Restart the dev server</p>
                        </div>
                        <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-8">
                            AurisTitutum PRO Core System
                        </p>
                    </div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};

// Helper function to convert Firebase error codes to user-friendly messages
function getErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Invalid email address format';
        case 'auth/user-disabled':
            return 'This account has been disabled';
        case 'auth/user-not-found':
            return 'No account found with this email';
        case 'auth/wrong-password':
            return 'Incorrect password';
        case 'auth/email-already-in-use':
            return 'Email already registered';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters';
        case 'auth/operation-not-allowed':
            return 'Operation not allowed';
        case 'auth/popup-closed-by-user':
            return 'Sign-in cancelled';
        case 'auth/cancelled-popup-request':
            return 'Sign-in cancelled';
        default:
            return 'Authentication error. Please try again';
    }
}
