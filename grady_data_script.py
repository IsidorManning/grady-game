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
    csv_file_path = 'grady-game/grady_data.csv'
    with open(csv_file_path, 'w', newline='') as csv_file:
        writer = csv.writer(csv_file)
        
        for row in data:
            # Assuming each row is comma-separated, split it into columns
            columns = row.split(',')
            writer.writerow(columns)
    print(f"Data successfully saved to {csv_file_path}")
else:
    print("Failed to fetch the data from the website")



# delete first 437 rows and the last row in the file, no column names
df = pd.read_csv('grady_data.csv', skiprows=437, skipfooter=1, engine='python', header=None)

# Divide df into three subframes based in the value if the column 1
start_df = df[df[1] == 's']
attempts_df = df[df[1] == 'a']
final_df = df[df[1] == 'f']

# rename columns in start_df
start_df.columns = ["game_id", "status", "timestamp", "player_type", "game_type", "tolerance", "a", "b", "c", "min"]
# drop rows where game_id is in [3657dd90, b02965, 1144fc11, a637af8, 1cdbfabd] (time outliers)
start_df = start_df[~start_df['game_id'].isin(['3657dd90', 'b02965', '1144fc11', 'a637af8', '1cdbfabd'])]

# count the number of games started
games_started = start_df['game_id'].count()
print("Number of games started: ", games_started)
# using start_df, count the number of games started by game type
game_type_count = start_df['game_type'].value_counts()
print("Number of games started by game type: ", game_type_count)
# using start_df, count the number of games started by player type
player_type_count = start_df['player_type'].value_counts()
print("Number of games started by player type: ", player_type_count)
# using start_df, count the number of games started by game level
game_level_count = start_df['tolerance'].value_counts()
print("Number of games started by game level: ", game_level_count)



# rename columns in attmepts_df
attempts_df = attempts_df.drop(attempts_df.columns[[6, 7, 8, 9]], axis=1)
attempts_df.columns = ["game_id", "status", "timestamp", "guess_number", "x", "y"]
# drop rows where game_id is in [3657dd90, b02965, 1144fc11, a637af8, 1cdbfabd] (time outliers)
attempts_df = attempts_df[~attempts_df['game_id'].isin(['3657dd90', 'b02965', '1144fc11', 'a637af8', '1cdbfabd'])]


# in attempts_df group records by game_id
grouped = attempts_df.groupby('game_id')

# convert timestamp to int
attempts_df['timestamp'] = attempts_df['timestamp'].astype(int)

# within each group calculate difference between timestamps
attempts_df['timestamp_diff'] = grouped['timestamp'].diff()

#replace NaN values with 0
attempts_df['timestamp_diff'] = attempts_df['timestamp_diff'].fillna(0)

# convert timestamp_diff from millisocnds to seconds
attempts_df['timestamp_diff'] = attempts_df['timestamp_diff'] / 1000

# compute min, max, mean, median,  of the time between guesses
min_time_between_guesses = abs(attempts_df['timestamp_diff'].min())
max_time_between_guesses = attempts_df['timestamp_diff'].max()
mean_time_between_guesses = attempts_df['timestamp_diff'].mean()
median_time_between_guesses = attempts_df['timestamp_diff'].median()

#print out the results in one string (add graphs??)
print("\nMin time between guesses: ", min_time_between_guesses, 'seconds',  "\nMax time between guesses: ", max_time_between_guesses, 'seconds', "\nMean time between guesses: ", mean_time_between_guesses, 'seconds', "\nMedian time between guesses: ", median_time_between_guesses, 'seconds')

# in finish_df remove 5 last columns and rename remainng columns 1-5 as "game_id","f","timestamp","num_guesses","outcome"
finish_df = df[df[1] == 'f']
finish_df = finish_df.drop(finish_df.columns[[5, 6, 7, 8, 9]], axis=1)
finish_df.columns = ["game_id", "status", "timestamp", "num_guesses", "outcome"]
# drop rows where game_id is in [3657dd90, b02965, 1144fc11, a637af8, 1cdbfabd] (time outliers)
finish_df = finish_df[~finish_df['game_id'].isin(['3657dd90', 'b02965', '1144fc11', 'a637af8', '1cdbfabd'])]

# using start_df and finish_df count how many start game_id not in the finish game_id
abandoned_games = start_df[~start_df['game_id'].isin(finish_df['game_id'])]
abandoned_games = abandoned_games['game_id'].count()
print("Number of abandoned games: ", abandoned_games)

# using finish_df cout the total number of games finished
total_games_finished = finish_df['outcome'].count()
print("Total number of games finished: ", total_games_finished)

# using finish_df, count the number of games finished by outcome
outcome_count = finish_df['outcome'].value_counts()
print("Number of games finished by outcome: ", outcome_count)


# Merge start_df and final_df on game_id
start_finish_df = pd.merge(start_df, final_df, on='game_id')

# using start_df and finish_df, compute average time to solve the game
# merge start_df and finish_df on game_id
start_finish_df = pd.merge(start_df, finish_df, on='game_id')

# using the merged dataframe, compute the time to solve the game, 
# first cast timestamp_start and timestamp_finish to int, then compute the difference
start_finish_df['timestamp_start'] = start_finish_df['timestamp_x'].astype(int) 
start_finish_df['timestamp_finish'] = start_finish_df['timestamp_y'].astype(int)
start_finish_df['time_to_solve'] = start_finish_df['timestamp_finish'] - start_finish_df['timestamp_start']
# now time_to_solve in milliseconds, convert it to minutes
start_finish_df['time_to_solve'] = start_finish_df['time_to_solve'] / 60000

# Average, min, max, and median for:
# time per game (start to finish)
# number of guesses per game

# using start_finish_df, compute min max and median for time to solve the game
min_time_to_solve = start_finish_df['time_to_solve'].min()
max_time_to_solve = start_finish_df['time_to_solve'].max()
median_time_to_solve = start_finish_df['time_to_solve'].median()
average_time_to_solve = start_finish_df['time_to_solve'].mean()
print('\n',"Min time to solve the game (minutes): ", min_time_to_solve, '\n', "Max time to solve the game (minutes): ", max_time_to_solve, '\n', "Median time to solve the game (minutes): ", median_time_to_solve, '\n', "Average time to solve the game (minutes): ", average_time_to_solve)

# using start_finish_df, compute min max and median for number of guesses per game
start_finish_df['num_guesses'] = pd.to_numeric(start_finish_df['num_guesses'], errors='coerce')
min_num_guesses = start_finish_df['num_guesses'].min()
max_num_guesses = start_finish_df['num_guesses'].max()
median_num_guesses = start_finish_df['num_guesses'].median()
average_num_guesses = start_finish_df['num_guesses'].mean()
print('\n',"Min number of guesses per game: ", min_num_guesses, '\n', "Max number of guesses per game: ", max_num_guesses, '\n', "Median number of guesses per game: ", median_num_guesses, '\n', "Average number of guesses per game: ", average_num_guesses)

# from start_finish_df, compute the average time to solve the game, using rows where outcome is "Hooray!"
start_finish_wins_df = start_finish_df[start_finish_df['outcome'] == 'Hooray!']
avg_time_to_solve_win = start_finish_wins_df['time_to_solve'].mean()
print("Average time to win the game is", avg_time_to_solve_win, "minutes")
start_finish_alas_df = start_finish_df[start_finish_df['outcome'] == 'Alas!']
avg_time_to_solve_alas = start_finish_alas_df['time_to_solve'].mean()
print("Average time to give up on game is", avg_time_to_solve_alas, "minutes")

# in start_finish_df, compute the average number of guesses to solve the game where outcome is "Hooray!", cast num_guesses to int
avg_num_guesses_win = start_finish_wins_df['num_guesses'].mean()
print("Average number of guesses to solve the game when outcome is 'Hooray!': ", avg_num_guesses_win)
# do the same for outcome "Alas!"
avg_num_guesses_alas = start_finish_alas_df['num_guesses'].mean()
print("Average number of guesses to solve the game when outcome is 'Alas!': ", avg_num_guesses_alas)


# Using start_finish_df, display relationship between time to solve the game and game type
sns.boxplot(x='game_type', y='time_to_solve', data=start_finish_df)
plt.show()
# Save the plot as a JPG file
plt.savefig('game_type_vs_time.jpg')

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
# Savethe plot as a JPG file
plt.savefig('time_to_solve.jpg')

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
# Save the plot as a JPG file
plt.savefig('num_guesses_vs_time.jpg')

# Plot realtionship between game_type and outcomes
plt.figure(figsize=(10, 6))
sns.countplot(data=start_finish_df, x='game_type', hue='outcome', palette='Set1')
plt.title('Game type vs outcome')
plt.xlabel('Game type')
plt.ylabel('Number of games')
plt.show()
# Save the plot as a JPG file
plt.savefig('game_type_vs_outcome.jpg')

# Plot relationship between player_type and outcomes
plt.figure(figsize=(10, 6))
sns.countplot(data=start_finish_df, x='player_type', hue='outcome', palette='Set1')
plt.title('Player type vs outcome')
# Save the plot as a JPG file
plt.savefig('player_type_vs_outcome.jpg')

# Plot relationship between player type and time to solve the game, hue is outcome
plt.figure(figsize=(10, 6))
sns.boxplot(data=start_finish_df, x='player_type', y='time_to_solve', hue='outcome', palette='Set1')
plt.title('Player type vs time to solve the game')
plt.xlabel('Player type')
plt.ylabel('Time to solve the game (minutes)')
plt.show()
# Save the plot as a JPG file
plt.savefig('player_type_vs_time.jpg')

# Plot relationship between tolerance and outcomes
plt.figure(figsize=(10, 6))
sns.countplot(data=start_finish_df, x='tolerance', hue='outcome', palette='Set1')
plt.title('Tolerance vs outcome')
plt.xlabel('Tolerance')
plt.ylabel('Number of games')
plt.show()
# Save the plot as a JPG file
plt.savefig('tolerance_vs_outcome.jpg')


# Using start_finish_df compute number of game starts by time of hour during day (0-24) 
start_finish_df['timestamp_start'] = pd.to_datetime(start_finish_df['timestamp_start'], unit='ms')
start_finish_df['hour'] = start_finish_df['timestamp_start'].dt.hour
game_starts_by_hour = start_finish_df['hour'].value_counts().sort_index()
print(game_starts_by_hour)

# Using this data create a plot
plt.figure(figsize=(10, 6))
sns.barplot(x=game_starts_by_hour.index, y=game_starts_by_hour.values)
plt.title('Number of game starts by time of day')
plt.xlabel('Hour of day')
plt.ylabel('Number of games started')
plt.show()
# Save the plot as a JPG file
plt.savefig('game_starts_by_hour.jpg')