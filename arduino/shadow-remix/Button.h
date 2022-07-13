#ifndef BUTTON_H
#define BUTTON_H

#include <Arduino.h>
#include "ButtonDebounce.h"
#include "Constants.h"

#define DEBOUNCE_DELAY 100 // Number of ms to perform debounce.

class Button
{
  public:
    // Constructor method.
    Button(byte index, int pinNumber) {
      this->_index = index;
      this->_button = new ButtonDebounce(pinNumber, DEBOUNCE_DELAY);
    }

    // Init button, call from setup().
    void init() {
      
    }

    // Check button state, call from loop().
    void update() {
      bool event = this->_button->update();
      if (event) {
        // Button pressed when state == LOW.
        // Write command when button pressed.
        if (this->_button->state() == LOW) {
          this->_writeCommand();
        }
      }
    }

  private:
    // ButtonDebounce instance.
    ButtonDebounce *_button;
    // Button index in serial commands (range 0-63).
    byte _index;

    void _writeCommand() {
      Serial.write(BUTTON_COMMAND_CODE << NUM_COMMAND_DATA_BITS | this->_index);
    }
};

#endif
