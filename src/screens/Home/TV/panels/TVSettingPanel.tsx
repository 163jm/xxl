import { memo, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import TVButton, { type TVButtonType } from '@/components/common/TVButton'
import Text from '@/components/common/Text'
import Main, { SETTING_SCREENS, type SettingScreenIds, type MainType } from '@/screens/Home/Views/Setting/Main'
import { useI18n } from '@/lang'
import { setFocusZone } from '../index'
import { sw, sh, sf, sr } from '@/utils/tvScale'

export interface TVSettingPanelType {
  focusTopBar: () => void
}

export default memo(forwardRef<TVSettingPanelType>((_, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const mainRef = useRef<MainType>(null)
  const firstTabRef = useRef<TVButtonType>(null)

  const [activeId, setActiveId] = useState<SettingScreenIds>(
    global.lx.settingActiveId as SettingScreenIds ?? 'basic'
  )
  const [focusTabId, setFocusTabId] = useState<SettingScreenIds>(
    global.lx.settingActiveId as SettingScreenIds ?? 'basic'
  )

  useImperativeHandle(ref, () => ({
    focusTopBar() {
      firstTabRef.current?.requestFocus()
    },
  }))

  const handleSelect = (id: SettingScreenIds) => {
    setActiveId(id)
    setFocusTabId(id)
    global.lx.settingActiveId = id
    mainRef.current?.setActiveId(id)
  }

  return (
    <View style={s.root}>
      <View style={[s.tabBar, { borderBottomColor: theme['c-border-background'] }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabScroll}>
          {SETTING_SCREENS.map((id, i) => {
            const active = id === activeId
            return (
              <TVButton
                key={id}
                ref={i === 0 ? firstTabRef : undefined}
                style={[s.tab, active && { borderBottomColor: theme['c-primary'] }]}
                onPress={() => handleSelect(id)}
                onFocus={() => setFocusZone('topbar')}
                hasTVPreferredFocus={id === focusTabId}
              >
                <Text size={sf(20)} color={active ? theme['c-primary'] : undefined}>
                  {t(`setting_${id}`)}
                </Text>
              </TVButton>
            )
          })}
        </ScrollView>
      </View>

      <ScrollView style={s.content} keyboardShouldPersistTaps="always">
        <View style={s.contentInner}>
          <Main ref={mainRef} />
        </View>
      </ScrollView>
    </View>
  )
}))

const s = StyleSheet.create({
  root: { flex: 1 },
  tabBar: { borderBottomWidth: StyleSheet.hairlineWidth, flexShrink: 0 },
  tabScroll: {
    flexDirection: 'row',
    paddingHorizontal: sw(8),
    paddingVertical: sh(6),
    gap: sw(4),
    alignItems: 'center',
  },
  tab: {
    paddingVertical: sh(8),
    paddingHorizontal: sw(16),
    borderRadius: sr(8),
    borderBottomWidth: sh(3),
    borderBottomColor: 'transparent',
  },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: sw(20), paddingVertical: sh(15) },
})
