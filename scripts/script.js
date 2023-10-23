/*SPA aplication all in one*/
//Autenticación

// Ventana emergente al clickar en LOG IN
let loginBtn = document.getElementById("login-btn");
loginBtn.addEventListener("click", function() {
    document.querySelector("#login-popup").toggleAttribute("hidden");
})

// Importar las funciones
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-firestore.js";

// Configuración de la app web
const firebaseConfig = {
    apiKey: "AIzaSyC8vG86WWksaPgBkjwcCdMQX39jUd7Tuy8",
    authDomain: "quiz-volumen-2.firebaseapp.com",
    projectId: "quiz-volumen-2",
    storageBucket: "quiz-volumen-2.appspot.com",
    messagingSenderId: "636391191506",
    appId: "1:636391191506:web:a62f7f34fc9357d02d0e0b"
  };

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth
const auth = getAuth();
const user = auth.currentUser;
// Inicializar DDBB
const db = getFirestore(app);

// Selectores
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById('login-form');

// SignUp function
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const signUpEmail = document.getElementById('signup-email').value;
    const signUpPassword = document.getElementById('signup-pass').value;
    const signUpUser = document.getElementById('signup-user').value;
    const usersRef = collection(db, "users");
    try {
        //Create auth user
        await createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword)
        .then((userCredential) => {
          console.log('User registered')
          const user = userCredential.user;
          registerForm.reset();
        })
        //Create document in DB
        await setDoc(doc(usersRef, signUpEmail), {
          username: signUpUser,
          email: signUpEmail
          })
      } catch (error) {
        console.log('Error: ', error)
      }
})


//global variables
const questionsApiUrl = "https://opentdb.com/api.php?amount=10&difficulty=easy&type=multiple"

let questionsBatch = {}

//---- aux --------


//api call obtengo batch de preguntas
async function callApi() {

    return await fetch(questionsApiUrl)
        .then(res => res.json())
        .then((data) => {
            return data;
        })
        .catch((error) => console.error("Error calling to api: ", error));//si llega aqui pasa algo con la api
}

//para mezcar un array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

//aleatorizar donde esta la respuecta correcta
function generateRandomOrderHtml(questionObjet) {

    const answers = questionObjet.incorrect_answers.slice();
    answers.push(questionObjet.correct_answer);

    //barajea las breguntas
    shuffleArray(answers);

    let tmpHtml = '';
    answers.forEach(answer => {
        tmpHtml += `<label for='${JSON.stringify(answer)}' onclick='validateOne()'>${JSON.stringify(answer)}</label>
        <input type='radio' name='${JSON.stringify(answer)}' id='${JSON.stringify(answer)}' hidden></input>`;
    });

    return tmpHtml;
}

function generateQuiz(questions) {
    let section = document.querySelector("section#quiz-screen")
    let contentHtml = "<form>"

    for (const questionObjet of questions.results) {
        let q = JSON.stringify(questionObjet.question)
        contentHtml += `<fieldset class="contenedor-pregunta"><legend>${q}</legend>`

        //necesito una funcion que asigne esas lineas en orden aleatorio
        contentHtml += generateRandomOrderHtml(questionObjet)

        contentHtml += '</fieldset>'

    }
    contentHtml += `<input type='submit' class="pixel2">`
    contentHtml += "</form>"
    section.innerHTML += contentHtml;
}

//---- listeners ----

function validateQuiz() {
    event.preventDefault();
    console.log(event.target);
}

function validateOne() {
    console.log(event.target);
}

//funcion para pasar al quiz
async function start() {

    //aqui se hace una llamada a api
    questionsBatch = await callApi()
    generateQuiz(questionsBatch)

    document.querySelector("form").addEventListener('submit', validateQuiz)

    //operaciones visuales despues de tener las preguntas incorporadas 

    //oculto landing
    document.querySelector("section#landing-screen").setAttribute("hidden", "")
    //muestro quiz
    document.querySelector("section#quiz-screen").removeAttribute("hidden")

}

// ------ events -------

window.addEventListener("load", () => {

    //start click
    document.querySelector("button.quiz-start-btn")
        .addEventListener("click", () => {
            start()
        })


})


