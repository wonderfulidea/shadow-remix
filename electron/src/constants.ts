export const SCREEN_SAVER_WAIT_TIME = 5 * 60 * 1000; // Time in ms to wait before showing screensaver.

// IMPORTANT!!
// The remainder of this file should stay in sync with /arduino/shadow-remix/Constants.h

// Serial communication at 9600 bits per second.
export const BAUD_RATE = 9600;

// Define which bits in commands correspond to what information.
export const NUM_COMMAND_CODE_BITS = 2;
export const NUM_COMMAND_DATA_BITS = 8 - NUM_COMMAND_CODE_BITS;
export const NUM_MOTOR_INDEX_BITS = 2;
export const NUM_MOTOR_POSITION_BITS = NUM_COMMAND_DATA_BITS - NUM_MOTOR_INDEX_BITS;

// All command codes, range [0-3].
export const BUTTON_COMMAND_CODE = 0; // Button pressed.
export const MOTOR_COMMAND_CODE_HIGH = 1; // Motor moved, high bits.
export const MOTOR_COMMAND_CODE_LOW = 2; // Motor moved, low bits.

// Which buttons correspond to which functions.
export const SAVE_BUTTON_INDEX = 0;
export const UNDO_BUTTON_INDEX = 1;
export const CLEAR_BUTTON_INDEX = 2;