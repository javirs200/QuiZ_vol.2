/*SPA aplication all in one*/

//---- aux --------

function generateQuiz() {
    //TODO javi lamada a la api
}

//---- listeners ----

function start() {
    //aqui se hace una llamada a api por lo tanto conviene que esten generadas las preguntas antes de mostrarlas
    generateQuiz()
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