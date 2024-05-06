#include "command.hpp"

CommandAndParams::CommandAndParams(String rawCommand, Stream& serialOut)
  : commandUsable(false),
    paramCount(0),
    serialOut(serialOut) {
  // Trim whitespace in place.
  rawCommand.trim();

  // Check that the command was more than just whitespace.
  if (rawCommand.length() == 0) return;

  // At least a command is available, maybe parameters are not.
  commandUsable = true;

  int spaceA = rawCommand.indexOf(' ');
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
      spaceB = rawCommand.indexOf(' ', spaceA);
    } while (spaceA == spaceB);

    //        serialOut.println(spaceA);
    //        serialOut.println(spaceB);

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
  serialOut.print(F("command:  >>"));
  serialOut.print(command);
  serialOut.println(F("<<"));

  for (int i = 0; i < paramCount; i++) {
    serialOut.print(F("param["));
    serialOut.print(i);
    serialOut.print(F("]: >>"));
    serialOut.print(params[i]);
    serialOut.println(F("<<"));
  }
}
