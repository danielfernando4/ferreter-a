import socket, time
time.sleep(2)
s = socket.socket()
r = s.connect_ex(('127.0.0.1', 12622))
print('12622: ' + ('open' if r == 0 else 'closed'))
s.close()
