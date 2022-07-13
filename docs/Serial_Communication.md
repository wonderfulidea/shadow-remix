# Serial Communication

This document describes the serial commands for communicating between the Shadow Remix desktop app and arduino.

- [Messages from Arduino to Desktop App](#messages-from-arduino-to-desktop-app)
  - [Button Pressed Commands](#button-pressed-commands)
  - [Motor Moved Commands](#motor-moved-commands)
- [Development](Development)


## Messages from Arduino to Desktop App

The arduino sends byte commands to the Desktop app to notify it of hardware interactions.  These commands have the form:

`C C D D D D D D`

The first two bits of each command give the command code (`C`) and the remaining six bits are the command data (`D`).


### Button Pressed Commands

Button pressed commands have a code of 0 and the data bits give the index (`I`) of the pressed button.  So button commands have the form:

`0 0 I I I I I I`

This format supports up to 64 (2^6) buttons.


### Motor Moved Commands

Motor moved commands are split into two bytes.  The first byte has a code of 1 and the data bits are broken up into two bits for the index (`I`) of the motor and four bits for the high bits (`H`) of the angle of the motor.  The second byte has a code of 2 and the remaining 6 bits are the low bits (`L`) of the motor angle.  So motor commands have the form:

`0 1 I I H H H H`     `1 0 L L L L L L`

This format supports up to 4 (2^2) motors with 1024 (2^10) possible angle values (the current code only uses the number 0-360 to represent position).  The high and low bits are combined to form a 10 bit number:

`H H H H L L L L L L`


## Development

Any changes to the serial communication API should be updated in both the desktop app and the arduino code.  To make changes to the API, see [electron/src/constants.ts](../electron/src/constants.ts) and [arduino/shadow-remix/Constants.h](../arduino/shadow-remix/Constants.h).
