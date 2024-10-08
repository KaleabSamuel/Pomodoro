# Pomodoro Timer CLI Application

This **Pomodoro Timer** is a terminal-based application that helps users improve productivity by alternating between work sessions and breaks. It implements the **Pomodoro Technique**, which involves working for focused intervals (typically 25 minutes) followed by short breaks (5 minutes), with longer breaks (15 minutes) after completing several work intervals (4 cycles).

This project is written in **Node.js** and runs in the command line, providing functionalities such as customizable session durations, notifications with custom sounds, session tracking, and statistics logging.

## Features

- **Timer Functionality**:
  - Work, short break, and long break intervals.
  - Customizable work duration, break durations, and cycles.
  - Option to pause, resume, and reset the timer.
- **Notification System**:

  - Desktop notifications when sessions start and end.
  - Custom notification sound for session transitions.

- **Session Statistics**:

  - Tracks total work time, break time, and completed Pomodoro cycles.
  - Saves daily statistics for future reference.

- **Command-line Interaction**:
  - Easy-to-use terminal interface with commands to control the timer.

## File Structure

```
pomodoro
│
├── assets/
│   ├── images/
│   │   └── alarm-clock.png          # Image for desktop notifications
│   ├── sounds/
│   │   └── chimes.wav               # Custom sound for notifications
│   ├── data/
│   │   └── savedState.json          # Stores session statistics
│
├── src/
│   └── app.js                       # Main application code
│
├── node_modules/                    # Dependencies installed via npm
├── package.json                     # Project configuration
└── README.md                        # Project documentation
```

### Key Files:

- `assets/sounds/chimes.wav`: Custom sound for session notifications.
- `assets/images/alarm-clock.png`: Icon for the desktop notifications.
- `assets/data/savedState.json`: JSON file that stores the session statistics.

## Installation

### Prerequisites:

- [Node.js](https://nodejs.org/en/download/) (version 12 or higher)

### Steps:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/KaleabSamuel/Pomodoro.git
   cd pomodoro
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run the application**:
   ```bash
   node src/app.js
   ```

## Commands

Once the application is running, the following commands can be entered:

- `start`: Starts the Pomodoro timer.
- `stop`: Stops the current timer.
- `pause`: Pauses the current timer.
- `resume`: Resumes the paused timer.
- `reset`: Resets the timer and session counters.
- `settings`: Modify work duration, break durations, and long break cycle.
- `stat`: View the session statistics (work time, break time, completed cycles).
- `help`: Displays the list of available commands.
- `exit`: Exits the program and saves the session data.

## Customizing Timer Settings

By default, the timer is set to:

- **Work duration**: 25 minutes
- **Short break**: 5 minutes
- **Long break**: 15 minutes
- **Work cycles before long break**: 4 cycles

You can modify these settings interactively during the session by typing `settings` in the terminal.

## Session Statistics

The application logs the total time spent on work and breaks, along with the number of completed Pomodoro cycles. The statistics are saved in the `assets/data/savedState.json` file and can be accessed using the `stat` command. The statistics are saved on a daily basis and updated upon exiting the application.

## Notifications

The application sends desktop notifications at the start and end of each session. A custom sound (`chimes.wav`) is played to alert you when a session ends.

To customize the notification sound:

- Replace the `chimes.wav` file in the `assets/sounds/` directory with your own `.wav` file.

To change the notification icon:

- Replace `alarm-clock.png` in the `assets/images/` directory.

## Error Handling

In case the sound file or image file is missing or corrupted, the application will log an error message in the terminal, but it will continue functioning without interruptions.

## Contributing

Contributions are welcome! Feel free to open a pull request or an issue to discuss changes.

---
