```mermaid
block-beta
columns 5
    hub["Hub Device"]
    space
    near["Student Device (near)"]
    space
    far["Student Device (far)"]
    space:10
    laptop["Classroom Dashboard"]
    space
    database["Database"]
    space
    admin["Analytics Dashboard"]
    space:5

    far --> near
    near -- "WiFi Mesh network" --> far

    near --> hub
    hub -- "WiFi Mesh network" --> near

    hub --> laptop
    laptop -- "Web Serial over USB" --> hub

    laptop --> database
    database -- "Rest over IP" --> laptop

    database --> admin
    admin -- "Rest over IP" --> database
```

```mermaid
block-beta
columns 6
    client
    space
    computer
    space
    power

    space:7

    encoder
    space
    microcontroller
    space
    light["Neopixel LED"]

    space:7

    display
    space
    antenna
    space
    battery


```
    microcontroller --"1 GPIO"--> slideSwitch1
    microcontroller --"1 GPIO"--> slideSwitch2
    encoder --"I2C"--> neopixelLED
    microcontroller --"I2C"--> encoder
    microcontroller --"I2C"--> display
    microcontroller --"IPEX"--> antenna
    microcontroller --"USBC"--> computer
    microcontroller --> battery