#include "Adafruit_seesaw.h"
#include <seesaw_neopixel.h>
#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SS_SWITCH 24
#define SS_NEOPIX 6
#define SEESAW_ADDR 0x36

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1  // No reset pin
#define SCREEN_ADDRESS 0x3D  // Adjust if needed

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

Adafruit_seesaw ss;
seesaw_NeoPixel sspixel = seesaw_NeoPixel(1, SS_NEOPIX, NEO_GRB + NEO_KHZ800);

int32_t encoder_position = 0;  // Initialize the encoder's position

// Function to display the encoder's position on the OLED
void displayPosition(int32_t position) {
  display.clearDisplay();  // Clear the OLED display
  display.setCursor(0, 0);  // Set the cursor to the top-left corner
  display.setTextSize(2);  // Normal text size
  display.setTextColor(SSD1306_WHITE);  // White text
  display.print("Encoder\nPosition: ");
  display.println(position);  // Display the encoder's position
  display.display();  // Refresh the display
}

void setup() {
  Serial.begin(9600);

  // Initialize the OLED display
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println("OLED initialization failed!");
    while (1) delay(10);  // Halt if initialization fails
  }

  // Initialize the rotary encoder
  if (!ss.begin(SEESAW_ADDR) || !sspixel.begin(SEESAW_ADDR)) {
    Serial.println("Couldn't find seesaw");
    while (1) delay(10);  // Halt if seesaw initialization fails
  }

  // Set Neopixel brightness
  sspixel.setBrightness(20);
  sspixel.show();

  // Get the starting encoder position
  encoder_position = ss.getEncoderPosition();
}

void loop() {
  // Read the new encoder position
  int32_t new_position = abs(ss.getEncoderPosition()) % 13;

  if (encoder_position != new_position) {
    // If the encoder position has changed, update the display and Neopixel
    displayPosition(new_position);  // Display the new encoder position
    sspixel.setPixelColor(0, Wheel(new_position & 0xFF));
    sspixel.show();

    // Update the stored encoder position
    encoder_position = new_position;

    // Debug output
    Serial.println(new_position);
  }

  // Don't overwhelm the serial port
  delay(100);  // Short delay in loop
}

uint32_t Wheel(byte WheelPos) {
  // Scale WheelPos from 0-12 to 0-255
  float scalingFactor = 255.0 / 12.0;  // Scale to map 0-12 to 0-255
  byte scaledPos = WheelPos * scalingFactor;  // Apply scaling

  // Determine the color based on the scaled position
  if (scaledPos < 85) {
    return sspixel.Color(255 - scaledPos * 3, 0, scaledPos * 3);  // Red to Blue
  } else if (scaledPos < 170) {
    scaledPos -= 85;
    return sspixel.Color(0, scaledPos * 3, 255 - scaledPos * 3);  // Blue to Green
  } else {
    scaledPos -= 170;
    return sspixel.Color(scaledPos * 3, 255 - scaledPos * 3, 0);  // Green to Red
  }
}