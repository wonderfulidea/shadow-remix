#include "Constants.h"
#include "Button.h"
#include "Motor.h"

// Motor config.
#define STEPPER_STEPS 200 // The number of steps on your motor.
#define RPM 10 // RPM of motor (approx).

// Define button configuration.
// Buttons should be connected to ground on one side and Arduino pin on the other.
// (Using internal pullup resistor in Arduino, no need for external current limiting resistor).
Button *buttons[] = {
  new Button(SAVE_BUTTON_INDEX, 2), // Save Button connected to digital pin 2.
  new Button(UNDO_BUTTON_INDEX, 3), // Undo Button connected to digital pin 3.
  new Button(CLEAR_BUTTON_INDEX, 4), // Clear Button connected to digital pin 4.
};

// Define motor configuration.
// Motor control switch should be connected to ground on one side and Arduino pin on the other.
// (Using internal pullup resistor in Arduino, no need for external current limiting resistor).
// DRV8825 wiring diagram: https://a.pololu-files.com/picture/0J4233.1200.png?665d623ba84232de64511d8aa6644836
Motor *motors[] = {
  // Motor(index, forwardPin, reversePin, motorDirPin, motorStepPin)
  new Motor(0, 5, 6, 12, 13, A4), // Motor (index 0) with switch connected to pins 5, 6, and motor connected to 12, 13, reed switch connected to A4.
  new Motor(1, 7, 8, 10, 11, A5), // Motor (index 1) with switch connected to pins 7, 8, and motor connected to 10, 11, reed switch connected to A5.
};

const int NUM_BUTTONS = sizeof(buttons) / sizeof(buttons[0]);
const int NUM_MOTORS = sizeof(motors) / sizeof(motors[0]);

void zero() {
  // Home motors.
  for (int i = 0; i < NUM_MOTORS; i++) {
      motors[i]->startZeroingRoutine();
  }
}

void setup() {
  // Initialize serial communication.
  Serial.begin(BAUD_RATE);
  Serial.flush();

  // Init buttons.
  for (int i = 0; i < NUM_BUTTONS; i++) {
      buttons[i]->init();
  }
  // Init motors.
  for (int i = 0; i < NUM_MOTORS; i++) {
      motors[i]->init(STEPPER_STEPS, RPM);
  }

  // Start by zeroing motors.
  zero();
}

void loop() {
  // Check buttons.
  for (int i = 0; i < NUM_BUTTONS; i++) {
      buttons[i]->update();
  }
  // Update motors.
  for (int i = 0; i < NUM_MOTORS; i++) {
      motors[i]->update();
  }
}

SIGNAL(TIMER1_COMPA_vect) {
  for (int i = 0; i < NUM_MOTORS; i++) {
      motors[i]->step();
  }
}
