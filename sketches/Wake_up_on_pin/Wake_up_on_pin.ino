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

void setup() {
  Serial.begin(115200);
  delay(3000); // Increase delay to ensure enough time to open the Serial Monitor

  Serial.println("Setup start");

  // Increment boot number and print it every reboot
  ++bootCount;
  Serial.println("Boot number: " + String(bootCount));

  // Print the wakeup reason for ESP32
  print_wakeup_reason();

  // Set the pin mode with internal pull-up
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.println("Pin mode set to INPUT_PULLUP");

  // Check the pin state before going to sleep
  if (digitalRead(BUTTON_PIN) == LOW) {
    Serial.println("Pin is LOW, device will go to sleep");

    // Configure the wake-up source
    esp_sleep_enable_ext0_wakeup(BUTTON_PIN, 1); // 0 = Low
    Serial.println("Wake-up source configured");

    // Go to sleep now
    Serial.println("Going to sleep now");
    esp_deep_sleep_start();
  } else {
    Serial.println("Pin is HIGH, device will not sleep");
  }

  Serial.println("Setup complete");
}

void loop() {
  // Continuously check the pin state and put the device to sleep when it goes LOW
  if (digitalRead(BUTTON_PIN) == LOW) {
    Serial.println("Pin is LOW, device will go to sleep");

    // Configure the wake-up source
    esp_sleep_enable_ext0_wakeup(BUTTON_PIN, 1); // 0 = Low
    Serial.println("Wake-up source configured");

    // Go to sleep now
    Serial.println("Going to sleep now");
    esp_deep_sleep_start();
  } else {
    Serial.println("Pin is HIGH, device remains awake");
    delay(1000); // Check every second
  }
}