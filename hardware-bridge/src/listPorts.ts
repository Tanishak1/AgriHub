import { SerialPort } from 'serialport';

SerialPort.list()
  .then((ports) => {
    if (ports.length === 0) {
      console.log('No serial ports detected. Connect the ESP32 and try again.');
      return;
    }
    for (const port of ports) {
      console.log(`${port.path}${port.manufacturer ? ` - ${port.manufacturer}` : ''}${port.serialNumber ? ` (${port.serialNumber})` : ''}`);
    }
  })
  .catch((error) => {
    console.error(`Unable to list serial ports: ${error.message}`);
    process.exitCode = 1;
  });