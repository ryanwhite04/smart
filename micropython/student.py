from machine import Pin, I2C, PWM

# import the LED library to drive the inbuilt led as a pwm
from machine import PWM

from utime import sleep, sleep_ms
from sys import version, platform
from ssd1306 import SSD1306_I2C

class Rotary:
    
    def __init__(self, a, b, change):
        self.change = change
        self.a = Pin(a, Pin.IN, Pin.PULL_UP)
        self.b = Pin(b, Pin.IN, Pin.PULL_UP)
        self.a.irq(trigger=Pin.IRQ_RISING | Pin.IRQ_FALLING, handler=self.callback)
        self.b.irq(trigger=Pin.IRQ_RISING | Pin.IRQ_FALLING, handler=self.callback)
    
        self.prev = self.next
        self.count = 0
    
    def set(self, value):
        self.count = value
        self.change(self.count)
    
    @property
    def next(self):
        return (self.a.value(), self.b.value())
        
    def __str__(self):
        return f"Rotary: {self.next}, {self.count}"
    
    def __repr__(self):
        return self.__str__()
    
    def update(self):
        self.prev = self.next
    
    def callback(self, pin):
        if self.prev != self.next:
            if self.prev == (1, 1):
                if self.next == (0, 1):
                    self.count += 1
                    self.count = min(24, self.count)
                elif self.next == (1, 0):
                    self.count -= 1
                    self.count = max(0, self.count)
                self.change(self.count)
            self.prev = self.next

def main():

    i2c = I2C(0, scl=Pin(1), sda=Pin(0))
    display = SSD1306_I2C(128, 32, i2c)
    display.fill(0)
    led = Pin("LED", Pin.OUT)
    pwm = PWM(led)
    def change_callback(value):
        display.fill(0)
        display.text(str(value), 0, 0)
        display.show()
        # set the led brightness to be value / 24
        pwm.duty_u16(int(value / 24 * 65535))
    rotary = Rotary(16, 17, change_callback)
    
    def push_callback(p):
        print("push")
        rotary.set(0)
        print(rotary)
    push = Pin(15, Pin.IN, Pin.PULL_UP)
    push.irq(trigger=Pin.IRQ_FALLING, handler=push_callback)

    while True: 
        sleep(1)

if __name__ == "__main__": main()