#include "command.hpp"

#define SPERATOR ':' 

CommandAndParams::CommandAndParams(String rawCommand)
  : commandUsable(false),
    paramCount(0) {
  // Trim whitespace in place.
  rawCommand.trim();

  // Check that the command was more than just whitespace.
  if (rawCommand.length() == 0) return;

  // At least a command is available, maybe parameters are not.
  commandUsable = true;

  int spaceA = rawCommand.indexOf(SPERATOR);
  int spaceB = -1;

  // .indexOf returns -1 if character is not found.
  if (spaceA == -1) {
    command = rawCommand;
    return;  // Return early, no parameters to be parsed.
  } else {
    command = rawCommand.substring(0, spaceA);
  }

  for (unsigned int i = 0; i < MAX_PARAMS; i++) {
    do {
      spaceA++;
      spaceB = rawCommand.indexOf(SPERATOR, spaceA);
    } while (spaceA == spaceB);

    if (spaceB == -1) {
      params[i] = rawCommand.substring(spaceA);

      // EOL reached.
      paramCount = i + 1;
      break;
    } else {
      params[i] = rawCommand.substring(spaceA, spaceB);
      spaceA = spaceB;
    }
  }
}

void CommandAndParams::print() {
  Serial.print(F("command:  >>"));
  Serial.print(command);
  Serial.println(F("<<"));

  for (int i = 0; i < paramCount; i++) {
    Serial.print(F("param["));
    Serial.print(i);
    Serial.print(F("]: >>"));
    Serial.print(params[i]);
    Serial.println(F("<<"));
  }
}
