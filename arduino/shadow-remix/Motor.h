#ifndef MOTOR_H
#define MOTOR_H

#include <Arduino.h>
#include "ButtonDebounce.h"
#include "Constants.h"

#define MAX_POSITION 360 // We are tracking 360 degrees of angular resolution.
#define SWITCH_DEBOUNCE_DELAY 100 // Number of ms to perform debounce on fwd/rev controls.
#define REED_SWITCH_DEBOUNCE_DELAY 0 // Number of ms to perform debounce on reed switch.

class Motor
{
  public:
    Motor(
      byte index,
      int forwardButtonPin,
      int reverseButtonPin,
      int dirPin,
      int stepPin,
      int reedSwitchPin
    ) {
      this->_index = index;
      this->_dirPin = dirPin;
      this->_stepPin = stepPin;
      this->_fwdBtn = new ButtonDebounce(forwardButtonPin, SWITCH_DEBOUNCE_DELAY);
      this->_revBtn = new ButtonDebounce(reverseButtonPin, SWITCH_DEBOUNCE_DELAY);
      this->_reedSwitch = new ButtonDebounce(reedSwitchPin, REED_SWITCH_DEBOUNCE_DELAY);
    }

    // Init motor, call from setup().
    void init(int steps, float rpm) {
      // TIMER 1 setup (OK if we hit this more than once).
      cli(); // Stop interrupts.
      TCCR1A = 0;
      TCCR1B = 0;
      TCNT1  = 0;
      OCR1A = int(float(16000000 / 256) / (2.0 * float(steps) * rpm / 60.0) - 1); // Must be <65536.
      TCCR1B |= (1 << WGM12);
      TCCR1B |= (1 << CS12) | (0 << CS11) | (0 << CS10);
      TIMSK1 |= (1 << OCIE1A);
      sei(); // Allow interrupts.
      
      pinMode(this->_dirPin, OUTPUT);
      pinMode(this->_stepPin, OUTPUT);
      digitalWrite(this->_stepPin, _stepPinState);
    }

    // Check button states and update motor, call from loop().
    void update() {
      if (this->_isZeroing) {
        // If in zeroing mode, drive forward until we trigger the reed switch.
        // Check if we've hit the switch.
        bool reedStateChanged = this->_reedSwitch->update();
        if (reedStateChanged && this->_zeroSteps > 180 && this->_reedSwitch->state() == LOW) {
          // Update internal motor position.
          this->_motorPosition = 0;
          // End zeroing mode.
          this->_isZeroing = false;
        }
      } else {
        bool fwdButtonChanged = this->_fwdBtn->update();
        // Button pressed when state == LOW.
        bool fwdButtonState = this->_fwdBtn->state();
        if (fwdButtonState == LOW) {
          this->_direction = HIGH;
        }
      
        bool revButtonChanged = this->_revBtn->update();
        // Button pressed when state == LOW.
        bool revButtonState = this->_revBtn->state();
        if (revButtonState == LOW) {
          this->_direction = LOW;
        }

        if (fwdButtonChanged || revButtonChanged) {
          // When starting or finishing driving motor, update position in app.
          // Only really needed on finish, but this has the secondary effect of waking up the app
          // from screensaver when motor starts to move.
          this->_writeCommand();
        }

        this->_enabled = (fwdButtonState == LOW) || (revButtonState == LOW);
      }
    }

    void step() {
      if (!this->_enabled) return;
      digitalWrite(this->_dirPin, this->_direction);
      // Toggle step pin.
      this->_stepPinState = !this->_stepPinState;
      digitalWrite(this->_stepPin, _stepPinState);
   
      // Increment motorPosition while staying in range [0, MAX_POSITION],
      int newPosition  = this->_motorPosition + (this->_direction ? 1 : -1);
      if (newPosition > MAX_POSITION) {
        newPosition = 0;
      } else if (newPosition < 0) {
        newPosition = MAX_POSITION;
      }
      this->_motorPosition = newPosition;
      if (this->_isZeroing) {
        this->_zeroSteps += 1;
      }
    }

    void startZeroingRoutine() {
      this->_zeroSteps = 0;
      this->_isZeroing = true;
      // Drive motors forward until reed sensor is triggered.
      // This routine is picked up in update() function.
      this->_direction = HIGH;
      this->_enabled = true;
    }
   
  private:
    // Motor index in serial commands (range 0-4).
    byte _index;
    // Motor state.
    volatile int _motorPosition = 0;
    // Stepper connections.
    int _dirPin;
    int _stepPin;
    // Stepper state.
    bool _enabled = false;
    bool _direction = HIGH; // HIGH is forward, LOW is reverse.
    volatile bool _stepPinState = LOW;
    // Flag to signal zeroing mode.
    bool _isZeroing = false;
    int _zeroSteps = 0; // Ensure that we rotate at least a half revolution during zero routine.
    ButtonDebounce *_reedSwitch;
  
    // Button instances.
    ButtonDebounce *_fwdBtn;
    ButtonDebounce *_revBtn;

    void _writeCommand() {
      byte dataMask = ((1 << NUM_COMMAND_DATA_BITS) - 1);
      Serial.write(MOTOR_COMMAND_CODE_HIGH << NUM_COMMAND_DATA_BITS | this->_index << NUM_MOTOR_POSITION_BITS | (this->_motorPosition >> NUM_COMMAND_DATA_BITS) & dataMask);
      Serial.write(MOTOR_COMMAND_CODE_LOW << NUM_COMMAND_DATA_BITS | this->_motorPosition & dataMask);
    }
};

#endif
