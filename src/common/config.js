// object version
export const config = {
  webroot: process.env.NODE_ENV === 'production'
    ? 'https://haydint.com' // prod applist
    : 'http://10.10.8.156', // your dev applist
  appName: 'Screens',
  appVersion: '2026.0819.1',
  groups: ['HR Comms System', 'HR Comms HR', 'HR Comms Supervisors'],
  supportEmail: 'hr@haydenindustrial.com',
  api: '/ttprod/v3/hrcomms/api/',
}

