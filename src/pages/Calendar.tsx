import React from 'react';
import { View } from 'react-native';
import { Txt } from '@/components/ui';

export function Calendar() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 26 }}>
      <Txt size={44}>Calendar</Txt>
    </View>
  );
}
