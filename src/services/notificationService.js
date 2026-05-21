import { Expo } from 'expo-server-sdk'
import User from '../models/User.js'

const expo = new Expo()

export async function sendPush(userId, { title, body, data }) {
  const user = await User.findById(userId).select('expoPushToken notifPrefs')
  if (!user?.expoPushToken) return
  if (!Expo.isExpoPushToken(user.expoPushToken)) return
  if (user.notifPrefs?.[data.type] === false) return
  await expo.sendPushNotificationsAsync([{
    to: user.expoPushToken,
    title,
    body,
    data,
    sound: 'default',
  }])
}
