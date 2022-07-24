#ifndef CONSTANTS_H
#define CONSTANTS_H

// You will need to change this when uploading to different station.
#define STATION_ID = 0;

// IMPORTANT!!
// This file should stay in sync with /electron/src/constants.ts

// Serial communication at 9600 bits per second.
#define BAUD_RATE 9600

// Define which bits in commands correspond to what information.
#define  NUM_COMMAND_CODE_BITS 2
#define  NUM_COMMAND_DATA_BITS (8 - NUM_COMMAND_CODE_BITS)
#define  NUM_MOTOR_INDEX_BITS 2
#define  NUM_MOTOR_POSITION_BITS (NUM_COMMAND_DATA_BITS - NUM_MOTOR_INDEX_BITS)

// All command codes, range [0-3].
#define BUTTON_COMMAND_CODE 0 // Button pressed.
#define MOTOR_COMMAND_CODE_HIGH 1 // Motor moved, high bits.
#define MOTOR_COMMAND_CODE_LOW 2 // Motor moved, low bits.
#define STATION_ID_COMMAND_CODE 3 // Station ID.

// Which buttons correspond to which functions.
#define SAVE_BUTTON_INDEX 0
#define UNDO_BUTTON_INDEX 1
#define CLEAR_BUTTON_INDEX 2

#endif
