
connecting raspberry pi pico w to vscode

use the MicroPico vscode extension

if using WSL2, you'll need to grant access to the usbdevice

in powershell run

usbipd list

to see all devices

PS C:\Users\ryanw> usbipd list
Connected:
BUSID  VID:PID    DEVICE                                                        STATE
2-3    046d:c548  Logitech USB Input Device, USB Input Device                   Not shared
2-5    2e8a:0005  USB Serial Device (COM20)                                     Attached
2-9    27c6:609c  Framework Fingerprint Reader                                  Not shared
2-10   8087:0032  Intel(R) Wireless Bluetooth(R)                                Not shared

Persisted:
GUID                                  DEVICE

In the example above, the RP2040 has BUSID 2-5
if you aren't sure, disconnect the device and see which one dissapears

to attach it to wsl2, we must first "bind" then "attach

usbipd bind --busid 2-5

after this the device state will be seen as "shared"

* it might not work if you are using the wireshark plugin "USBPCAP" in which case just add --force flag to command

usbipd attach --wsl --busid 2-5

now the device will show as "attached" state as in the output above

Ok, so now we have the device shared with WSL2, but it still might not work in VSCode

you might see it consistantly trying to attach and disconnect from a /dev/ttyACM0 (seems to be default name)

this is most probably because your vscode process doesn't have permission to access the device
when you opened vscode, you likely did it as your user, without using sudo (which is correct as you shouldn't need to open vscode with sudo) but your user may not have permission to access the device

the solution is to either change ownership of the device, or to add your user to the group that has access to the device

let's take a look at the permission of the device

la /dev/ttyACM0

[I] ~/repo/mars ❯ la /dev/ttyACM0                        (base)  main ◼
crw------- 1 root root 166, 0 Mar 23 01:08 /dev/ttyACM0

So my device is owned by root user and root group, but only the user has access

this means my permission were 600

ideally the permission would be something like this

[I] ~/repo/mars ❯ la /dev/ttyACM0                        (base)  main ◼
crw-rw---- 1 root dialout 166, 0 Mar 23 01:08 /dev/ttyACM0

where the gruop also has access and the device is owned by group dialout

now everything will work if your user is a part of the group dialout which you can do by the following

sudo usermod -a -G dialout $USER

but if your permissions weren't as above, you may need to do the following

sudo chgrp dialout /dev/ttyACM0 # set owner group to dialout
sudo chmod 660 /dev/ttyACM0 # enable group and user to read and write

now the extension should be able to connect correctly

hopefully everything was working and you didn't have to go through all this

next step is to set up the project, there is a command for this

"MicroPico: Configure Project"

Which will just set up some useful files in the project

