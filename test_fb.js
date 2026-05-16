import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDjkyfgdzX4gazj3Ghx6R-7Gq_1nHV0stA",
    authDomain: "deneme2-c2a48.firebaseapp.com",
    projectId: "deneme2-c2a48"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const snap = await getDocs(query(collection(db, "users")));
    snap.forEach(doc => {
        console.log(doc.id, doc.data().username, doc.data().role, doc.data().name);
    });
  } catch (e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}
test();
