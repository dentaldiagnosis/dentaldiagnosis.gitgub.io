import { db } from './src/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

async function verifyConnection() {
    console.log("Firebase bağlantısı test ediliyor...");
    try {
        // Try to access a collection (even if empty, it checks connection)
        const querySnapshot = await getDocs(collection(db, "users"));
        console.log("Bağlantı BAŞARILI!");
        console.log(`'users' koleksiyonunda ${querySnapshot.size} doküman bulundu.`);
        process.exit(0);
    } catch (error) {
        console.error("Bağlantı HATASI:", error);
        // Common error: permission-denied if rules are strict and we are not logged in.
        // But connection itself (network) should be fine.
        if (error.code === 'permission-denied') {
            console.log("Not: 'permission-denied' hatası alındı. Bu, Firebase'e erişilebildiğini ancak güvenlik kurallarının okumayı engellediğini gösterir. Yani entegrasyon ÇALIŞIYOR.");
            process.exit(0);
        }
        process.exit(1);
    }
}

verifyConnection();
