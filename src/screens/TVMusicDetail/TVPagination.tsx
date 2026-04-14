/**
 * 底部翻页组件  < 1 >
 */
import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import TVButton from '@/components/common/TVButton'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { sw, sh, sf, sr } from '@/utils/tvScale'

interface Props {
  page: number        // 当前页（1-based）
  maxPage: number
  onPrev: () => void
  onNext: () => void
}

export default memo(({ page, maxPage, onPrev, onNext }: Props) => {
  const theme = useTheme()
  const canPrev = page > 1
  const canNext = page < maxPage

  return (
    <View style={styles.root}>
      <TVButton
        style={styles.btn}
        borderRadius={sr(6)}
        onPress={onPrev}
        disabled={!canPrev}
      >
        <Text size={sf(26)} color={canPrev ? theme['c-font'] : theme['c-font-label']}>{'‹'}</Text>
      </TVButton>

      <Text style={styles.pageText} size={sf(20)} color={theme['c-font']}>
        {page}
      </Text>

      <TVButton
        style={styles.btn}
        borderRadius={sr(6)}
        onPress={onNext}
        disabled={!canNext}
      >
        <Text size={sf(26)} color={canNext ? theme['c-font'] : theme['c-font-label']}>{'›'}</Text>
      </TVButton>
    </View>
  )
})

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: sh(14),
    gap: sw(24),
    flexShrink: 0,
  },
  btn: {
    paddingHorizontal: sw(28),
    paddingVertical: sh(12),
    borderRadius: sr(6),
    minWidth: sw(60),
    alignItems: 'center',
  },
  pageText: {
    minWidth: sw(40),
    textAlign: 'center',
  },
})
