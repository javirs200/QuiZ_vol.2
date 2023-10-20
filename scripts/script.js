/*SPA aplication all in one*/
//global variables
const questionsApiUrl = "https://opentdb.com/api.php?amount=10&difficulty=easy&type=multiple"

let questionsBatch = {}

//---- aux --------

async function callApi() {
    //TODO javi lamada a la api
    return await fetch(questionsApiUrl)
        .then(res => res.json())
        .then((data)=>{
            return data;
        })
        .catch((error) => console.error("Error calling to api: ", error));//si llega aqui pasa algo con la api
}
}

//---- listeners ----

//funcion para pasar al quiz
async function start() {


    //aqui se hace una llamada a api
    questionsBatch = await callApi()
    generateQuiz(questionsBatch)

    //operaciones visuales despues de tener las preguntas incorporadas 

    //oculto landing
    document.querySelector("section#landing-screen").setAttribute("hidden","")
    //muestro quiz
    document.querySelector("section#quiz-screen").removeAttribute("hidden")
    
}

// ------ events -------

window.addEventListener("load",()=>{

    //start click
    document.querySelector("input#quiz-start-btn")
        .addEventListener("click",()=>{
            start()
        })


})