import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

import MessagesScreen from '../messaging'

const Chat = () => {
  return (
    <View className='flex-1'>
  
      <MessagesScreen/>
    </View>
  )
}

export default Chat

const styles = StyleSheet.create({})