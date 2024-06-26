//************************************************************
// this is a simple example that uses the painlessMesh library
//
// 1. sends a silly message to every node on the mesh at a random time between 1 and 5 seconds
// 2. prints anything it receives to Serial.print
//
//
//************************************************************

#include <SPI.h>
#include <Wire.h>
#include "painlessMesh.h"
#include "command.hpp"
#include "Adafruit_seesaw.h"
#include <seesaw_neopixel.h>
#define MESH_PREFIX "whateverYouLike"
#define MESH_PASSWORD "somethingSneaky"
#define MESH_PORT 5555

// Set up encoder
#define SS_SWITCH        24
#define SS_NEOPIX        6
#define SEESAW_ADDR          0x36
Adafruit_seesaw ss;
seesaw_NeoPixel sspixel = seesaw_NeoPixel(1, SS_NEOPIX, NEO_GRB + NEO_KHZ800);
int32_t encoder_position;
bool prev_button = 0;

Scheduler userScheduler;  // to control your personal task
painlessMesh mesh;

// User stub
void sendMessage();  // Prototype so PlatformIO doesn't complain

Task taskSendMessage(TASK_SECOND * 1, TASK_FOREVER, &sendMessage);

void sendMessage() {
  String msg = "Hello from node ";
  msg += mesh.getNodeId();
  mesh.sendBroadcast(msg);
  taskSendMessage.setInterval(random(TASK_SECOND * 1, TASK_SECOND * 5));
}

void executeCommand();
Task taskExecuteCommand(TASK_SECOND * 1, TASK_FOREVER, &executeCommand);
void executeCommand() {
  String command;
  while (Serial.available()) {
    command = Serial.readString();
    CommandAndParams cp(command);
    mesh.sendBroadcast(command);
  }
  taskExecuteCommand.setInterval(random(TASK_SECOND * 0.5, TASK_SECOND * 1));
}

// features need to be implemented
void setLightColor(int r, int g, int b) {
  uint32_t color = sspixel.Color(r,  g, b);
  sspixel.setPixelColor(0, color);
  sspixel.show();
}

int options = 4;
void setOptionsNumber(int num) {
  options = num;
}
void submitAnswer(int idx) {
  String s = "a:";
  s += idx;

  mesh.sendBroadcast(s);
}

// Needed for painless library
void receivedCallback(uint32_t from, String &msg) {
  Serial.printf("startHere: Received from %u msg=%s\n", from, msg.c_str());
  CommandAndParams cp(msg);
  if (cp.command == "a") {
    // submitting students' answers
    Serial.printf("a:%u:%s", from, cp.params[0]);
  }
  if (cp.command == "l") {
    setLightColor(cp.params[0].toInt(), cp.params[1].toInt(), cp.params[2].toInt());
  }
  if (cp.command == "o") {
    setOptionsNumber(cp.params[0].toInt());
  }
  if (cp.command == "id") {
    // only when we use p2p communications
  }
}

void newConnectionCallback(uint32_t nodeId) {
  Serial.printf("--> startHere: New Connection, nodeId = %u\n", nodeId);
}

void changedConnectionCallback() {
  Serial.printf("Changed connections\n");
}

void nodeTimeAdjustedCallback(int32_t offset) {
  Serial.printf("Adjusted time %u. Offset = %d\n", mesh.getNodeTime(), offset);
}

int led_pin = LED_BUILTIN;

void setup() {
  Serial.begin(115200);

  // mesh.setDebugMsgTypes(ERROR | MESH_STATUS | CONNECTION | SYNC | COMMUNICATION | GENERAL | MSG_TYPES | REMOTE);  // all types on
  mesh.setDebugMsgTypes( ERROR | STARTUP );  // set before init() so that you can see startup messages

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

void loop() {
  // it will run the user scheduler as well
  mesh.update();
  


  // int32_t new_position = ss.getEncoderPosition();  
  // if (encoder_position != new_position) {
  //   encoder_position = new_position;      // and save for next round
  // }
  // bool button = !ss.digitalRead(SS_SWITCH);
  // if (button != prev_button) {
  //   int index = encoder_position % options;
  //   prev_button = button;
  //   submitAnswer(index);
  // }
}
