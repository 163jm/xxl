/**
 * 添加到列表 — TV 重设计版
 *
 * 使用 FlatList，遥控器焦点到底部时自动滚动。
 * 无新建列表按钮。
 */
import { useCallback } from 'react'
import { FlatList, View, StyleSheet } from 'react-native'

import { useMyList } from '@/store/list/hook'
import ListItem from './ListItem'
import { sw, sh } from '@/utils/tvScale'

const ITEM_HEIGHT = sh(52)
const ITEM_GAP = sh(8)
const MAX_VISIBLE = 6

export default ({ musicInfo, onPress }: {
  musicInfo: LX.Music.MusicInfo
  onPress: (listInfo: LX.List.MyListInfo) => void
}) => {
  const allList = useMyList()

  const renderItem = useCallback(({ item, index }: { item: LX.List.MyListInfo, index: number }) => (
    <View style={s.itemWrap}>
      <ListItem
        listInfo={item}
        musicInfo={musicInfo}
        onPress={onPress}
        hasTVPreferredFocus={index === 0}
      />
    </View>
  ), [musicInfo, onPress])

  const keyExtractor = useCallback((item: LX.List.MyListInfo) => item.id, [])

  return (
    <FlatList
      data={allList}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={[s.list, { maxHeight: Math.min(allList.length, MAX_VISIBLE) * (ITEM_HEIGHT + ITEM_GAP) + 16 }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      getItemLayout={(_, index) => ({
        length: ITEM_HEIGHT + ITEM_GAP,
        offset: (ITEM_HEIGHT + ITEM_GAP) * index,
        index,
      })}
    />
  )
}

const s = StyleSheet.create({
  list: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: sw(20),
    paddingTop: sh(8),
    paddingBottom: sh(8),
  },
  itemWrap: {
    marginBottom: sh(8),
  },
})
