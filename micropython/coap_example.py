import microcoapy
# your code to connect to the network
#...
def receivedMessageCallback(packet, sender):
        print('Message received:', packet.toString(), ', from: ', sender)
        print('Message payload: ', packet.payload.decode('unicode_escape'))

client = microcoapy.Coap()
client.responseCallback = receivedMessageCallback
client.start()

_SERVER_IP="192.168.1.2"
_SERVER_PORT=5683
bytesTransferred = client.get(_SERVER_IP, _SERVER_PORT, "current/measure")
print("[GET] Sent bytes: ", bytesTransferred)

client.poll(2000)

client.stop()