import requests
import csv
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

# URL of the API
url = "https://quests.nonlinearmedia.org/foothill/research/grady/php/show_log.php"

# GET request to fetch the data
response = requests.get(url)
if response.status_code == 200:
    data = response.text.split('\n')

    # Specify the CSV file to write the data to, change the path to the correct one
    csv_file_path = '/home/rl/MLRina/Grady/grady_data.csv'
    with open(csv_file_path, 'w', newline='') as csv_file:
        writer = csv.writer(csv_file)
        
        for row in data:
            # Assuming each row is comma-separated, split it into columns
            columns = row.split(',')
            writer.writerow(columns)
    print(f"Data successfully saved to {csv_file_path}")
else:
    print("Failed to fetch the data from the website")



df = pd.read_csv('/home/rl/MLRina/Grady/grady_data.csv', skiprows=6, skipfooter=1, engine='python', header=None)

# Remove rows with logging issues
df = df[~df[0].str.contains('dc8f1dd|1fd412a7|13ea52f5|75f04b|2a7af57|2b2e2c5b|15479c28|1e3784ca|20b01869|1197dcb6|1ef922d|1c567b1c|1182c243|2d810d2a|8db98e8|2b20e4c9')]

# Divide df into three subframes based in the value if the column 1
start_df = df[df[1] == 's']
attempts_df = df[df[1] == 'a']
final_df = df[df[1] == 'f']

start_df.columns = ["game_id", "status", "timestamp", "player_type", "game_type", "tolerance", "a", "b", "c", "min"]

attempts_df = attempts_df.drop(attempts_df.columns[[6, 7, 8, 9]], axis=1)
attempts_df.columns = ["game_id", "status", "timestamp", "guess_number", "x", "y"]

final_df = df[df[1] == 'f']
final_df = final_df.drop(final_df.columns[[5, 6, 7, 8, 9]], axis=1)
final_df.columns = ["game_id", "status", "timestamp", "num_guesses", "outcome"]

# Merge start_df and final_df on game_id
start_finish_df = pd.merge(start_df, final_df, on='game_id')

# Using the merged dataframe, compute the time to solve the game, 
# First cast timestamp_start and timestamp_finish to int, then compute the difference
start_finish_df['timestamp_start'] = start_finish_df['timestamp_x'].astype(int) 
start_finish_df['timestamp_finish'] = start_finish_df['timestamp_y'].astype(int)
start_finish_df['time_to_solve'] = start_finish_df['timestamp_finish'] - start_finish_df['timestamp_start']
# Now time_to_solve in milliseconds, convert it to minutes
start_finish_df['time_to_solve'] = start_finish_df['time_to_solve'] / 60000

# Limit time_to_solve to 15 minutes
start_finish_df = start_finish_df[start_finish_df['time_to_solve'] < 15]

start_finish_wins_df = start_finish_df[start_finish_df['outcome'] == 'Hooray!']
avg_time_to_solve_win = start_finish_wins_df['time_to_solve'].mean()
print("Average time for win a Grady game is ", avg_time_to_solve_win)

start_finish_alas_df = start_finish_df[start_finish_df['outcome'] == 'Alas!']
avg_time_to_solve_alas = start_finish_alas_df['time_to_solve'].mean()
print("Average time to give up on a Grady game is ", avg_time_to_solve_alas)

# In start_finish_df, compute the average number of guesses to solve the game where outcome is "Hooray!", cast num_guesses to int
start_finish_wins_df['num_guesses'] = start_finish_wins_df['num_guesses'].astype(int)
avg_num_guesses_win = start_finish_wins_df['num_guesses'].mean()
avg_num_guesses_win

# Do the same for outcome "Alas!"
start_finish_alas_df['num_guesses'] = start_finish_alas_df['num_guesses'].astype(int)
avg_num_guesses_alas = start_finish_alas_df['num_guesses'].mean()
avg_num_guesses_alas

print("Average number of guesses to solve the game when outcome is 'Hooray!': ", avg_num_guesses_win)
print("Average number of guesses to solve the game when outcome is 'Alas!': ", avg_num_guesses_alas)

# Using start_finish_df, display relationship between time to solve the game and game type
sns.boxplot(x='game_type', y='time_to_solve', data=start_finish_df)
plt.show()

# The plot suggests that games solved using visual methods typically required less time 
# and had less variability in the time to solve than those solved using analytical methods 
# However, both methods have cases where the time to solve was much longer than the average, as indicated by the outliers

# Using start_finish_df plot a histogram of the time to solve the game for both outcomes
plt.figure(figsize=(10, 6))
sns.histplot(data=start_finish_df, x='time_to_solve', hue='outcome', bins=30, alpha=0.6, palette='Set1')
plt.title('Time to solve the game')
plt.xlabel('Time to solve the game (minutes)')
plt.ylabel('Number of games')
plt.show()
# Save the plot as a PNG file
plt.savefig('time_to_solve.png')

# Plot the realtionship between number of guesses and time to solve the game, diffenret colors for different outcomes, cast num_guesses to int, display only round numbers
start_finish_df['num_guesses'] = start_finish_df['num_guesses'].astype(int)
plt.figure(figsize=(10, 6))
sns.scatterplot(data=start_finish_df, x='num_guesses', y='time_to_solve', hue='outcome', alpha=0.6, palette='Set1')
plt.title('Number of guesses vs time to solve the game')
plt.xlabel('Number of guesses')
plt.ylabel('Time to solve the game (minutes)')
# Get maximum number of guesses from start_finish_df
max_guesses = start_finish_df['num_guesses'].max()
plt.xticks(range(0, max_guesses+1, 1))
plt.show()
# Save the plot as a PNG file
plt.savefig('num_guesses_vs_time.png')

# Plot realtionship between game_type and outcomes
plt.figure(figsize=(10, 6))
sns.countplot(data=start_finish_df, x='game_type', hue='outcome', palette='Set1')
plt.title('Game type vs outcome')
plt.xlabel('Game type')
plt.ylabel('Number of games')
plt.show()
# Save the plot as a PNG file
plt.savefig('game_type_vs_outcome.png')

# Plot relationship between player_type and outcomes
plt.figure(figsize=(10, 6))
sns.countplot(data=start_finish_df, x='player_type', hue='outcome', palette='Set1')
plt.title('Player type vs outcome')
# Save the plot as a PNG file
plt.savefig('player_type_vs_outcome.png')

# Plot relationship between player type and time to solve the game, hue is outcome
plt.figure(figsize=(10, 6))
sns.boxplot(data=start_finish_df, x='player_type', y='time_to_solve', hue='outcome', palette='Set1')
plt.title('Player type vs time to solve the game')
plt.xlabel('Player type')
plt.ylabel('Time to solve the game (minutes)')
plt.show()
# Save the plot as a PNG file
plt.savefig('player_type_vs_time.png')

# Plot relationship between tolerance and outcomes
plt.figure(figsize=(10, 6))
sns.countplot(data=start_finish_df, x='tolerance', hue='outcome', palette='Set1')
plt.title('Tolerance vs outcome')
plt.xlabel('Tolerance')
plt.ylabel('Number of games')
plt.show()
# Save the plot as a PNG file
plt.savefig('tolerance_vs_outcome.png')




