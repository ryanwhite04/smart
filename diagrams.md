
```mermaid
block-beta
columns 6
    light["Neopixel LED"]
    space
    computer["Client Computer"]
    space
    power["Power Switch"]

    space:7

    encoder["Encoder Breakout with Pushbutton"]
    space
    microcontroller(["Seeed Xiao ESP32 S3"])
    space
    antenna["Antenna"]

    space:7

    display
    space
    antenna
    space
    battery["18650 2600mAh Battery"]

    microcontroller --"I2C"--> encoder
    encoder -- "I2C" --> display
    encoder --> light
    microcontroller --"IPEX"--> antenna
    microcontroller --"USBC"--> computer
    microcontroller --> battery
    microcontroller --> power


```

// class diagram

<!-- ```mermaid
classDiagram
    class Test {
        +string uuid
        +string name
        +Class class
    }
    class Class {
        +string uuid
        +string name
    }
    class Question {
        +string uuid
        +string text
        +List<Option>
        open()
        close()
        submitResponse(option, user)
    }
    class Option {
        +string text
        +bool correct
    }
    class User {
        +string uuid
        +string name
        +bool teacher
    }
    class Device {
        +string uuid
        +bool connected
        read()
        write(message)
        connect()
        disconnect()
    }
    Class "1" *-- "*" User
    User "1" -- "1" Device
    Test "1" *-- "*" Question
    Test "1" *-- "1" Class
    Question "1" o-- "1..*" Option
``` -->

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
