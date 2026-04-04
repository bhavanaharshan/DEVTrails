// src/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCv5Kj0j0sQuHczIBoLkxbP_4eYWzrVcqI",
  authDomain: "gigshield-bbd70.firebaseapp.com",
  projectId: "gigshield-bbd70",
  storageBucket: "gigshield-bbd70.firebasestorage.app",
  messagingSenderId: "138114120151",
  appId: "1:138114120151:web:a9dddb713397d32432b392",
  measurementId: "G-VHEYBDHV8T"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export default app