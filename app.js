const readline = require('readline');
const notifier = require('node-notifier');
const path = require('path');
const fs = require('fs');
const player = require('node-wav-player');

const workDuration = 25 * 60; // 25 minutes in seconds
const shortBreak = 5 * 60; // 5 minutes in seconds
const longBreak = 15 * 60; // 15 minutes in seconds
const workSessionsBeforeLongBreak = 4;

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
  prompt: 'Insert a command: ',
});

// Notification sound
const notificationSound = () => {
  try {
    player.play({
      path: 'chimes.wav',
    });
  } catch (err) {
    console.error('Error playing sound:', err);
  }
};

// Format the time to be printed as a time
const timeFormatter = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Contdown any time it is given
const startTimer = (duration, label, callback) => {
  timeRemaining = duration;
  currentSession = label;
  running = true;
  paused = false;

  timeInterval = setInterval(() => {
    process.stdout.write(`\r${label} Session: ${timeFormatter(timeRemaining)}`);
    timeRemaining--;

    if (timeRemaining < 0) {
      clearInterval(timeInterval);
      console.log(`\n${label} ended.`);

      notificationSound();
      notifier.notify({
        title: 'Timer Notification',
        message: `\n${label} ended.`,
        icon: path.join(__dirname, 'alarm-clock.png'),
        sound: false,
      });

      callback();
    }
  }, 1000);
};

// Starts the work session
const startWorkSession = () => {
  console.clear();
  console.log(`\nWork Session Started`);
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

// Starts the Short Break session
const startShortBreak = () => {
  console.log(`\nTake a short break!`);
  startTimer(shortBreak, 'Short Break', startWorkSession);
  totalBreakTime += shortBreak;
};

// Starts the Long Break session
const startLongBreak = () => {
  console.log(`\nTime for a long break!`);
  startTimer(longBreak, 'Long Break', () => {
    startWorkSession();
  });
  totalBreakTime += longBreak;
};

// controls any comman that is given by the user
const commandHandler = (command) => {
  const com = command.trim().toLowerCase();
  switch (com) {
    case 'start':
      if (!running && !paused) {
        startWorkSession();
      } else {
        console.log('Timer is may be running or paused');
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
      console.clear();
      displayHelp();
      break;
    case 'exit':
      rl.close();
      break;
    case 'pause':
      if (running && !paused) {
        pause();
      } else {
        console.log('No timer to pause.');
      }
      break;
    case 'resume':
      if (paused) {
        resume();
      } else {
        console.log('No timer to resume.');
      }
      break;
    case 'stop':
      if (running || paused) {
        console.clear();
        stop();
      } else {
        console.log('No timer to stop.');
      }
      break;
    case 'reset':
      console.clear();
      reset();
      break;
    default:
      console.clear();
      console.log('Please enter a valid command!');
    // mainMenu();
  }
};

const displayHelp = () => {
  console.log(
    `
Available Commands:
start   - Start the Pomodoro timer
stop    - Stop the current timer
pause   - Pause the current timer
resume  - Resume the paused timer
reset   - Reset the timer
settings - Change timer settings (work/break durations)
help    - Display this help message
exit    - Exit the program
`
  );
};

const pause = () => {
  clearInterval(timeInterval);
  running = false;
  paused = true;
  console.log(`\n${currentSession} has been paused.`);
};

const resume = () => {
  console.log(`\n${currentSession} session resuming...`);
  startTimer(timeRemaining, currentSession, () => {
    if (completedWorkSessions % workSessionsBeforeLongBreak === 0) {
      startLongBreak();
    } else {
      startShortBreak();
    }
  });
};

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
  console.log(`\n${currentSession} session stopped.`);
};

const reset = () => {
  clearInterval(timeInterval);
  running = false;
  paused = false;
  timeRemaining = 0;
  totalBreakTime = 0;
  totalWorkTime = 0;
  completedWorkSessions = 0;
  console.log(`\nTimer has been reset`);
};

// Handes the options that is given to the user to change the time durations
const changeSettings = () => {
  rl.question(
    `1) Change the work duration
2) Change the short break duration
3) Change the long break duration
4) Change the the cycle the long break appears
5) Back
Insert a Number (1-5)`,
    (answer) => {
      const ans = parseInt(answer);
      if (ans >= 1 && ans <= 4) {
        changeTime(ans);
      } else if (ans === 5) {
        console.clear();
        mainMenu();
      } else {
        console.clear();
        console.log('Please Enter Correct Number!');
        changeSettings();
      }
    }
  );
};

// the actual function that does the change to the time durations
const changeTime = (ans) => {
  if (ans >= 1 && ans <= 3) {
    rl.question('Enter the time in minutes: ', (minutes) => {
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
        changeSettings();
      } else {
        console.clear();
        console.log('Please Enter Correct Time!');
        changeTime(ans);
      }
    });
  } else {
    rl.question('Enter the cycle: ', (cycle) => {
      const cyc = parseInt(cycle);
      if (cyc) {
        workSessionsBeforeLongBreak = cyc;
        console.clear();
        changeSettings();
      } else {
        console.clear();
        console.log('Please Enter Correct Number!');
        changeTime(ans);
      }
    });
  }
};

// Fetch and display the statistics that is saved in the file
const statistics = () => {
  if (fs.existsSync('savedState.json')) {
    const data = fs.readFileSync('savedState.json', 'utf-8');
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

// saves the current dates states when the program closes
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

  if (fs.existsSync('savedState.json')) {
    const data = fs.readFileSync('savedState.json', 'utf-8');
    state = JSON.parse(data);
  }
  if (state.length > 0) {
    if (state[state.length - 1].id === date) {
      state[state.length - 1].totalBreakTime += totalBreakTime;
      state[state.length - 1].totalWorkTime += totalWorkTime;
      state[state.length - 1].completedWorkSessions += completedWorkSessions;
    }
  } else {
    state.push(currentState);
  }

  fs.writeFileSync('savedState.json', JSON.stringify(state, null, 2), 'utf-8');
};

// Displays the main menu and listens to the command being given
const mainMenu = () => {
  console.log(`Welcome to the Pomodoro Timer!\n`);
  console.log(
    `start - Start the Pomodoro
settings - Change the time durations
stat - See the statistics
help - See the available commands
exit - Exit the program`
  );
  rl.prompt();
  rl.on('line', (command) => {
    commandHandler(command);
    rl.prompt();
  });
  rl.on('close', () => {
    console.log('\nExiting Pomodoro Timer. Goodbye!');
    savingWork();
    process.exit(0);
  });
};

// clears the console and starts the program
console.clear();
mainMenu();
