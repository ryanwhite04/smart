#include <Preferences.h>
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
String mesh_prefix;
String mesh_password;
#define MESH_PORT 5555
painlessMesh mesh;

Scheduler userScheduler; // to control your personal task

Preferences preferences; // Preferences object for NVS

String name;

int options = -1;
int chosen = -1;
int submitted = -1;
int origin_position = 0;
Task* task;
// C3 has no buildin led
// const byte ledPin = LED_BUILTIN;

bool mock = false;

// below code is for enabling hibernation
// D1 must be pulled high to keep device awake
// pulling it low will cause it to sleep
#define BUTTON_PIN GPIO_NUM_2 // GPIO 2 (D1)
#define BUTTON_PIN_BITMASK (1ULL << BUTTON_PIN)

RTC_DATA_ATTR int bootCount = 0;

void print_wakeup_reason() {
  esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();

  switch (wakeup_reason) {
    case ESP_SLEEP_WAKEUP_EXT0: Serial.println("Wakeup caused by external signal using RTC_IO"); break;
    case ESP_SLEEP_WAKEUP_EXT1: Serial.println("Wakeup caused by external signal using RTC_CNTL"); break;
    case ESP_SLEEP_WAKEUP_TIMER: Serial.println("Wakeup caused by timer"); break;
    case ESP_SLEEP_WAKEUP_TOUCHPAD: Serial.println("Wakeup caused by touchpad"); break;
    case ESP_SLEEP_WAKEUP_ULP: Serial.println("Wakeup caused by ULP program"); break;
    default: Serial.printf("Wakeup was not caused by deep sleep: %d\n", wakeup_reason); break;
  }
}

// This ensures all broadcasts address the node sending the broadcast too
void broadcast(String message)
{
  mesh.sendBroadcast(message, true);
}

// This function updates the display with a new message on a specific line
void updateDisplay(String message, int line)
{
  if (mock) {
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

// This function saves the current settings to the NVS
void saveSettings() {
  preferences.begin("smart", false); // Open NVS namespace
  preferences.putString("name", name); // Save the name
  preferences.putString("mesh_prefix", mesh_prefix); // Save the mesh prefix
  preferences.putString("mesh_password", mesh_password); // Save the mesh password
  preferences.end(); // Close NVS namespace
}

// This function loads the settings from the NVS
void loadSettings() {
  preferences.begin("smart", true); // Open NVS namespace in read-only mode
  name = preferences.getString("name", "Anonymous"); // Retrieve the name, with "default-name" as fallback
  mesh_prefix = preferences.getString("mesh_prefix", "prefix"); // Retrieve the mesh prefix, with "defaultPrefix" as fallback
  mesh_password = preferences.getString("mesh_password", "password"); // Retrieve the mesh password, with "defaultPassword" as fallback
  preferences.end(); // Close NVS namespace
}

// This function parses the command and parameters from a raw string
void executeCommand();
Task taskExecuteCommand(TASK_SECOND * 0.1, TASK_FOREVER, &executeCommand);
void executeCommand()
{
  String command;
  while (Serial.available())
  {
    command = Serial.readString();
    CommandAndParams cp(command);
    if (cp.command == "id")
    {
      Serial.printf("id:%u\n", mesh.getNodeId());
    }
    else if (cp.command == "m")
    {
      if (cp.paramCount == 2)
      {
        if (mesh_prefix != cp.params[0]) {
          mesh_prefix = cp.params[0];
          mesh_password = cp.params[1];
          saveSettings();
          mesh.stop();
          setup_mesh(); // Restart the mesh network with new settings
        }
        Serial.println(command);
      }
    }
    else
    {
      Serial.println(command);
      broadcast(command);
    }
  }
  taskExecuteCommand.setInterval(random(0, TASK_SECOND * 0.1));
}

// This function power switch is pulled low to put the device to sleep
void check_sleep();
Task taskCheckSleep(TASK_SECOND * 1, TASK_FOREVER, &check_sleep);
void check_sleep() {
  if (mock) return;
  if (digitalRead(BUTTON_PIN) == LOW) {
    Serial.println("Pin is LOW, device will go to sleep");

    // Configure the wake-up source
    esp_sleep_enable_ext0_wakeup(BUTTON_PIN, 1); // 0 = Low
    Serial.println("Wake-up source configured");

    // Go to sleep now
    Serial.println("Going to sleep now");
    esp_deep_sleep_start();
  }
}

// This function sets the color of the light
// on serial use l:r:g:b
void setLightColor(int r, int g, int b)
{
  if (mock) return;
  uint32_t color = sspixel.Color(r, g, b);
  sspixel.setPixelColor(0, color);
  sspixel.show();
}

// This function sets the number of options
// on serial use o:num
void setOptionsNumber(int num)
{
  if (num <= 1) {
    return;
  }
  options = num;
  chosen = -1;
  submitted = -1;
  if (mock) {
    return;
  }
  origin_position = encoder_position;
  updateDisplay(String(num) + String(" options provided."), 2);
  updateDisplay(name + String(", what's your option?"), 3);
}

// This function selects an option
void select(int num) {
  if (options <= 1) {
    return;
  }
  chosen = num % options;
  if (chosen < 0) {
    chosen += options;
  }
  String res;
  res = String(chosen + 1);
  updateDisplay(String("You chose option ") + res, 3);
}

// on serial use n:<node_id>:<name> to set a devices name
void setName(String newName)
{
  name = newName;
  saveSettings();
  updateDisplay(name, 0);
}

// This function submits an answer
void submitAnswer(int idx)
{
  String s = "a:";
  s += String(idx);
  submitted = idx;
  String res = String(submitted);
  updateDisplay(String("Option ") + res + String(" is submitted"), 6);
  setLightColor(255, 255, 255);

  broadcast(s);
}

// This function submits an answer
void oneTimeTask() {
  long idx = random(0, options - 1);
  submitAnswer(idx);
}

// This function submits a random answer
// this is used for headless devices (mock devices) which operate
// without a display purely for testing purposes to test the maximum
// number of devices that can operate on the network
void submitRandomAnswer() {
  task = new Task(2000, TASK_ONCE, &oneTimeTask);
  userScheduler.addTask(*task);
  task->enable();
}

// Needed for painless library
// This handles the received messages
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
    if (strtoul(cp.params[0].c_str(), nullptr, 10) == mesh.getNodeId()) {
      setName(cp.params[1]);
    }
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

// This function sets up the device to go to sleep
// it sets up the button pin to wake up the device
// when the button is pressed
void setup_sleep()
{
  // Increment boot number and print it every reboot
  ++bootCount;
  Serial.println("Boot number: " + String(bootCount));

  // Print the wakeup reason for ESP32
  print_wakeup_reason();

  // Set the pin mode with internal pull-up
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  // Check the pin state before going to sleep
  if (digitalRead(BUTTON_PIN) == LOW) {
    esp_sleep_enable_ext0_wakeup(BUTTON_PIN, 1); // 0 = Low
    esp_deep_sleep_start();
  }
}

// This function sets up the seesaw
// which is the rotary encoder breakout with the built in neopixel
void setup_seesaw()
{
  pinMode(fakeGroundPin, INPUT);
  pinMode(interruptPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(interruptPin), onTap, FALLING);
  // while (!Serial)
  //   delay(10);

  Serial.println("Looking for seesaw!");

  if (!ss.begin(SEESAW_ADDR) || !sspixel.begin(SEESAW_ADDR))
  {
    Serial.println("Couldn't find seesaw on default address, something is wrong");
    return;
  }

  uint32_t version = ((ss.getVersion() >> 16) & 0xFFFF);
  if (version != 4991)
  {
    Serial.print("Wrong firmware loaded? ");
    Serial.println(version);
    while (1)
      delay(10);
  }

  // Set not so bright!
  sspixel.setBrightness(20);
  sspixel.show();

  // Use a pin for the built-in encoder switch
  ss.pinMode(SS_SWITCH, INPUT_PULLUP);

  // Get starting position
  encoder_position = ss.getEncoderPosition();
  // uint32_t mask = ((uint32_t)1 << SS_SWITCH);
  uint32_t mask = (uint32_t)0x1FFFFFF;
  delay(10);
  // ss.pinModeBulk(mask, INPUT_PULLUP);
  ss.setGPIOInterrupts(mask, 1);
  ss.enableEncoderInterrupt();
}

// This function sets up the display
// which is the PiicoDev OLED display SSD1306
// it initializes the display with the I2C address
// the device must have the toggle on the back set to the "ON"
// position on the back to have the correct address
void setup_display()
{
  // Initialize with the I2C addr 0x3C (for the 128x64)
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS))
  {
    Serial.println("Couldn't find SSD1306, working as Smart Hub");
    return;
  }
  delay(10);
  display.clearDisplay();
  display.setTextSize(1);      // Normal 1:1 pixel scale
  display.setTextColor(SSD1306_WHITE); // Draw white text
  display.setCursor(0, 0);             // Start at top-left corner
  display.display();
  // display.cp437(true);         // Use full 256 char 'Code Page 437' font 
}

// This function sets up the mesh network
// it initializes the mesh network with the prefix and password
// when the password or prefix is changed
// the mesh must first be stopped before calling this again
void setup_mesh() {
  // mesh.setDebugMsgTypes(ERROR | MESH_STATUS | CONNECTION | SYNC | COMMUNICATION | GENERAL | MSG_TYPES | REMOTE);  // all types on
  mesh.setDebugMsgTypes(ERROR); // set before init() so that you can see startup messages

  mesh.init(mesh_prefix.c_str(), mesh_password.c_str(), &userScheduler, MESH_PORT);
  mesh.onReceive(&receivedCallback);
  mesh.onNewConnection(&newConnectionCallback);
  mesh.onChangedConnections(&changedConnectionCallback);
  mesh.onNodeTimeAdjusted(&nodeTimeAdjustedCallback);

  userScheduler.addTask(taskExecuteCommand);
  taskExecuteCommand.enable();
  userScheduler.addTask(taskCheckSleep);
  taskCheckSleep.enable();
  updateDisplay(mesh_prefix.c_str(), 1);
}

// This function sets up the device
// it is the main logic and includes a check for the mock
// which is true if the device is to act without a display or encoder
void setup()
{
  randomSeed(analogRead(0));
  pinMode(D2, INPUT_PULLUP);
  mock = digitalRead(D2);
  Serial.begin(115200);
  delay(100);
  if (!mock) {
    setup_sleep();
    setup_seesaw();
    setup_display();
  }

  loadSettings(); // Load the settings from NVS
  updateDisplay(name, 0);
  setup_mesh();
}

// This function is called when the interrupt is triggered
// this requires that D0 on the microcontroller is wired to the 
// int pin on the rotary encoder breakout board
// this is the reason why the 3D model enclosure no long fits and
// must be adjust
// The interrrupt is required, otherwise putting too much logic
// in the loop that runs on every loop causes the mesh network to fail
void onInterrupt()
{
  encoder_position = ss.getEncoderPosition();
  int switch_pressed = ss.digitalRead(SS_SWITCH);
  
  interruptFlag = false; // Reset the flag
  select(encoder_position - origin_position);
  if (switch_pressed == 0) {
    if (chosen == -1) {
      updateDisplay(String("Choose an option"), 3);
    } else {
      submitAnswer(chosen + 1);
    }
  }
}

// This function is the main loop
// all repetitive tasks such as reading serial input are 
// handled as tasks instead
void loop()
{
  mesh.update();
  if (interruptFlag) onInterrupt();

}

// This function is called when the interrupt is triggered
void onTap()
{
  interruptFlag = true; // Set the flag
}
