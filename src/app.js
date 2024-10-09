const readline = require('readline');
const notifier = require('node-notifier');
const fs = require('fs');
const player = require('node-wav-player');
const chalk = require('chalk');

const notificationSoundPath = '../assets/sounds/chimes.wav';
const notificationIconPath = '../assets/images/alarm-clock.png';
const savedStatePath = '../assets/data/savedState.json';

let workDuration = 25 * 60; // 25 minutes in seconds
let shortBreak = 5 * 60; // 5 minutes in seconds
let longBreak = 15 * 60; // 15 minutes in seconds
let workSessionsBeforeLongBreak = 4;

let completedWorkSessions = 0;
let timeRemaining = 0;
let totalWorkTime = 0;
let totalBreakTime = 0;
let timeInterval;
let currentSession = '';
let running = false;
let paused = false;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: chalk.cyan('\nInsert a command: '),
});

/**
 * Plays a notification sound from the specified file path.
 *
 * @function notificationSound
 * @throws {Error} Logs an error if the sound file cannot be played.
 *
 * @example
 * notificationSound();
 */

const notificationSound = () => {
  try {
    player.play({
      path: notificationSoundPath,
    });
  } catch (err) {
    console.error('Error playing sound:', err);
  }
};

/**
 * Formats a given time in seconds to a `MM:SS` string format.
 *
 * @function timeFormatter
 * @param {number} seconds - The total time in seconds to format.
 * @returns {string} The formatted time in `MM:SS` format.
 *
 * @example
 * const formattedTime = timeFormatter(90); // "01:30"
 */

const timeFormatter = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Starts a countdown timer for a given duration with a specific label.
 * Displays the timer in the console and triggers a callback when the time ends.
 *
 * @function startTimer
 * @param {number} duration - The duration of the timer in seconds.
 * @param {string} label - The label for the session (e.g., "Work", "Break").
 * @param {Function} callback - A callback function to execute when the timer ends.
 *
 * @example
 * startTimer(1500, 'Work', () => console.log('Work session ended.'));
 */

const startTimer = (duration, label, callback) => {
  timeRemaining = duration;
  currentSession = label;
  running = true;
  paused = false;

  if (timeRemaining === duration) {
    notifier.notify({
      title: 'Pomodoro Timer',
      message: `\n${label} Started.`,
      icon: notificationIconPath,
      sound: false,
    });
  }

  timeInterval = setInterval(() => {
    process.stdout.write(
      chalk.blue(`\r${label} Session: ${timeFormatter(timeRemaining)}`)
    );
    timeRemaining--;

    if (timeRemaining < 0) {
      clearInterval(timeInterval);
      console.log(chalk.green(`\n${label} ended.`));

      notificationSound();
      notifier.notify({
        title: 'Pomodoro Timer',
        message: `\n${label} ended.`,
        icon: notificationIconPath,
        sound: false,
      });

      callback();
    }
  }, 1000);
};

/**
 * Starts a work session, initiates the work timer, and tracks the number of completed sessions.
 * When a work session ends, it automatically starts a short or long break based on the completed sessions.
 *
 * @function startWorkSession
 *
 * @example
 * startWorkSession();
 */

const startWorkSession = () => {
  console.clear();
  console.log(chalk.cyan(`\nWork Session Started`));
  startTimer(workDuration, 'Work', () => {
    completedWorkSessions++;
    totalWorkTime += workDuration;
    if (completedWorkSessions % workSessionsBeforeLongBreak === 0) {
      startLongBreak();
    } else {
      startShortBreak();
    }
  });
};

/**
 * Starts a short break session and initiates a short break timer.
 * After the break ends, it resumes the work session.
 *
 * @function startShortBreak
 *
 * @example
 * startShortBreak();
 */

const startShortBreak = () => {
  console.log(chalk.yellow(`\nTake a short break!`));
  startTimer(shortBreak, 'Short Break', startWorkSession);
  totalBreakTime += shortBreak;
};

/**
 * Starts a long break session and initiates a long break timer.
 * After the long break ends, it resumes the work session.
 *
 * @function startLongBreak
 *
 * @example
 * startLongBreak();
 */

const startLongBreak = () => {
  console.log(chalk.yellow(`\nTime for a long break!`));
  startTimer(longBreak, 'Long Break', () => {
    startWorkSession();
  });
  totalBreakTime += longBreak;
};

/**
 * Handles commands input by the user, such as starting, pausing, or stopping the timer.
 *
 * @function commandHandler
 * @param {string} command - The user input command.
 *
 * @example
 * commandHandler('start');
 */

const commandHandler = (command) => {
  const com = command.trim().toLowerCase();
  switch (com) {
    case 'start':
    case 'w':
      if (!running && !paused) {
        startWorkSession();
      } else {
        console.log(chalk.red('Timer is may be running or paused'));
      }
      break;
    case 'settings':
      console.clear();
      changeSettings();
      break;
    case 'stat':
      console.clear();
      statistics();
      break;
    case 'help':
    case 'h':
      console.clear();
      displayHelp();
      break;
    case 'exit':
      rl.close();
      break;
    case 'pause':
    case 'p':
      if (running && !paused) {
        pause();
      } else {
        console.log(chalk.red('No timer to pause.'));
      }
      break;
    case 'resume':
    case 'r':
      if (paused) {
        resume();
      } else {
        console.log(chalk.red('No timer to resume.'));
      }
      break;
    case 'stop':
    case 'a':
      if (running || paused) {
        console.clear();
        stop();
      } else {
        console.log(chalk.red('No timer to stop.'));
      }
      break;
    case 'reset':
    case 'r':
      console.clear();
      reset();
      break;
    default:
      console.clear();
      console.log(chalk.red('Please enter a valid command!'));
    // mainMenu();
  }
};

/**
 * Displays a help message listing all available commands for the user.
 *
 * @function displayHelp
 *
 * @example
 * displayHelp();
 */

const displayHelp = () => {
  console.log(
    chalk.cyan(
      `
Available Commands:
start   (w)  - Start the Pomodoro timer
stop    (a)  - Stop the current timer
pause   (p)  - Pause the current timer
resume  (r)  - Resume the paused timer
reset   (x)  - Reset the timer
settings     - Change timer settings (work/break durations)
help    (h)  - Display this help message
exit         - Exit the program
`
    )
  );
};

/**
 * Pauses the current session and stops the timer from counting down.
 *
 * @function pause
 *
 * @example
 * pause();
 */

const pause = () => {
  clearInterval(timeInterval);
  running = false;
  paused = true;
  console.log(chalk.yellow(`\n${currentSession} has been paused.`));
};

/**
 * Resumes the paused session by continuing the timer from where it was paused.
 *
 * @function resume
 *
 * @example
 * resume();
 */

const resume = () => {
  console.log(chalk.yellow(`\n${currentSession} session resuming...`));
  startTimer(timeRemaining, currentSession, () => {
    if (completedWorkSessions % workSessionsBeforeLongBreak === 0) {
      startLongBreak();
    } else {
      startShortBreak();
    }
  });
};

/**
 * Stops the current session and resets the timer to 0.
 * Updates the total work or break time based on the session that was stopped.
 *
 * @function stop
 *
 * @example
 * stop();
 */

const stop = () => {
  clearInterval(timeInterval);
  running = false;
  paused = false;
  if (currentSession === 'Work') {
    totalWorkTime += workDuration - timeRemaining;
  } else if (currentSession === 'Short Break') {
    totalBreakTime += shortBreak - timeRemaining;
  } else {
    totalBreakTime += longBreak - timeRemaining;
  }
  timeRemaining = 0;
  console.log(chalk.yellow(`\n${currentSession} session stopped.`));
};

/**
 * Resets the timer, total work time, total break time, and completed sessions to their default values.
 *
 * @function reset
 *
 * @example
 * reset();
 */

const reset = () => {
  clearInterval(timeInterval);
  running = false;
  paused = false;
  timeRemaining = 0;
  totalBreakTime = 0;
  totalWorkTime = 0;
  completedWorkSessions = 0;
  console.log(chalk.green(`\nTimer has been reset`));
};

/**
 * Allows the user to change the durations of work, short break, long break, or cycles for long breaks.
 *
 * @function changeSettings
 *
 * @example
 * changeSettings();
 */

const changeSettings = () => {
  rl.question(
    chalk.cyan(
      `1) Change the work duration
2) Change the short break duration
3) Change the long break duration
4) Change the cycle the long break appears
5) Reset to default (Work = 25, Short Break = 5, Long Break = 15, Work Cycle before Long Break = 4)
6) Back
Insert a Number (1-6): `
    ),
    (answer) => {
      const ans = parseInt(answer);
      if (ans >= 1 && ans <= 4) {
        changeTime(ans);
      } else if (ans === 5) {
        console.clear();
        workDuration = 25 * 60;
        shortBreak = 5 * 60;
        longBreak = 15 * 60;
        workSessionsBeforeLongBreak = 4;
        console.log(chalk.green('Time reset is successfull!'));
        changeSettings();
      } else if (ans === 6) {
        console.clear();
        mainMenu();
      } else {
        console.clear();
        console.log(chalk.red('Please Enter Correct Number!'));
        changeSettings();
      }
    }
  );
};

/**
 * Modifies the timer durations based on user input (work, short break, long break, or cycle count).
 *
 * @function changeTime
 * @param {number} ans - The user's choice for which duration to change (1 = work, 2 = short break, etc.).
 *
 * @example
 * changeTime(1); // Changes the work duration
 */

const changeTime = (ans) => {
  if (ans >= 1 && ans <= 3) {
    rl.question(chalk.cyan('Enter the time in minutes: '), (minutes) => {
      const min = parseInt(minutes);
      if (min) {
        const seconds = min * 60;
        if (ans === 1) {
          workDuration = seconds;
        } else if (ans === 2) {
          shortBreak = seconds;
        } else if (ans === 3) {
          longBreak = seconds;
        }
        console.clear();
        console.log(chalk.green(`Time Changed Successfully to ${min} minutes`));
        changeSettings();
      } else {
        console.clear();
        console.log(chalk.red('Please Enter Correct Time!'));
        changeTime(ans);
      }
    });
  } else {
    rl.question('Enter the cycle: ', (cycle) => {
      const cyc = parseInt(cycle);
      if (cyc) {
        workSessionsBeforeLongBreak = cyc;
        console.clear();
        console.log(chalk.green(`Cycle Changed Successfully to ${cyc} cycles`));
        changeSettings();
      } else {
        console.clear();
        console.log(chalk.red('Please Enter Correct Number!'));
        changeTime(ans);
      }
    });
  }
};

/**
 * Displays the saved statistics for completed work and break sessions, including total work/break times and completed cycles.
 *
 * @function statistics
 *
 * @example
 * statistics();
 */

const statistics = () => {
  if (fs.existsSync(savedStatePath)) {
    const data = fs.readFileSync(savedStatePath, 'utf-8');
    state = JSON.parse(data);
    const customState = [];
    state.forEach((element) => {
      let totalWorkMins = Math.floor(element.totalWorkTime / 60);
      const totalWorkHours = Math.floor(totalWorkMins / 60);
      const totalWorkSeconds = Math.floor(element.totalWorkTime % 60);
      totalWorkMins = Math.floor(totalWorkMins % 60);
      let totalBreakMins = Math.floor(element.totalBreakTime / 60);
      const totalBreakHours = Math.floor(totalBreakMins / 60);
      const totalBreakSeconds = Math.floor(element.totalBreakTime % 60);
      totalBreakMins = Math.floor(totalBreakMins % 60);
      customState.push({
        Date: element.id,
        Total_Work_Time: `${String(totalWorkHours).padStart(2, '0')}:${String(
          totalWorkMins
        ).padStart(2, '0')}:${String(totalWorkSeconds).padStart(2, '0')}`,
        Total_Break_Time: `${String(totalBreakHours).padStart(2, '0')}:${String(
          totalBreakMins
        ).padStart(2, '0')}:${String(totalBreakSeconds).padStart(2, '0')}`,
        Completed_Cycles: element.completedWorkSessions,
      });
    });
    console.table(customState);
  }
};

/**
 * Saves the current session state to a file when the program exits.
 * The saved state includes the total work time, total break time, and completed sessions for the day.
 *
 * @function savingWork
 *
 * @example
 * savingWork();
 */

const savingWork = () => {
  const currentDate = new Date();
  let state = [];
  const date = `${currentDate.getFullYear()}/${
    currentDate.getMonth() + 1
  }/${currentDate.getDate()}`;
  const currentState = {
    id: date,
    totalBreakTime,
    totalWorkTime,
    completedWorkSessions,
  };

  if (fs.existsSync(savedStatePath)) {
    const data = fs.readFileSync(savedStatePath, 'utf-8');
    state = JSON.parse(data);
  }
  if (state.length > 0) {
    if (state[state.length - 1].id === date) {
      state[state.length - 1].totalBreakTime += totalBreakTime;
      state[state.length - 1].totalWorkTime += totalWorkTime;
      state[state.length - 1].completedWorkSessions += completedWorkSessions;
    } else {
      state.push(currentState);
    }
  } else {
    state.push(currentState);
  }

  fs.writeFileSync(savedStatePath, JSON.stringify(state, null, 2), 'utf-8');
};

/**
 * Displays the main menu of the program, listing available commands and listening for user input.
 * When the program exits, it saves the current state and closes the readline interface.
 *
 * @function mainMenu
 *
 * @example
 * mainMenu();
 */

const mainMenu = () => {
  console.log(chalk.cyan(`Welcome to the Pomodoro Timer!\n`));
  console.log(
    chalk.cyan(
      `start (w) - Start the Pomodoro
settings - Change the time durations
stat - See the statistics
help (h) - See the available commands
exit - Exit the program`
    )
  );
  rl.prompt();
  rl.on('line', (command) => {
    commandHandler(command);
    rl.prompt();
  });
  rl.on('close', () => {
    console.log(chalk.green('\nExiting Pomodoro Timer. Goodbye!'));
    savingWork();
    process.exit(0);
  });
};

// clears the console and starts the program
console.clear();
mainMenu();
