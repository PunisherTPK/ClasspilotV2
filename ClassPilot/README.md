# ClassPilot

ClassPilot is a mobile teaching ledger for institutes, classes, students, enrolments, lesson sessions, attendance, and monthly reports. It is built for Expo SDK 57 and Expo Router, and saves its records on the device.

## Start the app

```sh
npm install
npx expo install --fix
npx expo start
```

Open the QR code in Expo Go. This project targets SDK 57. Expo Go can test Android biometrics and Touch ID; iOS Face ID requires a development build.

The app starts with sample records so the screens have useful content. Changes are stored on the device with AsyncStorage. They do not sync to an account or cloud database. Sample data is added only when a table is empty.
