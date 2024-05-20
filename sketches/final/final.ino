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
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <seesaw_neopixel.h>

// Set up encoder
#define SS_SWITCH 24
#define SS_NEOPIX 6
#define SEESAW_ADDR 0x36
Adafruit_seesaw ss;
seesaw_NeoPixel sspixel = seesaw_NeoPixel(1, SS_NEOPIX, NEO_GRB + NEO_KHZ800);
int32_t encoder_position;
bool prev_button = 0;
const byte interruptPin = D3;
const byte fakeGroundPin = D6;
volatile byte state = LOW;
volatile bool interruptFlag = false;

// Set up screen
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1       // Reset pin # (or -1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS 0x3D ///< See datasheet for Address; 0x3D for 128x64, 0x3C for 128x32
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Set up mesh network
#define MESH_PREFIX "whateverYouLike"
#define MESH_PASSWORD "somethingSneaky"
#define MESH_PORT 5555
painlessMesh mesh;

Scheduler userScheduler; // to control your personal task

// C3 has no buildin led
// const byte ledPin = LED_BUILTIN;

bool mock = false;
bool isHub = false;


void updateDisplay(String message, int line)
{
  if (mock) {
    return;
  }
  if (!display.availableForWrite()) {
    return;
  }

  int lineHeight = 8;                // Height of each line of text
  int yPosition = line * lineHeight; // Calculate y position based on line number

  // Clear only the specific line by filling a rectangle across the screen width
  display.fillRect(0, yPosition, SCREEN_WIDTH, lineHeight, SSD1306_BLACK);

  // Set the cursor to the start of the specified line
  display.setCursor(0, yPosition);

  // Write the new message on the cleared line
  display.println(message);

  // Update the display to show changes
  display.display();
}

// User stub
void sendMessage(); // Prototype so PlatformIO doesn't complain

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
    if (cp.command == "id")
    {
      isHub = true;
      Serial.printf("id:%u\n", mesh.getNodeId());
    }
    else
    {
      mesh.sendBroadcast(command, true);
    }
  }
  taskExecuteCommand.setInterval(random(TASK_SECOND * 0.5, TASK_SECOND * 1));
}

// features need to be implemented
void setLightColor(int r, int g, int b)
{
  if (mock) return;
  uint32_t color = sspixel.Color(r, g, b);
  sspixel.setPixelColor(0, color);
  sspixel.show();
}

String name;

int options = -1;
int choosed = -1;
int submitted = -1;
int origin_position = 0;
void setOptionsNumber(int num)
{
  if (num <= 1) {
    return;
  }
  options = num;
  choosed = -1;
  submitted = -1;
  
  if (mock) {
    return;
  }
  updateDisplay("", 5);
  origin_position = encoder_position;
  updateDisplay(String(num) + String(" options provided."), 1);
  updateDisplay(name + String(", what's your option?"), 2);
  setLightColor(255, 255, 0);
}

void select(int num) {
  if (options <= 1) {
    return;
  }
  choosed = num % options;
  if (choosed < 0) {
    choosed += options;
  }
  Serial.printf("select: %d\n", choosed);
  String res;
  // int x = choosed;
  // while (x > 0) {
  //   --x;
  //   res = String((char)((x % 26) + 'A')) + res;
  //   x /= 26;
  // }
  res = String(choosed + 1);

  updateDisplay(String(""), 3);
  updateDisplay(String("You chose option ") + res, 2);
}

void setName(String newName)
{
  name = newName;
  Serial.printf("got a new name: %s\n", name);
  updateDisplay(String("Hi, ") + name, 1);
}

void submitAnswer(int idx)
{
  String s = "a:";
  s += String(idx);
  submitted = idx;
  String res = String(submitted);
  updateDisplay(String("Option ") + res + String(" is submitted"), 5);
  setLightColor(255, 255, 255);

  mesh.sendBroadcast(s);
}

void oneTimeTask() {
  long idx = random(0, options - 1);
  Serial.printf("mocking: option %d\n", idx);
  submitAnswer(idx);
}
Task* taskXXXX;
void submitRandomAnswer() {
  Serial.println("mocking");
  taskXXXX = new Task(5000, TASK_ONCE, &oneTimeTask);
  userScheduler.addTask(*taskXXXX);
  taskXXXX->enable();
}

// Needed for painless library
void receivedCallback(uint32_t from, String &msg)
{
  Serial.printf("Received from %u msg=%s\n", from, msg.c_str());
  CommandAndParams cp(msg);
  if (cp.command == "a")
  {
    // submitting students' answers
    Serial.printf("a:%u:%s\n", from, cp.params[0]);
  }
  if (cp.command == "l")
  {
    setLightColor(cp.params[0].toInt(), cp.params[1].toInt(), cp.params[2].toInt());
  }
  if (cp.command == "o")
  {
    setOptionsNumber(cp.params[0].toInt());
    if (mock) {
      submitRandomAnswer();
    }
  }
  if (cp.command == "n")
  {
    if (cp.params[0].toInt() == mesh.getNodeId())
      setName(cp.params[1]);
  }
}

void newConnectionCallback(uint32_t nodeId)
{
  Serial.printf("New Connection, nodeId = %u\n", nodeId);
}

void changedConnectionCallback()
{
  Serial.printf("Changed connections\n");
}

void nodeTimeAdjustedCallback(int32_t offset)
{
  Serial.printf("Adjusted time %u. Offset = %d\n", mesh.getNodeTime(), offset);
}

void setup_seesaw()
{
  pinMode(fakeGroundPin, INPUT);
  pinMode(interruptPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(interruptPin), onTap, FALLING);
  while (!Serial)
    delay(10);

  Serial.println("Looking for seesaw!");

  if (!ss.begin(SEESAW_ADDR) || !sspixel.begin(SEESAW_ADDR))
  {
    mock = true;
    Serial.println("Couldn't find seesaw on default address, working in mocking mode");
    return;
  }
  Serial.println("seesaw started");

  uint32_t version = ((ss.getVersion() >> 16) & 0xFFFF);
  if (version != 4991)
  {
    Serial.print("Wrong firmware loaded? ");
    Serial.println(version);
    while (1)
      delay(10);
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

void setup_display()
{
  // Initialize with the I2C addr 0x3C (for the 128x64)
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS))
  {
    Serial.println("Couldn't find SSD1306, working as Smart Hub");
    return;
  }
  display.clearDisplay();
  // display.setTextSize(1);      // Normal 1:1 pixel scale
  display.setTextColor(SSD1306_WHITE); // Draw white text
  display.setCursor(0, 0);             // Start at top-left corner
  // display.cp437(true);         // Use full 256 char 'Code Page 437' font 
}

void setup()
{
  randomSeed(analogRead(0));

  Serial.begin(115200);
  setup_seesaw();
  setup_display();

  // mesh.setDebugMsgTypes(ERROR | MESH_STATUS | CONNECTION | SYNC | COMMUNICATION | GENERAL | MSG_TYPES | REMOTE);  // all types on
  mesh.setDebugMsgTypes(ERROR | STARTUP); // set before init() so that you can see startup messages

  mesh.init(MESH_PREFIX, MESH_PASSWORD, &userScheduler, MESH_PORT);
  mesh.onReceive(&receivedCallback);
  mesh.onNewConnection(&newConnectionCallback);
  mesh.onChangedConnections(&changedConnectionCallback);
  mesh.onNodeTimeAdjusted(&nodeTimeAdjustedCallback);

  userScheduler.addTask(taskSendMessage);
  userScheduler.addTask(taskExecuteCommand);

  taskSendMessage.enable();
  taskExecuteCommand.enable();
}

void loop()
{
  // it will run the user scheduler as well
  mesh.update();
  if (interruptFlag)
  {
    encoder_position = ss.getEncoderPosition();
    int switch_pressed = ss.digitalRead(SS_SWITCH);
    
    interruptFlag = false; // Reset the flag
    Serial.printf("%d, %u\n", encoder_position, switch_pressed);
    select(encoder_position - origin_position);
    if (switch_pressed == 0) {
      if (choosed == -1) {
        updateDisplay(String("Choose an option"), 2);
      } else {
        submitAnswer(choosed + 1);
      }
    }
  }
}

void onTap()
{
  interruptFlag = true; // Set the flag
  Serial.printf("tapped");
}
