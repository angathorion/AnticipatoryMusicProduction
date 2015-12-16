# AMP (Anticipatory Music Production) [![Build Status](https://travis-ci.org/angathorion/amp-online.svg)](https://travis-ci.org/angathorion/amp-online)

## Purpose

This project is the development of a system enabling musicians to perform anticipatory music production in Western music
notation. The essential idea is to give musicians the ability to input music using MIDI devices at any point in the
score during playback, at the same time broadcasting the produced score to the partner in the same performance. By
enabling anticipatory input, the musician can let the partner know and anticipate their intentions for the music, so as
to shape the music in a coherent fashion.

The development of this project, as well as a research undertaking involving user testing with a number of musicians,
is intended to probe the potential that Western music notation may have on anticipatory music production, as well as
improvisation.

## Usage as a module

This application is standalone, and was not written with the intent of it serving as a module for other applications.
If you wish to do so, please note that the code is poorly optimized for such a purpose, and will require extensive
rewriting for any such use.

## Installation/Requirements

1. Clone the repository.

2. Change directory into the root of the repository.

3. Do 'npm install'.

## Running the Application

### Running it locally

1. Make sure you have nothing listening on port 5000.

2. Do 'node index.js'

3. Load up 'localhost:5000'

### Accessing the online version

Alternatively, you can visit the Heroku-hosted version at: https://amp-online.herokuapp.com/

## Usage as an Application

This is a multi-user platform, running on socket.io. Rooms can be created at will, denoted by a session name.

Users can join sessions without authentication. However, one cannot have more than 2 users in a session at the same time.
The behavior for doing so is undefined at the moment, so don't try it.

Make sure you have a MIDI input device attached to your computer before starting/joining a session.
 
Currently, in addition to inputting notes from your MIDI device, you can modify the following parameters:

1. The MIDI instrument
2. The MIDI input channel
3. The number of bars ahead to play in

Playback upon note input is supported; playback of notes at the 'now' line is not (yet).

## Future Features

### Motion detection

### Bar looping

## License

The code is available under the [MIT license](LICENSE.txt).
