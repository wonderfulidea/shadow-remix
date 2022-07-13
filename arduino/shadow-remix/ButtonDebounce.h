/*
 * This is a odified version of:
  ButtonDebounce.h - Library for Button Debounce.
  Created by Maykon L. Capellari, September 30, 2017.
  Released into the public domain.
*/
#ifndef ButtonDebounce_h
#define ButtonDebounce_h

#include <Arduino.h>

class ButtonDebounce{
  
  private:
  
    int _pin;
    unsigned long _delay;
    unsigned long _lastDebounceTime = 0;
    unsigned long _lastChangeTime = 0;
    bool _lastStateBtn = HIGH;
    
    bool _isTimeToUpdate(){
      return (millis() - this->_lastDebounceTime) > this->_delay / 8;
    }
   
  public:
  
    ButtonDebounce(int pin, unsigned long delayLength) {
      pinMode(pin, INPUT_PULLUP);
      this->_pin = pin;
      this->_delay = delayLength;
    }
    
    boolean update() {
      if (!this->_isTimeToUpdate()) return false;
      this->_lastDebounceTime = millis();
      bool btnState = digitalRead(_pin);
      if (btnState == this->_lastStateBtn) {
        this->_lastChangeTime = millis();
        return false;
      };
      if (millis() - this->_lastChangeTime < this->_delay) {
        return false;
      }
      // Now at least least 8 sample points in _delay time changed.
      // so that counts.
      this->_lastStateBtn = btnState;
      return true; // Let outside know that a change has happened.
    }
    
    bool state() {
      return this->_lastStateBtn;
    }
};

#endif
