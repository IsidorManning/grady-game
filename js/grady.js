/**
    * Global variable to hold the Grady game instance.
    * @type {Grady}
*/
var My_grady_game;

// Function to initialize the Grady game when the document is ready
$(document).ready(function() {
    // Create a new instance of the Grady game
    My_grady_game = new Grady();
    
    // Fade in the body content
    $("body").fadeIn();

    // Event listeners for different player types
    $("#nerd").click(function() { My_grady_game.play('nerd') });
    $("#bird").click(function() { My_grady_game.play('bird') });
    $("#both").click(function() { My_grady_game.play('both') });
    $("#bored").click(function() { My_grady_game.play('bored') });

    // Event listener for keyup events on the input field
    $('#grady_input').keyup(grady_input_onkeyup);
    $('#grady_input').focus();

    // Event listeners for displaying and hiding the about Grady page
    $('#about_grady_link').click(function() { $('#about_grady_page').fadeIn(); });
    $('#about_grady_x').click(function() { $('#about_grady_page').fadeOut(); });
});

// Class encapsulating the Gray game
class Grady {
    constructor() {
        // Initialize properties
        this.player_self_selected_type = "unknown";
        this.num_guesses = 0;
        this.start_time = Date.now();
        this.prev_guess_time = this.start_time;
        this.game_id = Math.floor(Math.random() * 1000 * 1000 * 1000).toString(16);
    
        // the 'this.trace' variable won't be set until we use the 'this.get_trace'
        // method that will generate a trace and set it equal to 'this.trace'.
        this.trace = NaN;
        // the 'this.delta' variable controls how many decimal places a guess need to
        // match exactly in orer for it to e classifie as a correct guess.
        this.delta = 0.001;
    }

    /**
        * Calculates the y value for a given x.
        * 
        * @param {number} x - The x value.
        * @returns {number} The y value.
    */
    get_y(x) {
       return this.a * x * x + this.b * x + this.c;
    }

    // Method to generate trace dictionary for visual processing
    generate_trace() {
        const trace = {
            x: [],
            y: [],
            type: 'scatter',
            mode: 'markers',
            name: 'Your Guesses',
            marker: {
                color: 'red',
            }
        };
        this.trace = trace;
    }

    /**
        * Serializes the function in string format.
        * 
        * @returns {string} The serialized function.
    */
    serialize() {
        const a = this.a.toFixed(5), b = this.b.toFixed(5), c = this.c.toFixed(5);
        return "y = " + a + "*x^2 + (" + b + ")*x" + " + (" + c + ")";
    }

    /**
        * Starts playing the game.
        * 
        * @param {string} type - The type of theplayer.
    */
    play(type) {
        this.player_self_selected_type = type; // Set player type

        // Generate random coefficients for the function
        this.generateRandomCoefficients();

        // Hide player-type question and show input panel
        $('#player_type_question').fadeOut(() => {
            $('#grady_prompt').fadeIn(() => {
                $('#grady_input').focus();
            });
        });

        // Determine input processing method
        if (Math.random() >= 0.5) {
            $('#subtitle').text('Hooray! You have been assigned to face off with the Analytical Daemon!');
            this.input_processor = this.process_x_analytical;
        } else {
            $('#subtitle').text('Hooray! You have been assigned to face off with the Visual Daemon!');
            this.input_processor = this.process_x_visual;
            // If we are in this scope we know that the mode is visual so we
            // generate a trace dictionary which gets stored in the instance variable
            // 'this.trace'.
            this.generate_trace();
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
        * analytical mode.
        * 
        * @param {number} x - The guess for the x value.
    */
    process_x_analytical(x) {
        const hdr = `<tr>
                        <th>Guess #</th>
                        <th>x</th>
                        <th>y</th>
                        <th>Time for this guess</th>
                        <th>Total time</th>
                        <th>Time of guess</th>
                    </tr>`;

        const analyticalResultsTable = $('#analytical_results_table');

        if (++this.num_guesses == 1) {
            $('#analytical_results').fadeIn();
            analyticalResultsTable.append(hdr);
        }

        this.attempt_logit(x);

        const now = new Date();
        const timeForThisGuess = now - this.prev_guess_time;
        const totalTime = now - this.start_time;
        const formattedTimeForThisGuess = (timeForThisGuess / 1000).toFixed(3) + 's';
        const formattedTotalTime = (totalTime / 1000).toFixed(3) + 's';

        // Build HTML for the new row
        const newRowHTML = `<tr>
                                <td>${this.num_guesses}</td>
                                <td>${x}</td>
                                <td>${this.get_y(x).toFixed(5)}</td>
                                <td>${formattedTimeForThisGuess}</td>
                                <td>${formattedTotalTime}</td>
                                <td>${now.toLocaleString()}</td>
                            </tr>`;

        analyticalResultsTable.append(newRowHTML);
        this.prev_guess_time = now;

        // Essentially line 49 of Rui's class code in onlinegdb - within .1% of true min
        if (this.isCorrectAnswer(x)) {
            this.show_results_screen(x, "Hooray!"); // Doesn't return
        }

        $('#grady_input').focus();
    }

    /**
        * Checks if the player's guess is within an acceptable range of the true minimum.
        * 
        * @param {number} x - The player's guess.
        * @returns {boolean} - True if the guess is within the acceptable range, false otherwise.
    */
    isCorrectAnswer(x) {
        return Math.abs(x - this.min) <= this.delta * Math.abs(this.min)
    }

    /**
        * Processes the player's input when they are in the visual mode.
        * 
        * @param {number} x - The player's input (guess for the x value).
    */
    process_x_visual(x) {
        if (++this.num_guesses == 1) $('#visual_results').fadeIn();

        const y = this.get_y(x);
        this.attempt_logit(x);

        this.trace.x.push(x);
        this.trace.y.push(y);
  
        const layout = {
            title: 'Your Points Graphed (Interactive)',
            showlegend: false,
            dragmode: 'pan', // Enable click-and-drag for panning
            uirevision: true, // Ensure updates to the layout are retained
            hovermode: 'closest', // Set hovermode
        };
        
        const config = { displayModeBar: false, scrollZoom: true, responsive: true };
        Plotly.newPlot('visual_results_plot', [this.trace], layout, config);

        // Essentially line 49 of Rui's class code in onlinegdb - within .1% of true min
        if (Math.abs(x - this.min) <= this.delta * Math.abs(this.min)) {
            // maybe sound flourish 1.5s
            this.show_results_screen(x, "Hooray!"); // Doesn't return
        }

        $('#grady_input').focus();
    }
    
    /**
        * Displays the final results screen.
        * 
        * @param {number} x - The player's last guess.
        * @param {string} outcome - The outcome of the game ('Hooray!' or 'Alas!').
    */
    show_results_screen(x, outcome) {
        this.final_logit(outcome)

        let res = "<div class=title>" + outcome + "</div>" +
            "<div class=subtitle>You took " + this.num_guesses + " Guesses</div><br>";
            
        res += "<div class=grady_final_stats_text>" +
            "The correct minimum was " + this.min.toFixed(5) + "<br>" +
            "And your last guess was " + x + "<p>" +
            "The function was " + this.serialize() + "</div><br>";

        res += "<div class=grady_final_stats_text>Click here for more global statistics on Grady</div><p>";
        res += "(or refresh your browser for another game)";

        $('#grady_final_stats').html(res);
        $('#grady_final_stats').fadeIn();
    }

    /**
        * Logs the attempt made by the player.
        * 
        * @param {number} x - The value inputted by the player.
    */
    attempt_logit(x) {
        const param = {
            "i": this.game_id + "a", 
            "x": x, 
            "y": this.get_y(x), 
            "m": this.min, 
            "n": this.num_guesses, 
            "t": Date.now(),
        };
        $.post("php/logit_a.php", param, function(res) { });
    }
    
    /**
        * Logs the final outcome of the game.
        * 
        * @param {string} outcome - The outcome of the game, either "Hooray!" or "Alas!".
    */
    final_logit(outcome) {
    // game_id has "f" appended to distinguish from a regular in-game 
        // log line, which will have an A appended instead.
        const param = {
            "i": this.game_id + "f", 
            "p": this.player_self_selected_type,
            "a": this.a,
	        "b": this.b, 
            "c": this.c, 
            "o": outcome, 
            "n": this.num_guesses, 
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
function grady_input_onkeyup(e) {
    if (e == null) return;

    const KEY_ESC = 27, KEY_CR = 13, KEY_NL = 10;

    if (e.which == KEY_ESC && $('#grady_input').val() != "") {
        $('#grady_input').val("");
    }  else if (e.which == KEY_CR || e.which == KEY_NL) {
        let x = $('#grady_input').val();
        $('#grady_input').val('');

        if ($.isNumeric(x)) 
            My_grady_game.input_processor(x);
        else if (x.trim().toLowerCase() == "i give up")
            My_grady_game.show_results_screen(x, "Alas!"); // Doesn't return
    }
}
