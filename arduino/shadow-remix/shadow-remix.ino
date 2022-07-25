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
  new Button(SAVE_BUTTON_INDEX, 9), // Save Button connected to digital pin 9.
  new Button(UNDO_BUTTON_INDEX, 10), // Undo Button connected to digital pin 10.
  new Button(CLEAR_BUTTON_INDEX, 11), // Clear Button connected to digital pin 11.
};

// Define motor configuration.
// Motor control switch should be connected to ground on one side and Arduino pin on the other.
// (Using internal pullup resistor in Arduino, no need for external current limiting resistor).
// DRV8825 wiring diagram: https://a.pololu-files.com/picture/0J4233.1200.png?665d623ba84232de64511d8aa6644836
Motor *motors[] = {
  // Motor(index, forwardPin, reversePin, motorDirPin, motorStepPin)
  new Motor(1, 2, 3, A5, A4, 12), // Motor (index 0) with switch connected to pins 2, 3, and motor dir/step connected to A5, A4, reed switch connected to 12.
  new Motor(0, 4, 5, A3, A2, 13), // Motor (index 1) with switch connected to pins 4, 5, and motor dir/step connected to A3, A2, reed switch connected to 13.
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
