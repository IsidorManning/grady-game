#include <iostream>
#include <ctime>
#include <vector>
#include <math.h>

class Grady {

private:
    std::vector<int> rounds;
    double DIFFERENCE_FACTOR = 0.1;
    int MODE;
    
public:
    Grady(int mode) : MODE(mode) {} 

    void play_round() {
        int a = rand() % 10 + 1;
        int b = rand() % 21 - 10;
        int c = rand() % 21 - 10;
        double min_x = -b / (2.0 * a);
        
        std::string function_repr = std::to_string(a) + "x^2 + " + std::to_string(b) + "x + " + std::to_string(c);
        std::cout << "Here is your parabola: " << function_repr << std::endl;

        if (MODE == 1) std::cout << "Mode: Probing (No Graphing)" << std::endl;
        else std::cout << "Mode: With Graphing" << std::endl;

        size_t num_guesses = 0;

        while (true) {
            double guess;
            std::cout << "Enter your guess for x minimum: ";
            std::cin >> guess;
            num_guesses++;

            if (std::abs(guess - min_x) < DIFFERENCE_FACTOR) {
                std::cout << "Congratulations! You've found the minimum." << std::endl;
                break;
            } else {
                double y = a * guess * guess + b * guess + c;
                std::cout << "The function's value at x = " << guess << " is " << y << std::endl;
            }
        }
        
        rounds.push_back(num_guesses);
    }

    double get_guesses() {
        if (rounds.empty()) return 0;
        double totalGuesses = 0;
        
        for (int guess : rounds) totalGuesses += guess;
        return totalGuesses / rounds.size();
    }
};

int main() {
    srand(unsigned(time(0)));
    
    Grady grady = Grady(0);
    grady.play_round();
    
    std::cout << "Average number of guesses: " << grady.get_guesses() << std::endl;
    
    return 0;
}
