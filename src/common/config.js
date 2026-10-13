// object version
export const config = {
  webroot: process.env.NODE_ENV === 'production'
    ? window.location.origin // prod applist
    : 'http://10.10.8.156', // your dev applist
  appName: 'Screens',
  appVersion: '2026.1013.1 Beta',
  groups: ['Screens System', 'Screens HR', 'Screens Supervisors'],
  supportEmail: 'hr@haydenindustrial.com',
  api: '/ttprod/v3/hrcomms/api/',
}

