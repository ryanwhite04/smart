
#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "Adafruit_seesaw.h"
#include <seesaw_neopixel.h>
#include <WiFi.h>
#include <WebServer.h>

// Set up encoder
#define SS_SWITCH        24
#define SS_NEOPIX        6
#define SEESAW_ADDR          0x36
Adafruit_seesaw ss;
seesaw_NeoPixel sspixel = seesaw_NeoPixel(1, SS_NEOPIX, NEO_GRB + NEO_KHZ800);
int32_t encoder_position;
bool prev_button = 0;

// Set up screen
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET     -1 // Reset pin # (or -1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS 0x3D ///< See datasheet for Address; 0x3D for 128x64, 0x3C for 128x32
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

unsigned long lastUpdate = 0;
const long interval = 200;
String input = "";


/* Put your SSID & Password */
const char* ssid = "SeedXiao";  // replace <test> with your student ID
const char* password = "12345678";  //Enter Password here

/* Put IP Address details */
IPAddress local_ip(192,168,1,1);
IPAddress gateway(192,168,1,1);
IPAddress subnet(255,255,255,0);

WebServer server(80);

void updateDisplay(String message, int line) {
  int lineHeight = 8;  // Height of each line of text
  int yPosition = line * lineHeight;  // Calculate y position based on line number

  // Clear only the specific line by filling a rectangle across the screen width
  display.fillRect(0, yPosition, SCREEN_WIDTH, lineHeight, SSD1306_BLACK);

  // Set the cursor to the start of the specified line
  display.setCursor(0, yPosition);
  
  // Write the new message on the cleared line
  display.println(message);

  // Update the display to show changes
  display.display();
}

uint32_t Wheel(byte WheelPos) {
  WheelPos = 255 - WheelPos;
  if (WheelPos < 85) {
    return sspixel.Color(255 - WheelPos * 3, 0, WheelPos * 3);
  }
  if (WheelPos < 170) {
    WheelPos -= 85;
    return sspixel.Color(0, WheelPos * 3, 255 - WheelPos * 3);
  }
  WheelPos -= 170;
  return sspixel.Color(WheelPos * 3, 255 - WheelPos * 3, 0);
}

void handle_OnConnect() {
  Serial.println("GPIO32 Status: OFF | GPIO33 Status: OFF");
  server.send(200, "text/html", "hi"); 
}

#define SWITCH 7

void setup() {

  pinMode(SWITCH, INPUT_PULLUP);

  Serial.begin(115200);

  if (digitalRead(SWITCH)) {
    WiFi.softAP(ssid, password);
    WiFi.softAPConfig(local_ip, gateway, subnet);
  } {
    WIFI.begin(ssid, passsword);
  }
  delay(100);

  server.on("/", handle_OnConnect);
  server.begin();

  // Initialize with the I2C addr 0x3C (for the 128x64)
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;); // Don't proceed, loop forever
  }
  display.clearDisplay();
  // display.setTextSize(1);      // Normal 1:1 pixel scale
  display.setTextColor(SSD1306_WHITE); // Draw white text
  display.setCursor(0,0);     // Start at top-left corner
  // display.cp437(true);         // Use full 256 char 'Code Page 437' font

  if (!ss.begin(SEESAW_ADDR) || ! sspixel.begin(SEESAW_ADDR)) {
    Serial.println("Couldn't find seesaw on default address");
    while(1) delay(10);
  }
  Serial.println("seesaw started");
    uint32_t version = ((ss.getVersion() >> 16) & 0xFFFF);
  if (version  != 4991){
    Serial.print("Wrong firmware loaded? ");
    Serial.println(version);
    while(1) delay(10);
  }
  Serial.println("Found Product 4991");

  // set not so bright!
  sspixel.setBrightness(20);
  sspixel.show();
  
  // use a pin for the built in encoder switch
  ss.pinMode(SS_SWITCH, INPUT_PULLUP);

  // get starting position
  encoder_position = ss.getEncoderPosition();

  Serial.println("Turning on interrupts");
  delay(10);
  ss.setGPIOInterrupts((uint32_t)1 << SS_SWITCH, 1);
  ss.enableEncoderInterrupt();
}

void loop() {
  server.handleClient();
  while (Serial.available() > 0) {
    char c = (char)Serial.read();
    if (c == '\n') {
      updateDisplay(input, 1);
      input = "";
    } else {
      input += c;
    }
  }
  bool button = !ss.digitalRead(SS_SWITCH);
  if (button != prev_button) {
    prev_button = button;
    Serial.println("Button state: " + String(button));
  }

  int32_t new_position = ss.getEncoderPosition();
  // did we move arounde?
  if (encoder_position != new_position) {
    Serial.println(new_position);         // display new position

    // change the neopixel color
    sspixel.setPixelColor(0, Wheel(new_position & 0xFF));
    sspixel.show();
    encoder_position = new_position;      // and save for next round
  }


  // Construct the message string
  int time = millis();
  if (time - lastUpdate >= interval) {
    lastUpdate = time;
    String message = String(time) + "ms";
    updateDisplay(message, 0);
    Serial.println(message);
  }  
}