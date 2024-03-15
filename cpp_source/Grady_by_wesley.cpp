#include <iostream>
#include <cstdlib>
#include <ctime>

using namespace std;

double A, B, C, x, y;

void set_randoms() {
    A = (double) (rand() % 5);
    B = (double) (rand() % 5);
    C = (double) (rand() % 10);
    

    cout << A << endl;
    cout << B << endl;
    cout << C << endl;

}

double find_y(double A, double B, double C, double x) {
    double y = (A * x * x) + (B * x) + C;
    return y;
}

bool first_derivative(double A, double B, double x) {
    double f_prime = (2.0 * A * x) + B;
    if(0.1 >= f_prime && f_prime >= -0.1) { return true; }
    else { return false; }
}


int main()
{
    srand(time(0));
    set_randoms();
    
    cout << "I came up with a random quadratic curve. Guess x-values to find the global extrema." << endl;
    
    while(true) {
        string line;
        getline(cin, line);
        x = std::stod(line);
        y = find_y(A, B, C, x);
        cout << "The y-value for " << x << " is " << y << endl;
        if(first_derivative(A, B, x)) {
            cout << "Congrats! You found the global extrema within +/-0.1 of (" << x << ", " << y << ")" << endl;
            cout << "Do you want to play again? Y/N" << endl;
            getline(cin, line);
            if(line[0] == 'y' || line[0] == 'Y') {
                srand(time(0));
                set_randoms();
                cout << "I came up with a random quadratic curve. Guess x-values to find the global extrema." << endl;
                continue;
            } else { break; }
        }    
    }
    return 0;
}

