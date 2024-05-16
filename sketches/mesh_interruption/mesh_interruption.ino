//************************************************************
// this is a simple example that uses the painlessMesh library
//
// 1. sends a silly message to every node on the mesh at a random time between 1 and 5 seconds
// 2. prints anything it receives to Serial.print
//
//
//************************************************************
#include "painlessMesh.h"
#include "Adafruit_seesaw.h"
#include <seesaw_neopixel.h>

// Set up encoder
#define SS_SWITCH        24
#define SS_NEOPIX        6
#define SEESAW_ADDR      0x36

#define   MESH_PREFIX     "whateverYouLike"
#define   MESH_PASSWORD   "somethingSneaky"
#define   MESH_PORT       5555

Scheduler userScheduler; // to control your personal task
painlessMesh  mesh;

Adafruit_seesaw ss;
seesaw_NeoPixel sspixel = seesaw_NeoPixel(1, SS_NEOPIX, NEO_GRB + NEO_KHZ800);
int32_t encoder_position;
bool prev_button = 0;

const byte ledPin = LED_BUILTIN;
const byte interruptPin = D3;
const byte fakeGroundPin = D6;
volatile byte state = LOW;
volatile bool interruptFlag = false;

// User stub
void sendMessage() ; // Prototype so PlatformIO doesn't complain

Task taskSendMessage( TASK_SECOND * 1 , TASK_FOREVER, &sendMessage );

void sendMessage() {
  String msg = "Hello from node ";
  msg += mesh.getNodeId();
  mesh.sendBroadcast( msg );
  taskSendMessage.setInterval( random( TASK_SECOND * 1, TASK_SECOND * 5 ));
}

// Needed for painless library
void receivedCallback( uint32_t from, String &msg ) {
  Serial.printf("startHere: Received from %u msg=%s\n", from, msg.c_str());
}

void newConnectionCallback(uint32_t nodeId) {
    Serial.printf("--> startHere: New Connection, nodeId = %u\n", nodeId);
}

void changedConnectionCallback() {
  Serial.printf("Changed connections\n");
}

void nodeTimeAdjustedCallback(int32_t offset) {
    Serial.printf("Adjusted time %u. Offset = %d\n", mesh.getNodeTime(),offset);
}

void setup_seesaw() {
  pinMode(fakeGroundPin, INPUT);
  pinMode(interruptPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(interruptPin), blink, FALLING);
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

void setup() {
  Serial.begin(115200);
  setup_seesaw();

//mesh.setDebugMsgTypes( ERROR | MESH_STATUS | CONNECTION | SYNC | COMMUNICATION | GENERAL | MSG_TYPES | REMOTE ); // all types on
  mesh.setDebugMsgTypes( ERROR | STARTUP );  // set before init() so that you can see startup messages

  mesh.init( MESH_PREFIX, MESH_PASSWORD, &userScheduler, MESH_PORT );
  mesh.onReceive(&receivedCallback);
  mesh.onNewConnection(&newConnectionCallback);
  mesh.onChangedConnections(&changedConnectionCallback);
  mesh.onNodeTimeAdjusted(&nodeTimeAdjustedCallback);

  userScheduler.addTask( taskSendMessage );
  taskSendMessage.enable();
}

void loop() {
  // it will run the user scheduler as well
  mesh.update();
  if (interruptFlag) {
    encoder_position = ss.getEncoderPosition();
    int switch_pressed = ss.digitalRead(SS_SWITCH);
    String msg = encoder_position > 4 ? "a" : "b";
    msg += mesh.getNodeId();
    mesh.sendBroadcast( msg );
    interruptFlag = false; // Reset the flag
    Serial.printf("%d, %u\n", encoder_position, switch_pressed);
  }
}

void blink() {
  interruptFlag = true; // Set the flag
  Serial.printf("hi");

}
