import socket, time
time.sleep(3)
s = socket.socket()
r = s.connect_ex(('127.0.0.1', 12622))
with open('/app/backend/_port_status.txt', 'w') as f:
    f.write('open' if r == 0 else 'closed')
s.close()
