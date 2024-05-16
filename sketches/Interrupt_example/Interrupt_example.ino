#include "Adafruit_seesaw.h"
#include <seesaw_neopixel.h>

// Set up encoder
#define SS_SWITCH        24
#define SS_NEOPIX        6
#define SEESAW_ADDR      0x36
Adafruit_seesaw ss;
seesaw_NeoPixel sspixel = seesaw_NeoPixel(1, SS_NEOPIX, NEO_GRB + NEO_KHZ800);
int32_t encoder_position;
bool prev_button = 0;

const byte ledPin = LED_BUILTIN;
const byte interruptPin = D3;
const byte fakeGroundPin = D6;
volatile byte state = LOW;
volatile bool interruptFlag = false;

void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);
  pinMode(fakeGroundPin, INPUT);
  pinMode(interruptPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(interruptPin), blink, CHANGE);
  while (!Serial) delay(10);

  Serial.println("Looking for seesaw!");

  if (!ss.begin(SEESAW_ADDR) || !sspixel.begin(SEESAW_ADDR)) {
    Serial.println("Couldn't find seesaw on default address");
    while (1) delay(10);
  }
  Serial.println("seesaw started");

  uint32_t version = ((ss.getVersion() >> 16) & 0xFFFF);
  if (version != 4991) {
    Serial.print("Wrong firmware loaded? ");
    Serial.println(version);
    while (1) delay(10);
  }
  Serial.println("Found Product 4991");

  // Set not so bright!
  sspixel.setBrightness(20);
  sspixel.show();

  // Use a pin for the built-in encoder switch
  ss.pinMode(SS_SWITCH, INPUT_PULLUP);

  // Get starting position
  encoder_position = ss.getEncoderPosition();
  // uint32_t mask = ((uint32_t)1 << SS_SWITCH);
  uint32_t mask = (uint32_t)0x1FFFFFF;
  Serial.println("Turning on interrupts");
  delay(10);
  // ss.pinModeBulk(mask, INPUT_PULLUP);
  ss.setGPIOInterrupts(mask, 1);
  ss.enableEncoderInterrupt();
}

void loop() {
  if (interruptFlag) {
    encoder_position = ss.getEncoderPosition();
    int switch_pressed = ss.digitalRead(SS_SWITCH);
    interruptFlag = false; // Reset the flag
  }
}

void blink() {
  interruptFlag = true; // Set the flag
  Serial.printf("hi");

}