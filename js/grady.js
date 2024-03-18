/**
    * Global variable to hold the Grady game instance.
    * @type {Grady}
*/
var myGradyGame;

// Function to initialize the Grady game when the document is ready.
// Creates a new instance of the Grady game, fades in the body content, 
// and sets up event listeners for player types.
$(document).ready(function() {
    // Create a new instance of the Grady game
    myGradyGame = new Grady();
    
    $("body").fadeIn();

    // Event listeners for different player types
    $("#nerd").click(function() { myGradyGame.play('nerd') });
    $("#bird").click(function() { myGradyGame.play('bird') });
    $("#both").click(function() { myGradyGame.play('both') });
    $("#bored").click(function() { myGradyGame.play('bored') });

    // Tooltip behavior for player types
    $("#nerd").mouseover(function() {
        $('#player_type_tooltip').fadeOut(function() {
            $('#player_type_tooltip').text("You're analytical and then artistic");
            $('#player_type_tooltip').fadeIn();
        });
    });

    $("#nerd").mouseout(function() { $('#player_type_tooltip').fadeOut() });

    $("#bird").mouseover(function() {
        $('#player_type_tooltip').fadeTo(function() {
            $('#player_type_tooltip').text("You're artistic and then analytical");
            $('#player_type_tooltip').fadeIn();
        });
    });
    
    $("#bird").mouseout(function() { $('#player_type_tooltip').fadeOut() });

    $("#both").mouseover(function() {
        $('#player_type_tooltip').fadeOut(function() {
            $('#player_type_tooltip').text("You're always both");
            $('#player_type_tooltip').fadeIn();
        });
    });

    $("#both").mouseout(function() { $('#player_type_tooltip').fadeOut() });

    $("#bored").mouseover(function() {
        $('#player_type_tooltip').fadeOut(function() {
            $('#player_type_tooltip').text("You just wanna play!");
            $('#player_type_tooltip').fadeIn();
        });
    });

    $("#bored").mouseout(function() { $('#player_type_tooltip').fadeOut() });

    // Event listener for keyup events on the input field
    $('#grady_input').keyup(gradyInputOnkeyup);
    $('#grady_input').focus();

    // Event listeners for displaying and hiding the about Grady page
    $('#about_grady_link').click(function() { $('#about_grady_page').fadeIn(); });
    $('#about_grady_x').click(function() { $('#about_grady_page').fadeOut(); });
});

// Class encapsulating the Gray game
class Grady {
    constructor() {
        this.urlParams = new URLSearchParams(window.location.search);

        // Initialize properties
        this.playerType = "unknown";
        this.numGuesses = 0;
        this.startTime = Date.now();
        this.prevGuessTime = this.startTime;
        this.gameId = Math.floor(Math.random() * 1000 * 1000 * 1000).toString(16);
        this.bestGuess = NaN;

        // the 'this.trace' variable won't be set until we use the 'this.get_trace'
        // method that will generate a trace and set it equal to 'this.trace'.
        this.trace = NaN;

        // Set game level - Rina/Discord
        //   Lev 1 -> guess must correct to 1 decimal place - Easy (< 10 guesses)
        //   Lev 2 -> guess must correct to 2 places -  Medium (10-20 guesses)
        //   Lev 3 -> guess must be correct to 3 places - Harder (20+ guesses)
        this.level = 1; // Default level
        this.setLevel();
    }

    setLevel() {
        if (this.urlParams.has('level')) {
            const level =  +urlParams.get('level');
            if (isNaN(level) || level < 1  || level > 3) {
                console.error("Requested level " + this.level + " reset to default (1)");
                this.level = 1;
            } else
                this.level = level;
        }
    }

    /**
        * Calculates the y value for a given x.
        * 
        * @param {number} x - The x value.
        * @returns {number} The y value.
    */
    getY = function(x) {
        return this.a * x * x + this.b * x + this.c;
    }
    
    /**
        * Serializes the function in string format.
        * 
        * @returns {string} The serialized function.
    */
    serialize() {
        // this is essentially Wesley's idea from class.
        const a = this.a.toFixed(5), b = this.b.toFixed(5), c = this.c.toFixed(5);
        return "y = " + a + "*x^2 + (" + b + ")*x" + " + (" + c + ")";
    }

    /**
        * Starts playing the game.
        * 
        * @param {string} type - The type of theplayer.
    */
    play(type) {
        this.playerSelfSelectedType = type; // Set player type

        // Generate random coefficients for the function
        this.generateRandomCoefficients();

        // Hide the player-type question, fade in the input panel and set
        // this.input_processor to analytical or visual (50/50 based on Math.random())
        $('#player_type_question').fadeOut(() => {
            $('#grady_prompt').fadeIn(() => {
                $('#grady_input').focus();
            });
        });

        // this.input_processor determines whether the point will be tabulated or graphed
        if (Math.random() >= 0.5) {
            $('#subtitle').text('Hooray! You have been chosen to face off with the Analytical Daemon!')
            this.input_processor = this.processXAnalytical;
	        this.startLogit("analytical");
        } else {
            $('#subtitle').text('Hooray! You have been chosen to face off with the Visual Daemon!')
            this.input_processor = this.processXVisual;
	        this.startLogit("visual");
        }
    }
    
    // Method to generate random coefficients for the function
    generateRandomCoefficients() {
        // adding 0.1 avoids a = 0 since this wold generate a linear function 
        // with no minima.
        this.a = Math.random() * 10 + .1;
        this.b = Math.random() * 20 - 10;
        this.c = Math.random() * 20 - 10;

        this.min = -this.b / (2 * this.a);  // -b / (2a)
    }    

    /**
        * Processes input (a guess for the x value) when the user is in the 
        * analytical mode. Results will be tabulated
        * 
        * @param {number} x - The guess for the x value.
    */
    processXAnalytical(x) {
        const hdr = `<tr id=grady_tbl_hdr>
                        <th>Guess #</th>
                        <th>x</th>
                        <th>y</th>
                        <th>Time for this guess</th>
                        <th>Total time</th>
                        <th>Time of guess</th>
                    </tr>`;

        if (++this.numGuesses == 1) {
            $('#analytical_results').fadeIn();
            $('#analytical_results_table').append(hdr);
        }

        this.attemptLogit(x)

        const now = new Date();
        const timeForThisGuess = now - this.prevGuessTime;
        const totalTime = now - this.startTime;
        const formattedTimeForThisGuess = (timeForThisGuess / 1000).toFixed(3) + 's';
        const formattedTotalTime = (totalTime / 1000).toFixed(3) + 's';

        // Build HTML for the new row
        const newRowHTML = `<tr>
                                <td>${this.numGuesses}</td>
                                <td>${x}</td>
                                <td>${this.getY(x).toFixed(5)}</td>
                                <td>${formattedTimeForThisGuess}</td>
                                <td>${formattedTotalTime}</td>
                                <td>${now.toLocaleString()}</td>
                            </tr>`;
                        
        $('#grady_tbl_hdr').after(newRowHTML); // Insert after the header
        this.prevGuessTime = now;

        this.checkAndUpdateGuess(x); 

        document.getElementById('best-guess-holder').innerHTML = `
            Your best guess so far was x = ${this.bestGuess},
            where y = ${this.getY(this.bestGuess).toFixed(2)}.
        `

    }

    /**
        * Processes the player's input when they are in the visual mode.
        * Results will be graphed
        * @param {number} x - The player's input (guess for the x value).
    */
    processXVisual(x) {
        // Check if this is the first guess
        if (++this.numGuesses == 1) {
            $('#visual_results').fadeIn();

            // Create a brand new plot
            const trace = this.getPlotTrace();
            // we save the trace dictionary in an instance variable since we will need
            // it for futre guesses to update the data.
            this.trace = trace;
            const layout = this.getPlotLayout();
            const config = { displayModeBar: false, scrollZoom: true, responsive: true };
            Plotly.newPlot('visual_results_plot', [trace], layout, config);
        }

        this.attemptLogit(x);
        
        const y = this.getY(x);
        this.trace.x.push(x);
        this.trace.y.push(y);

        // Update existing trace with new x and y data
        Plotly.restyle('visual_results_plot', 'x', [this.trace.x], [0]);
        Plotly.restyle('visual_results_plot', 'y', [this.trace.y], [0]);

        this.checkAndUpdateGuess(x);
    }
    
    /**
        * Checks and updates the player's guess, determining if it's the best guess and if 
        * it meets the criteria for showing the results screen. If the guess is the best so 
        * far, it updates the best guess value. If the guess is within the specified level 
        * of precision to the true minimum, it triggers the display of the results screen 
        * with a success message. Otherwise, the game continues...
        * 
        * @param {number} x - The player's guess for the x value.
    */
    checkAndUpdateGuess(x) {
        if (!$.isNumeric(this.bestGuess) || Math.abs(this.min-this.bestGuess) > Math.abs(this.min-x))
            this.bestGuess = x;

            // Essentially line 49 of Rui's class code in onlinegdb - within .1% of true min
            // if (Math.abs(x - this.min) <= 0.001 * Math.abs(this.min)) {
            //     // maybe sound flourish 1.5s
            //     this.show_results_screen(x, "Hooray!") // Doesn't return
            // }
        if (parseFloat(x.toFixed(this.level)) == parseFloat(this.min.toFixed(this.level))) // Changed per Ryan's suggestion
            this.showResultsScreen(x, "Hooray!");

        $('#grady_input').focus();
        $('#grady_input').attr('placeholder', getNewPlaceholder());
    }

    /**
        * Returns the plot trace object for visual processing.
        * 
        * @returns {Object} The plot trace object containing x and y coordinates 
        * of the guesses.
    */
    getPlotTrace() {
        const trace = {
            x: [], 
            y: [],
            type: 'scatter',
            mode: 'markers',
            name: 'Your Guesses',
            marker: {
                color: 'red',
                symbol: 'cross',
            },
        };
        return trace;
    }

    /**
        * Returns the plot layout object for visual processing.
        * 
        * @returns {Object} The plot layout object containing the title and display settings.
    */
    getPlotLayout() {
        const layout = {
            title: 'Your last few Points Graphed (Interactive)',
            showlegend: false,
            dragmode: 'pan', // Enable click-and-drag for panning
            uirevision: true, // Ensure updates to the layout are retained
            hovermode: false, // Set hovermode
        };
        return layout;
    }
    
    /**
        * Displays the final results screen.
        * 
        * @param {number} x - The player's last guess.
        * @param {string} outcome - The outcome of the game ('Hooray!' or 'Alas!').
    */
    showResultsScreen(x, outcome) {
        this.finalLogit(outcome);
	
        let result = "<div class=title>" + outcome + "</div>" +
            "<div class=subtitle>You took " + this.numGuesses + " Guesses</div><br>";
            
        result += "<div class=grady_final_stats_text>" +
            "The correct minimum was " + this.min.toFixed(5) + "<br>";

	    if (!isNaN(this.bestGuess)) result += "Your best  guess was " + this.bestGuess + "<p>";

	    result += "And your last guess was " + x + "<p>" +
            "The function was " + this.serialize() + "</div><br>";

        result += "<div class=grady_final_stats_text>(Global statistics on Grady will be available here)</div><p>";
        result += "Refresh your browser for another game";

        $('#grady_final_stats').html(result);
        $('#grady_prompt').fadeOut(function() { $('#grady_final_stats').fadeIn() });
    }

    startLogit(game_type) {
        var param = {
            "i": this.gameId, 
            "p": this.playerSelfSelectedType, 
            "g": game_type, 
            "l": this.level, 
            "a": this.a, 
            "b": this.b, 
            "c": this.c, 
            "m": this.min,
            "t": Date.now(),
        };
        $.post("php/logit_s.php", param, function(res) { })
    }
    
    attemptLogit(x) {
        var param = {
            "i": this.gameId, 
            "x": x, 
            "y": this.getY(x), 
            "n": this.numGuesses, 
            "t": Date.now(),
        };
        $.post("php/logit_a.php", param, function(res) { })
    }
    
    // game_id has "f" appended to distinguish from a regular in-game log line, 
    // which will have an A appended instead.
    finalLogit(outcome) {
        var param = {
            "i": this.gameId, 
            "o": outcome, 
            "n": this.numGuesses, 
            "t": Date.now(),
        };
        $.post("php/logit_f.php", param, function(res) { })
    }
} 

/**
    * Handles the keyup event on the input field.
    * 
    * @param {Event} e - The keyup event object.
*/
function gradyInputOnkeyup(e) {
    if (e == null) return;

    var KEY_ESC = 27, KEY_CR = 13, KEY_NL = 10;

    if (e.which == KEY_ESC && $('#grady_input').val() != "") {
        $('#grady_input').val("");
    }  else if (e.which == KEY_CR || e.which == KEY_NL) {
        let x = $('#grady_input').val();
        $('#grady_input').val('');

        if ($.isNumeric(x))
            myGradyGame.input_processor(parseFloat(x));
        else if (x.trim().toLowerCase() == "i give up")
            myGradyGame.showResultsScreen(x, "Alas!"); // Doesn't return
    }
}

/**
    * Generates a random placeholder text for the input field based on a random number.
    * 
    * @returns {string} A randomly selected placeholder text.
*/
function getNewPlaceholder() {
    const rand = Math.random();

    if (rand > 0.5) return "I give up";
    else if (rand > .4) return "Yore valu heer"
    else if (rand > .3) return "Here be your guess";
    else if (rand > .1) return "Your guess here";

    return "Your value here";
}
