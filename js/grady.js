var My_grady_game // Global

$(document).ready(function() {
    My_grady_game = new Grady()
    
    $("body").fadeIn()

    $("#nerd").click(function() { My_grady_game.play('nerd') })
    $("#bird").click(function() { My_grady_game.play('bird') })
    $("#both").click(function() { My_grady_game.play('both') })
    $("#bored").click(function() { My_grady_game.play('bored') })

    // .hide causes unisightly jiggles, using fadeTo 0.01 instead
    $("#nerd").mouseover(function() {
	$('#player_type_tooltip').fadeOut(function() {
	    $('#player_type_tooltip').text("You're analytical and then artistic")
	    $('#player_type_tooltip').fadeIn()
	})
    })
    $("#nerd").mouseout(function() { $('#player_type_tooltip').fadeOut() })

    $("#bird").mouseover(function() {
	$('#player_type_tooltip').fadeTo(function() {
	    $('#player_type_tooltip').text("You're artistic and then analytical")
	    $('#player_type_tooltip').fadeIn()
	})
    })
    $("#bird").mouseout(function() { $('#player_type_tooltip').fadeOut() })

    $("#both").mouseover(function() {
	$('#player_type_tooltip').fadeOut(function() {
	    $('#player_type_tooltip').text("You're always both")
	    $('#player_type_tooltip').fadeIn()
	})
    })
    $("#both").mouseout(function() { $('#player_type_tooltip').fadeOut() })

    $("#bored").mouseover(function() {
	$('#player_type_tooltip').fadeOut(function() {
	    $('#player_type_tooltip').text("You just wanna play!")
	    $('#player_type_tooltip').fadeIn()
	})
    })
    $("#bored").mouseout(function() { $('#player_type_tooltip').fadeOut() })

    $('#grady_input').keyup(grady_input_onkeyup);
    $('#grady_input').focus()

    $('#about_grady_link').click(function() { $('#about_grady_page').fadeIn(); })
    $('#about_grady_x').click(function() { $('#about_grady_page').fadeOut(); })
})

function Grady() {
    var urlParams = new URLSearchParams(window.location.search)

    this.player_type = "unknown"
    this.num_guesses = 0
    this.start_time = Date.now()
    this.prev_guess_time = this.start_time
    this.game_id = Math.floor(Math.random() * 1000 * 1000 * 1000).toString(16)
    this.best = NaN
    this.get_y = function(x) {
        return this.a * x * x + this.b * x + this.c
    }

    // Set game level - Rina/Discord
    //   Lev 1 -> guess must correct to 1 decimal place - Easy (< 10 guesses)
    //   Lev 2 -> guess must correct to 2 places -  Medium (10-20 guesses)
    //   Lev 3 -> guess must be correct to 3 places - Harder (20+ guesses)
    this.level = 1 // default
    if (urlParams.has('level')) {
        var lev =  +urlParams.get('level')
	if (isNaN(lev) || lev < 1  || lev > 3) {
	    console.error("Requested level " + this.level + " reset to default (1)")
	    this.level = 1
	} else
	    this.level = lev
    }
    
    this.play = function(type) {
        this.player_self_selected_type = type; // maybe nerd, bird, both or bored

        this.a = Math.random() * 10 + .1 // .1 avoids a=0
        this.b = Math.random() * 20 - 10
        this.c = Math.random() * 20 - 10
        this.min = -this.b / (2 * this.a) // -b/2a

        // this is essentially Wesley's idea from class.
        this.to_string = function() {
            var a = this.a.toFixed(5), b = this.b.toFixed(5), c = this.c.toFixed(5)
            return "y = " + a + "*x^2 + (" + b + ")*x" + " + (" + c + ")"
        }

        // Hide the player-type question, fade in the input panel and set
        // this.input_processor to analytical or visual (50/50 based on Math.random())
        $('#player_type_question').fadeOut(function() {
            $('#grady_prompt').fadeIn(function() { $('#grady_input').focus() })
        })

        // this.input_processor determines whether the point will be tabulated or graphed
        if (Math.random() >= 0.5) {
            $('#subtitle').text('Hooray! You have been chosen to face off with the Analytical Daemon!')
            this.input_processor = this.process_x_analytical;
	    this.start_logit("analytical")
        } else {
            $('#subtitle').text('Hooray! You have been chosen to face off with the Visual Daemon!')
            this.input_processor = this.process_x_visual;
	    this.start_logit("visual")
        }
    }
        
    // -------------------------------------------------------------------------
    // If this.input_processor = this function, then results will be tabulated
    this.process_x_analytical = function(x) {
        var hdr = '<tr id=grady_tbl_hdr><th>Guess #</th><th>x</th><th>y</th><th>Time for this guess</th><th>Total time</th><th>Time of guess</th></tr>'

        if (++this.num_guesses == 1) {
            $('#analytical_results').fadeIn()
            $('#analytical_results_table').append(hdr)
        }
        this.attempt_logit(x)

        var now = new Date()
        var time_for_this_guess = now - this.prev_guess_time
        var total_time = now - this.start_time;
        $(
          '<tr>' +
          '<td>' + this.num_guesses + '</td>' +
          '<td>' + x + '</td>' +
          '<td>' + this.get_y(x).toFixed(5) + '</td>' +
          '<td>' + (time_for_this_guess/1000).toFixed(3) + 's </td>' +
          '<td>' + (total_time/1000).toFixed(3) + 's </td>' +
          '<td>' + now.toLocaleString() + '</td>' +
          '</tr>'
        ).insertAfter('#grady_tbl_hdr')
        this.prev_guess_time = now

	if (!$.isNumeric(this.best) || Math.abs(this.min-this.best) > Math.abs(this.min-x))
	    this.best = x

        // // Essentially line 49 of Rui's class code in onlinegdb - within x% of true min (x = tol)
        // if (Math.abs(x - this.min) <= this.tolerance * Math.abs(this.min)) {
        //     this.show_results_screen(x, "Hooray!") // Doesn't return
        // }
	if (parseFloat(x.toFixed(this.level)) == parseFloat(this.min.toFixed(this.level))) // Changed per Ryan's suggestion
	    this.show_results_screen(x, "Hooray!")

        $('#grady_input').focus()
	$('#grady_input').attr('placeholder', get_new_placeholder())
    }

    // -------------------------------------------------------------------------
    // If this.input_processor = this function then results will be graphed

    var X = [], Y = []
    this.process_x_visual = function(x) {
        if (++this.num_guesses == 1) {
            $('#visual_results').fadeIn()
        }
        var y = this.get_y(x)
        this.attempt_logit(x)

        X.push(x)
        Y.push(y)

	var Trace = {
	    x: X.slice(X.length-5), // Only last 5 points
	    y: Y.slice(Y.length-5),
	    type: 'scatter',
	    mode: 'markers',
	    name: 'Your Guesses',
	    marker: {
		color: 'red',
		symbol: 'cross'
	    }
	}
  
        var layout = {
            title: 'Your last few Points Graphed (Interactive)',
            showlegend: false,
            dragmode: 'pan', // Enable click-and-drag for panning
            uirevision: true, // Ensure updates to the layout are retained
            hovermode: false, // Set hovermode
        };
        var config = { displayModeBar:false, scrollZoom:true, responsive:true }
        Plotly.newPlot('visual_results_plot', [Trace], layout, config);

	if (!$.isNumeric(this.best) || Math.abs(this.min-this.best) > Math.abs(this.min-x))
	    this.best = x

        // Essentially line 49 of Rui's class code in onlinegdb - within .1% of true min
        // if (Math.abs(x - this.min) <= 0.001 * Math.abs(this.min)) {
        //     // maybe sound flourish 1.5s
        //     this.show_results_screen(x, "Hooray!") // Doesn't return
        // }
	if (parseFloat(x.toFixed(this.level)) == parseFloat(this.min.toFixed(this.level))) // Changed per Ryan's suggestion
	    this.show_results_screen(x, "Hooray!")

        $('#grady_input').focus()
	$('#grady_input').attr('placeholder', get_new_placeholder())
    }
    
    // -------------------------------------------------------------------------
    // Either on correct guess or on "i give up"
    // Shows final statistics screen. Doesn't return. User will need to refresh browser
    // outcome is usually "Hooray!" or "Alas!"
    this.show_results_screen = function(x, outcome) {
        this.final_logit(outcome)
	
        let res = "<div class=title>" + outcome + "</div>" +
            "<div class=subtitle>You took " + this.num_guesses + " Guesses</div><br>"
            
        res += "<div class=grady_final_stats_text>" +
            "The correct minimum was " + this.min.toFixed(5) + "<br>"
	if (!isNaN(this.best))
            res += "Your best  guess was " + this.best + "<p>"

	res +=
            "And your last guess was " + x + "<p>" +
            "The function was " + this.to_string() + "</div><br>"

        res += "<div class=grady_final_stats_text>(Global statistics on Grady will be available here)</div><p>"
        res += "Refresh your browser for another game"

        $('#grady_final_stats').html(res)
        $('#grady_prompt').fadeOut(function() { $('#grady_final_stats').fadeIn() })
    }

    this.start_logit = function(game_type) {
        var param = {
            "i":this.game_id, "p":this.player_self_selected_type, "g":game_type, "l":this.level, 
	    "a":this.a, "b":this.b, "c":this.c, "m": this.min,"t":Date.now()
        }
        $.post("php/logit_s.php", param, function(res) { })
    }
    
    this.attempt_logit = function(x) {
        var param = {
            "i":this.game_id, "x":x, "y":this.get_y(x), "n": this.num_guesses, "t":Date.now()
        }
        $.post("php/logit_a.php", param, function(res) { })
    }
    
    // game_id has "f" appended to distinguish from a regular in-game log line, which will have an A appended instead.
    this.final_logit = function(outcome) {
        var param = {
            "i":this.game_id, "o":outcome, "n": this.num_guesses, "t":Date.now()
        }
        $.post("php/logit_f.php", param, function(res) { })
    }
} // Grady

// -------------------------------------------------------------------------
// This needs to be a global function?

function grady_input_onkeyup(e) {
        var KEY_ESC = 27, KEY_CR = 13, KEY_NL = 10, KEY_UP = 38, KEY_DOWN = 40;
        if (e == null) return;

        if (e.which == KEY_ESC && $('#grady_input').val() != "") {
            $('#grady_input').val("");
        }  else if (e.which == KEY_CR || e.which == KEY_NL) {
            let x = $('#grady_input').val()
            $('#grady_input').val('')
            if ($.isNumeric(x))
                My_grady_game.input_processor(parseFloat(x))
            else if (x.trim().toLowerCase() == "i give up")
                My_grady_game.show_results_screen(x, "Alas!") // Doesn't return
        }
}

function get_new_placeholder() {
    var rand = Math.random()
    
    if (rand > 0.5) return "I give up"
    else if (rand > .4) return "Yore valu heer"
    else if (rand > .3) return "Here be your guess"
    else if (rand > .1) return "Your guess hear"

    return "Your value here"
}

//----------------------------------------------------------------------

