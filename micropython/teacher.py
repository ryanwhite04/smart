import network
import usocket as socket

def web_page():
  html = """<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
            <body><h1>Hello World</h1></body></html>
         """
  return html

# if you do not see the network you may have to power cycle
# unplug your pico w for 10 seconds and plug it in again
class AccessPoint:
    """
        Description: This is a function to activate AP mode

        Parameters:

        ssid[str]: The name of your internet connection
        password[str]: Password for your internet connection

        Returns: Nada
    """
    def __init__(self, ssid, password):
        # Just making our internet connection
        self.wlan = network.WLAN(network.AP_IF)
        self.wlan.config(essid=ssid, password=password)
        self.active = True
        
    @property
    def ip(self):
        return self.wlan.ifconfig()[0]
    
    @property
    def active(self):
        return self.wlan.active()
    
    @active.setter
    def active(self, value):
        self.wlan.active(value)

def main():
    ap = AccessPoint('NAME', 'PASSWORD')
    while not ap.active: pass

    print('AP Mode Is Active, You can Now Connect')
    print('IP Address To Connect to:: ' + ap.ip)

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)   #creating socket object
    s.bind(('', 80))
    s.listen(5)

    while True:
        conn, addr = s.accept()
        print('Got a connection from %s' % str(addr))
        request = conn.recv(1024)
        print('Content = %s' % str(request))
        response = web_page()
        conn.send(response)
        conn.close()
        
if __name__ == "__main__": main()