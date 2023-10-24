/*SPA aplication all in one*/
//Autenticación

// Ventana emergente al clickar en LOG IN
let loginBtn = document.getElementById("login-btn");
loginBtn.addEventListener("click", function() {
    if (loginBtn.innerHTML == "LOG IN") {
        document.querySelector("#login-popup").toggleAttribute("hidden");
    }
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
const errMsg = document.querySelectorAll('.msgerr');
const errMsgPass = document.querySelector('.msgerr-pass');
const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
const passRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/

// SignUp function
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const signUpEmail = document.getElementById('signup-email').value;
    const signUpPassword = document.getElementById('signup-pass').value;
    const signUpUser = document.getElementById('signup-user').value;
    const usersRef = collection(db, "users");

    // Validacion con Regex
    if (!emailRegex.test(signUpEmail)) {
        errMsg[0].style.display = "block";
        errMsg[0].innerHTML = 'Email inválido';
    } else if (!passRegex.test(signUpPassword)) {
        errMsgPass.style.display = "block";
        errMsgPass.innerHTML = "La contraseña debe contener 8 carácteres, minúscula y mayúscula, números y un caracter especial.";
    } else {

    try {
        //Create auth user
        await createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword)
        .then((userCredential) => { 
          console.log('User registered')
          const user = userCredential.user;
          registerForm.reset();
          document.querySelector("#login-popup").toggleAttribute("hidden");
         })
        //Create document in DB
        await setDoc(doc(usersRef, signUpEmail), {
          username: signUpUser,
          email: signUpEmail
          })
      } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log('Código del error: ' + errorCode);
        console.log('Mensaje del error: ' + errorMessage);
      }
}})

//Login function
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loginEmail = document.getElementById('login-email').value;
    const loginPassword = document.getElementById('login-pass').value;
    //Call the collection in the DB
    const docRef = doc(db, "users", loginEmail);
    //Search a document that matches with our ref
    const docSnap = await getDoc(docRef);
  
    signInWithEmailAndPassword(auth, loginEmail, loginPassword)
      .then((userCredential) => {
        console.log('User authenticated')
        const user = userCredential.user;
        loginForm.reset();
        document.querySelector("#login-popup").toggleAttribute("hidden");
      })
      .catch((error) => {
        errMsg[1].innerHTML='Usuario o contraseña incorrectos';
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log('Código del error: ' + errorCode);
        console.log('Mensaje del error: ' + errorMessage);
      });
})

//Observe the user's state
auth.onAuthStateChanged(user => {
    if(user){
        loginBtn.innerHTML = "LOG OUT"

        //Logout function
        loginBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
            console.log('Logout user')
            loginBtn.innerHTML = "LOG IN"


            }).catch((error) => {
            console.log('Error: ', error)
            });
        })
    }else{
      console.log('No logged user');
    }
})


//global variables
const questionsApiUrl = "https://opentdb.com/api.php?amount=10&difficulty=easy&type=multiple"

let questionsBatch = {}

//for iteration between screens
let actualQuestion = 0

let score = 0;

let miForm;

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
        tmpHtml += `<label class='answer' for='${JSON.stringify(answer)}'>${JSON.stringify(answer)}</label>
        <input type='radio' name='${JSON.stringify(answer)}' id='${JSON.stringify(answer)}' value='${JSON.stringify(answer)}' hidden></input>`;
    });

    return tmpHtml;
}

function generateQuiz(questions) {
    let section = document.querySelector("section#quiz-screen")
    let contentHtml = "<form>"
    let cont = 0
    for (const questionObjet of questions.results) {
        let q = JSON.stringify(questionObjet.question)
        contentHtml += `<fieldset class="contenedor-pregunta" id='Q${cont}' hidden><legend>${q}</legend>`

        //necesito una funcion que asigne esas lineas en orden aleatorio
        contentHtml += generateRandomOrderHtml(questionObjet)

        contentHtml += '</fieldset>'
        cont++
    }
    contentHtml += `<input id="submitAnswers" type='submit' class="pixel2"></input>`
    contentHtml += "</form>"
    section.innerHTML += contentHtml;
}

//---- listeners ----

function validateQuiz(event) {
    event.preventDefault();
    console.log(event.target);
}

function validateOne(event) {

    let preguntaActual = questionsBatch.results[actualQuestion]


    let v = event.target.nextSibling.nextSibling.value
    v = v.slice(1, v.length - 1) //quitar comillas

    if (v == preguntaActual.correct_answer) {
        score++
        event.target.style.background = "green"
    } else {
        event.target.style.background = "red"
    }

    console.log("score -> ",score);

    setTimeout(nextQuestion, 1500)

}

function nextQuestion() {

    if (actualQuestion + 1 < 10) {
        document.querySelector("#Q" + actualQuestion + "").toggleAttribute("hidden");
        document.querySelector("#Q" + (actualQuestion + 1) + "").toggleAttribute("hidden");
        actualQuestion++
    }

    if (actualQuestion + 1 == 10){
        document.querySelector("input#submitAnswers").style.display = "block"
    }

}

//funcion para pasar al quiz
async function start() {

    //aqui se hace una llamada a api
    questionsBatch = await callApi()

    //constrimos quiz con template string
    generateQuiz(questionsBatch)

    let preguntas = document.querySelectorAll("label.answer")
    for (const p of preguntas) {
        p.addEventListener("click", (event) => { validateOne(event) })
    }

    miForm = document.querySelector("form")

    document.querySelector("input#submitAnswers").style.display = "none"

    document.querySelector("#Q0").toggleAttribute("hidden");

    console.log(actualQuestion + 1);

    miForm.addEventListener('submit', (event) => validateQuiz(event) )

    //operaciones visuales despues de tener las preguntas incorporadas 

    //oculto landing
    document.querySelector("section#landing-screen").toggleAttribute("hidden")
    //muestro quiz
    document.querySelector("section#quiz-screen").toggleAttribute("hidden")

}

// ------ events -------

window.addEventListener("load", () => {

    //start click
    document.querySelector("button.quiz-start-btn")
        .addEventListener("click", () => {
            start()
        })


})


