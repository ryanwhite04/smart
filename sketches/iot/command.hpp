
#ifndef __COMMANDANDPARAMS_H__
#define __COMMANDANDPARAMS_H__

#include <Arduino.h>

/**
 * \class CommandAndParams
 * \brief Simple container to parse a command and parameters out of a String.
 */
struct CommandAndParams {
  String command;      //!< The command to be performed.
  bool commandUsable;  //!< Was a command available in the input string?

  enum { MAX_PARAMS = 8 };

  String params[MAX_PARAMS];  //!< Up to MAX_PARAMS parsed parameters are stored here.
  uint8_t paramCount;         //!< Number of parameters actually parsed.

  Stream& serialOut;  //!< Debug output is printed here.

  /**
     * Ctor.
     * 
     * \param rawCommand  A raw string to parse for a command and parameters.
     */
  CommandAndParams(String rawCommand, Stream& serialOut);

  /**
     * Prints the parsed command and params.
     * Uses #serialOut as its target.
     */
  void print();
};

#endif  // __COMMANDANDPARAMS_H__