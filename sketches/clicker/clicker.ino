#include <SPI.h>
#include <Wire.h>
#include "painlessMesh.h"
#include "command.hpp"
#include "Adafruit_seesaw.h"
#include <seesaw_neopixel.h>
#include <Adafruit_SSD1306.h> // Include Adafruit SSD1306 library

#define MESH_PREFIX "whateverYouLike"
#define MESH_PASSWORD "somethingSneaky"
#define MESH_PORT 5555

#define SS_SWITCH 24
#define SS_NEOPIX 6
#define SEESAW_ADDR 0x36

Adafruit_seesaw ss;
seesaw_NeoPixel sspixel = seesaw_NeoPixel(1, SS_NEOPIX, NEO_GRB + NEO_KHZ800);
int32_t encoder_position; // Initialize encoder_position without value

// OLED setup
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1      // No reset pin
#define SCREEN_ADDRESS 0x3D // Adjust if needed

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

Scheduler userScheduler; // to control your personal task
painlessMesh mesh;

// Screen display function
void displayPosition(int32_t position)
{
  display.clearDisplay();
  display.setCursor(0, 0);
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.print("Position: ");
  display.println(position);
  display.display();
}

// User stub
void sendMessage();
Task taskSendMessage(TASK_SECOND * 1, TASK_FOREVER, &sendMessage);

void sendMessage()
{
  String msg = "Hello from node ";
  msg += mesh.getNodeId();
  mesh.sendBroadcast(msg);
  taskSendMessage.setInterval(random(TASK_SECOND * 1, TASK_SECOND * 5));
}

void executeCommand();
Task taskExecuteCommand(TASK_SECOND * 1, TASK_FOREVER, &executeCommand);
void executeCommand()
{
  String command;
  while (Serial.available())
  {
    command = Serial.readString();
    CommandAndParams cp(command);
    mesh.sendBroadcast(command);
  }
  taskExecuteCommand.setInterval(random(TASK_SECOND * 0.5, TASK_SECOND * 1));
}

// Function to set light color
void setLightColor(int r, int g, int b)
{
  uint32_t color = sspixel.Color(r, g, b);
  sspixel.setPixelColor(0, color);
  sspixel.show();
}

// Function to set options number
int options = 4;
void setOptionsNumber(int num)
{
  int32_t new_position = abs(ss.getEncoderPosition()) % num;

  if (encoder_position != new_position)
  {
    displayPosition(new_position);
    sspixel.setPixelColor(0, Wheel(new_position & 0xFF));
    sspixel.show();
    encoder_position = new_position;
    Serial.println(new_position);
  }
}

// Function to submit answer
void submitAnswer(int idx)
{
  String s = String(encoder_position); // Convert encoder_position to String
  mesh.sendBroadcast(s);
}

// Callback function for received messages
void receivedCallback(uint32_t from, String &msg)
{
  Serial.printf("startHere: Received from %u msg=%s\n", from, msg.c_str());
  CommandAndParams cp(msg);
  if (cp.command == "a")
  {
    Serial.printf("a:%u:%s", from, cp.params[0]);
  }
  if (cp.command == "l")
  {
    setLightColor(cp.params[0].toInt(), cp.params[1].toInt(), cp.params[2].toInt());
  }
  if (cp.command == "o")
  {
    setOptionsNumber(cp.params[0].toInt());
  }
  if (cp.command == "id")
  {
  }
}

// Callback function for new connection
void newConnectionCallback(uint32_t nodeId)
{
  Serial.printf("--> startHere: New Connection, nodeId = %u\n", nodeId);
}

// Callback function for changed connections
void changedConnectionCallback()
{
  Serial.printf("Changed connections\n");
}

// Callback function for adjusted time
void nodeTimeAdjustedCallback(int32_t offset)
{
  Serial.printf("Adjusted time %u. Offset = %d\n", mesh.getNodeTime(), offset);
}

int led_pin = LED_BUILTIN;

uint32_t Wheel(byte WheelPos) {
  
  float scalingFactor = 255.0 / options+1;  
  byte scaledPos = WheelPos * scalingFactor;

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

void setup()
{
  Serial.begin(115200);

  mesh.setDebugMsgTypes(ERROR | STARTUP);
  mesh.init(MESH_PREFIX, MESH_PASSWORD, &userScheduler, MESH_PORT);
  mesh.onReceive(&receivedCallback);
  mesh.onNewConnection(&newConnectionCallback);
  mesh.onChangedConnections(&changedConnectionCallback);
  mesh.onNodeTimeAdjusted(&nodeTimeAdjustedCallback);

  userScheduler.addTask(taskSendMessage);
  userScheduler.addTask(taskExecuteCommand);
  taskSendMessage.enable();
  taskExecuteCommand.enable();

  pinMode(led_pin, OUTPUT);
  digitalWrite(led_pin, LOW);
}

void loop()
{
  mesh.update();
}
