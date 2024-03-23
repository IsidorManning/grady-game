var isSTEMStudent;

function formatTime(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let hours = date.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // Handle midnight (0:00) as 12
    const minutes = date.getMinutes().toString().padStart(2, '0'); // Add leading zero if needed
    const dayOfWeek = days[date.getDay()];
    const month = months[date.getMonth()];
    const dayOfMonth = date.getDate();
    const year = date.getFullYear();

    return `${dayOfWeek} ${month} ${dayOfMonth} ${year} ${hours}:${minutes}${ampm}`;
}

class Grady {
    constructor(screenInstance, mode) {
        this.screen = screenInstance;

        this.MODE = mode;
        if (this.MODE === 1) this.updatePlot();

        this.DELTA = 0.1;

        this.a = this.getRandomInt(1, 20);
        this.b = this.getRandomInt(-10, 10);
        this.c = this.getRandomInt(-10, 10);

        console.log(`Parabola generated: (${this.a}x^2) + (${this.b}x) + (${this.c})`)
        console.log('Minimum x value:', -(this.b) / (2.0 * this.a))

        this.startTime = null;
        this.timeThisGuess = null;

        this.guessCounter = 0;
        this.guessesX = [];
        this.guessesY = [];
    }
    
    makeGuess(guess) {
        const promptElement = document.getElementById('dynamic-prompt');

        if (this.startTime === null) this.startTime = new Date();
        const date = new Date();
        const totalTime = (date - this.startTime) / 1000; 

        this.guessCounter++;
        const y =  this.a * guess * guess + this.b * guess + this.c;

        if (this.firstDerivative(guess)) {
            // this.screen.saveTableToCSV();

            document.getElementById('input-form').remove();
           document.getElementById('table-container').remove();
            if (this.MODE === 1) this.screen.deletePlot();

            const winMessage = `Congrats! You found the global 
            extrema within +/-${this.DELTA} of (${guess}, ${y}). \n
            It took you ${this.guessCounter} attempts in total."`
            this.screen.endGamePage(winMessage);
        } 
        else {
            const wrongMessage = `Wrong! At x = ${guess}, the function's value is ${y}`;
            promptElement.innerHTML = wrongMessage;

            let timeThisGuess = 0;
            if (this.timeThisGuess !== null) {
                timeThisGuess = (date - this.timeThisGuess) / 1000;
            }
            this.timeThisGuess = date;

            this.screen.addEntryToTable(guess, y, timeThisGuess, totalTime, formatTime(date));

            // Store the guess data
            this.guessesX.push(guess);
            this.guessesY.push(y);

            // Update the plot with the new guess data
            if (this.MODE === 1) this.updatePlot();
        }
    }

    updatePlot() {
        const trace = {
            x: this.guessesX,
            y: this.guessesY,
            type: 'scatter',
            mode: 'markers',
            name: 'User Guesses',
            marker: {
                color: 'red',
                size: 10
            }
        };
    
        const layout = {
            title: 'Guesses Plot',
            xaxis: {
                title: 'X-axis',
                fixedrange: true // Disable rescaling on the x-axis
            },
            yaxis: {
                title: 'Y-axis',
                fixedrange: true // Disable rescaling on the y-axis
            },
            dragmode: 'pan', // Enable click-and-drag for panning
            uirevision: true, // Ensure updates to the layout are retained
            hovermode: 'closest', // Set hovermode
            xaxis: { fixedrange: false },
            yaxis: { fixedrange: false },
        };
        
        const config = {
            displayModeBar: false,
            scrollZoom: true,
        }
    
        Plotly.newPlot('plot', [trace], layout, config);
    }    

    firstDerivative(x) {
        const fPrime = (2.0 * this.a * x) + this.b;
        if (this.DELTA >= fPrime && fPrime >= -(this.DELTA)) {
            return true;
        } else {
            return false;
        }
    }

    getRandomInt(max, min) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    handleGuess() {
        const guessAsString = document.getElementById('guess-input').value;
        document.getElementById('input-form').reset();

        if (guessAsString === 'I give up' || guessAsString === 'i give up') {
            // this.screen.saveTableToCSV();

            document.getElementById('input-form').remove();
            document.getElementById('table-container').remove();
            if (this.MODE === 1) this.screen.deletePlot();

            const loseMessage = 'Maybe next time...';
            this.screen.endGamePage(loseMessage);
            return;
        }
        else if (!this.isValid(guessAsString)) {
            const errorMessage = `That is not valid input! Please enter any real number.`;
            document.getElementById('dynamic-prompt').innerHTML = errorMessage;
            return;
        }

        const guessAsFloat = parseFloat(guessAsString);
        this.makeGuess(guessAsFloat);
    }

    isValid(string) {
        const floatRegex = /^-?\d*\.?\d+$/;
        return floatRegex.test(string);
    }
}

class Screen {
    constructor() {
        this.contentContainer = document.getElementById('content');
    }

    STEMQUestion = () => {
        // Create the buttons
        const yesButton = document.createElement('button');
        yesButton.className = 'button-base';
        yesButton.textContent = 'Yes';
        
        const noButton = document.createElement('button');
        noButton.className = 'button-base';
        noButton.textContent = 'No';
        noButton.style.marginTop = '10px';

        const skipButton = document.createElement('button');
        skipButton.className = 'button-base';
        skipButton.textContent = 'Skip';
        skipButton.style.marginTop = '10px';

        // Create the prompt message
        const promptMessage = document.createElement('p');
        promptMessage.innerHTML = 'Are you a STEM person?'
        promptMessage.className = 'prompt font';

        // Create a container div to hold the buttons and message
        const container = document.createElement('div');
        container.className = 'stem-question-container'
        container.style.opacity = '0';


        container.appendChild(promptMessage);
        container.appendChild(yesButton);
        container.appendChild(noButton);
        container.appendChild(skipButton);
    
        // Append the container to the body
        this.contentContainer.appendChild(container);
        this.smoothlyFadeIn(container);
    
        yesButton.onclick = () => {
            isSTEMStudent = 'yes';
            container.remove();
            this.initiateGame();
        }
        noButton.onclick = () => {
            isSTEMStudent = 'no';
            container.remove();
            this.initiateGame();
        }
        skipButton.onclick = () => {
            isSTEMStudent = 'skip';
            container.remove();
            this.initiateGame();
        }
    }
    
    initiateGame = () => {
        const randomMode = Math.round(Math.random());
        this.showMode(randomMode);
        
        const promptStringHeader = `I came up with a random quadratic curve. 
        Guess an x value to find a global minimum.`;
        const promptHeaderElement = this.createPrompt(promptStringHeader);
        promptHeaderElement.id = 'header-prompt';

        if (randomMode === 1) {
            const plotContainer = document.createElement('div');
            plotContainer.style.opacity = '0';
            plotContainer.id = 'plot';
            plotContainer.className = 'plot-container';
            this.contentContainer.appendChild(plotContainer);
            this.smoothlyFadeIn(plotContainer)
        }


        this.gradyInstance = new Grady(this, randomMode);


        const promptElement = this.createPrompt('');
        promptElement.id = 'dynamic-prompt';

        this.createInputForm();
    }

    showMode(mode) {
        const modeDispalyElement = document.getElementById('mode-display');
        const analyticalRepr = 'Game mode: Prepare to Confront the Analytical Daemon!';
        const visualRepr = 'Game mode: Prepare to Confront the Visual Daemon!';
        const modeRepr = (mode === 0) ? analyticalRepr : visualRepr;
        modeDispalyElement.innerHTML = modeRepr;
    }

    createPrompt = (string) => {
        const promptElement = document.createElement('p');
        promptElement.style.opacity = '0';
        const promptString = string;
        promptElement.className = 'prompt font';
        promptElement.innerHTML = promptString;

        this.smoothlyFadeIn(promptElement);
        this.contentContainer.appendChild(promptElement);

        return promptElement;
    }

    deletePrompts() {
        // Convert HTMLCollection to array using Array.from()
        Array.from(document.getElementsByClassName('prompt')).forEach(element => {
            element.remove();
        });
    }

    deletePlot() {
        const plotContainer = document.getElementById('plot');
        if (plotContainer) {
            plotContainer.remove();
        }
    }

    createInputForm = () => {
        const form = document.createElement('form');
        form.id = 'input-form';
        form.className = 'input-form';
        form.style.opacity = '0';

        const guessInput = document.createElement('input');
        guessInput.className = 'guess-input';
        guessInput.id = 'guess-input';
        guessInput.type = 'text';
        guessInput.placeholder = "Make a guess for X";

        const guessButton = document.createElement('button');
        guessButton.className = 'guess-button button-base';
        guessButton.id = 'guess-button';
        guessButton.innerHTML = 'Guess';

        form.appendChild(guessInput);
        form.appendChild(guessButton);

        form.onsubmit = (event) => {
            event.preventDefault(); // Prevent default form submission
            this.gradyInstance.handleGuess();
        };

        this.contentContainer.appendChild(form);
        this.smoothlyFadeIn(form);

        this.createTable();
    }

    createTable = () => {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        tableContainer.style.opacity = '0';
        tableContainer.id = 'table-container';

        const table = document.createElement('table');
        table.className = 'guess-table font';
        table.id = 'table';
    
        // Create table headers
        const headersRow = table.insertRow();

        const labelHeader = headersRow.insertCell();
        labelHeader.textContent = 'Labels:';

        const xHeader = headersRow.insertCell();
        xHeader.textContent = 'X';

        const yHeader = headersRow.insertCell();
        yHeader.textContent = 'Y';

        const elapsedTime = headersRow.insertCell();
        elapsedTime.textContent = 'Time This Guess';

        const timePassed = headersRow.insertCell();
        timePassed.textContent = 'Total Time';

        const currentTime = headersRow.insertCell();
        currentTime.textContent = 'Current Time';

        tableContainer.appendChild(table);
        this.contentContainer.appendChild(tableContainer);
        this.smoothlyFadeIn(tableContainer)
    }
    
    addEntryToTable(x, y, timePassed, totalTime, currentTime) {
        const table = document.getElementById('table');
        const row = table.insertRow();

        // Insert guess index as the first cell
        const indexCell = row.insertCell();
        indexCell.textContent = "Guess " + this.gradyInstance.guessCounter + ':';

        const xCell = row.insertCell();
        xCell.textContent = x;

        const yCell = row.insertCell();
        yCell.textContent = y.toFixed(2);

        const timePassedCell = row.insertCell();
        timePassedCell.textContent = timePassed.toFixed(2) + 's'; 
       
        const totalTimeCell = row.insertCell();
        totalTimeCell.textContent = totalTime.toFixed(2) + 's';
    
        const currentTimeCell = row.insertCell();
        currentTimeCell.textContent = currentTime;
    }

    endGamePage = (promptMessage) => {
        delete this.gradyInstance;
        document.getElementById('header-prompt').remove();

        document.getElementById('dynamic-prompt').innerHTML = promptMessage;
        const playAgainMessage = `Do you want to play again?`;
        const playAgainElement = this.createPrompt(playAgainMessage);
        playAgainElement.style.opacity = '0';

        const playAgainButtons = document.createElement('div');
        playAgainButtons.className = 'play-again-buttons-container';
        playAgainButtons.id = 'play-again-buttons-container';
        playAgainButtons.style.opacity = '0';

        const yesButton = document.createElement('button');
        yesButton.className = 'yes-button button-base';
        yesButton.id = 'yes-button';
        yesButton.innerHTML = 'Yes';
        yesButton.onclick = () => {
            this.deletePrompts();
            this.initiateGame();
        }

        const noButton = document.createElement('button');
        noButton.className = 'no-button button-base';
        noButton.id = 'no-button';
        noButton.innerHTML = 'No';
        noButton.onclick = () => {
            location.reload();
        }

        playAgainButtons.appendChild(yesButton);
        playAgainButtons.appendChild(noButton);
        
        this.contentContainer.appendChild(playAgainButtons);
        this.smoothlyFadeIn(playAgainElement);
        this.smoothlyFadeIn(playAgainButtons);
    }

    /**
        * Save table contents to CSV including global variable isSTEMStudent
    */
    saveTableToCSV() {
        const table = document.getElementById('table');
        const rows = table.querySelectorAll('tr');
        let csvContent = "data:text/csv;charset=utf-8,";

        const headerCells = ['Index', 'X', 'Y', 'Time This Guess', 'Total Time', 'Current Time'];
        csvContent += headerCells.join(',') + '\n';

        rows.forEach(row => {
            const rowData = [];
            row.querySelectorAll('td').forEach(cell => {
                rowData.push(cell.textContent);
            });
            csvContent += rowData.join(',') + '\n';
        });

        // Add isSTEMStudent variable to CSV
        csvContent += `"isSTEMStudent",${isSTEMStudent}\n`;

        // Create download link and trigger download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "table_data.csv");
        document.body.appendChild(link); 
        link.click();
    }

    /**
        * Set's a timout for one quarter of a second before it sets some 
        * inputted element's opacity to 1.
        * 
        * We assume the input-element has a set transition speed so that 
        * the overall effect becomes that the element smoothly fades in.
        * @param {element} element - The element whose opacity to change
    */
    smoothlyFadeIn(element) {
        setTimeout(() => {
            element.style.opacity = "1";
        }, 500);
    }
}

function main() {
    const screen = new Screen();

    const startButton = document.getElementById('start-button');
    startButton.onclick = () => {
        screen.STEMQUestion();
        startButton.remove();
    }
}

document.addEventListener('DOMContentLoaded', main);