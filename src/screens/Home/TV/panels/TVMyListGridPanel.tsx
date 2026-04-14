/**
 * TV 我的列表面板（Grid 方块版）
 * 顶部：固定"我的列表"标题
 * 内容：列表方块 Grid（一行5个）
 */
import { memo, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { View, StyleSheet, FlatList, Modal } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useMyList } from '@/store/list/hook'
import TVButton, { type TVButtonType } from '@/components/common/TVButton'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { LIST_IDS } from '@/config/constant'
import musicSdk from '@/utils/musicSdk'
import listState from '@/store/list/state'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { handleRemove, handleSync } from '@/screens/Home/Views/Mylist/MyList/listAction'
import ListNameEdit, { type ListNameEditType } from '@/screens/Home/Views/Mylist/MyList/ListNameEdit'
import ListMusicSort, { type ListMusicSortType } from '@/screens/Home/Views/Mylist/MyList/ListMusicSort'
import DuplicateMusic, { type DuplicateMusicType } from '@/screens/Home/Views/Mylist/MyList/DuplicateMusic'
import ListImportExport, { type ListImportExportType } from '@/screens/Home/Views/Mylist/MyList/ListImportExport'
import { useI18n } from '@/lang'
import { setFocusZone } from '../index'
import { sw, sh, sf, sr } from '@/utils/tvScale'

const NUM_COLUMNS = 5

// ─── 操作弹窗 ────────────────────────────────────────────────────────────────
interface MenuItemDef {
  action: string
  label: string
  disabled?: boolean
  danger?: boolean
}

const ActionDialog = memo(({
  visible,
  menus,
  onAction,
  onClose,
}: {
  visible: boolean
  menus: MenuItemDef[]
  onAction: (action: string) => void
  onClose: () => void
}) => {
  const theme = useTheme()
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={d.overlay}>
        <View style={[d.card, { backgroundColor: theme['c-content-background'] }]}>
          <FlatList
            data={menus}
            keyExtractor={item => item.action}
            style={d.list}
            contentContainerStyle={d.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View style={d.itemWrap}>
                <TVButton
                  hasTVPreferredFocus={index === 0}
                  borderRadius={6}
                  disabled={item.disabled}
                  style={[d.actionBtn, { backgroundColor: theme['c-button-background'] }]}
                  onPress={() => onAction(item.action)}
                >
                  <Text size={sf(15)}
                    color={item.disabled ? theme['c-font-label'] : item.danger ? theme['c-primary'] : theme['c-button-font']}>
                    {item.label}
                  </Text>
                </TVButton>
              </View>
            )}
          />
          <View style={[d.divider, { backgroundColor: theme['c-border-background'] }]} />
          <View style={d.cancelRow}>
            <TVButton borderRadius={sr(6)}
              style={[d.cancelBtn, { backgroundColor: theme['c-button-background'] }]}
              onPress={onClose}>
              <Text size={sf(14)} color={theme['c-primary']}>取消</Text>
            </TVButton>
          </View>
        </View>
      </View>
    </Modal>
  )
})

const d = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  card: { width: sw(260), maxHeight: sh(520), borderRadius: sr(12), overflow: 'hidden', elevation: 10 },
  list: { flexGrow: 0 },
  listContent: { paddingHorizontal: sw(14), paddingTop: sh(14), paddingBottom: sh(6) },
  itemWrap: { marginBottom: sh(6) },
  actionBtn: { height: sh(48), justifyContent: 'center', alignItems: 'center', borderRadius: sr(6) },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: sw(14), marginTop: sh(2) },
  cancelRow: { paddingHorizontal: sw(14), paddingTop: sh(10), paddingBottom: sh(14), alignItems: 'flex-end' },
  cancelBtn: { paddingHorizontal: sw(20), paddingVertical: sh(10), minWidth: sw(80), alignItems: 'center', borderRadius: sr(6) },
})

// ─── 对外接口 ────────────────────────────────────────────────────────────────
export interface TVMyListGridPanelType {
  focusTopBar: () => void
  isDialogVisible: () => boolean
  closeDialog: () => void
  restoreFocus: () => void
}

// ─── 主面板 ──────────────────────────────────────────────────────────────────
export default memo(forwardRef<TVMyListGridPanelType>((_, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const allList = useMyList()

  const [actionVisible, setActionVisible] = useState(false)
  const actionVisibleRef = useRef(false)
  const [actionMenus, setActionMenus] = useState<MenuItemDef[]>([])
  const selectedRef = useRef<{ listInfo: LX.List.MyListInfo; index: number } | null>(null)
  const lastDotsBtnRef = useRef<TVButtonType | null>(null)
  const lastFocusedCardRef = useRef<TVButtonType | null>(null)
  // 顶部标题区域的 ref（用于 back 时还焦点）
  const titleAreaRef = useRef<TVButtonType>(null)

  const listNameEditRef = useRef<ListNameEditType>(null)
  const listMusicSortRef = useRef<ListMusicSortType>(null)
  const duplicateMusicRef = useRef<DuplicateMusicType>(null)
  const listImportExportRef = useRef<ListImportExportType>(null)

  useImperativeHandle(ref, () => ({
    focusTopBar() {
      titleAreaRef.current?.requestFocus()
    },
    isDialogVisible() {
      return actionVisibleRef.current
    },
    closeDialog() {
      setActionVisible(false)
      actionVisibleRef.current = false
      requestAnimationFrame(() => { lastDotsBtnRef.current?.requestFocus() })
    },
    restoreFocus() {
      if (lastFocusedCardRef.current) {
        lastFocusedCardRef.current.requestFocus()
      } else {
        titleAreaRef.current?.requestFocus()
      }
    },
  }))

  const buildMenus = useCallback((listInfo: LX.List.MyListInfo): MenuItemDef[] => {
    let rename = false
    let remove = false
    let sync = false
    const localFile = !listState.fetchingListStatus[listInfo.id]
    switch (listInfo.id) {
      case LIST_IDS.DEFAULT:
      case LIST_IDS.LOVE:
        break
      default: {
        const userList = listInfo as LX.List.UserListInfo
        rename = true
        remove = true
        sync = !!(userList.source && musicSdk[userList.source as keyof typeof musicSdk]?.songList)
        break
      }
    }
    return [
      { action: 'new',            label: t('list_create') },
      { action: 'rename',         label: t('list_rename'),            disabled: !rename },
      { action: 'sort',           label: t('list_sort') },
      { action: 'duplicateMusic', label: t('lists__duplicate') },
      { action: 'local_file',     label: t('list_select_local_file'), disabled: !localFile },
      { action: 'sync',           label: t('list_sync'),              disabled: !sync || !localFile },
      { action: 'import',         label: t('list_import') },
      { action: 'export',         label: t('list_export') },
      { action: 'remove',         label: t('list_remove'),            disabled: !remove, danger: true },
    ]
  }, [t])

  const handleShowDots = useCallback((
    listInfo: LX.List.MyListInfo,
    index: number,
    btnRef: TVButtonType,
  ) => {
    selectedRef.current = { listInfo, index }
    lastDotsBtnRef.current = btnRef
    setActionMenus(buildMenus(listInfo))
    setActionVisible(true)
    actionVisibleRef.current = true
  }, [buildMenus])

  const closeAction = useCallback(() => {
    setActionVisible(false)
    actionVisibleRef.current = false
    requestAnimationFrame(() => { lastDotsBtnRef.current?.requestFocus() })
  }, [])

  const handleAction = useCallback((action: string) => {
    setActionVisible(false)
    actionVisibleRef.current = false
    const sel = selectedRef.current
    if (!sel) return
    const { listInfo, index } = sel
    switch (action) {
      case 'new': listNameEditRef.current?.showCreate(Math.max(index - 1, 0)); break
      case 'rename': listNameEditRef.current?.show(listInfo as LX.List.UserListInfo); break
      case 'sort': listMusicSortRef.current?.show(listInfo); break
      case 'duplicateMusic': duplicateMusicRef.current?.show(listInfo); break
      case 'import': listImportExportRef.current?.import(listInfo, index); break
      case 'export': listImportExportRef.current?.export(listInfo, index); break
      case 'local_file': listImportExportRef.current?.selectFile(listInfo, index); break
      case 'sync': handleSync(listInfo as LX.List.UserListInfo); break
      case 'remove': handleRemove(listInfo as LX.List.UserListInfo); break
    }
  }, [])

  const handleOpenList = useCallback((listInfo: LX.List.MyListInfo, btnRef: TVButtonType) => {
    if (!commonState.componentIds.home) return
    lastFocusedCardRef.current = btnRef
    navigations.pushTVMusicDetailScreen(commonState.componentIds.home, {
      type: 'mylist',
      id: listInfo.id,
      name: listInfo.name,
    })
  }, [])

  const paddedList: Array<LX.List.MyListInfo | null> = [...allList]
  const remainder = paddedList.length % NUM_COLUMNS
  if (remainder > 0) {
    for (let i = 0; i < NUM_COLUMNS - remainder; i++) paddedList.push(null)
  }

  return (
    <View style={s.root}>
      {/* 顶部标题栏 — 用一个隐形 TVButton 作为焦点锚点 */}
      <View style={[s.topBar, { borderBottomColor: theme['c-border-background'] }]}>
        <TVButton ref={titleAreaRef} style={s.titleBtn} borderRadius={sr(6)} onPress={() => {}} onFocus={() => setFocusZone('topbar')}>
          <Text size={sf(20)} color={theme['c-font']} style={s.topTitle}>{t('nav_love')}</Text>
        </TVButton>
      </View>

      {/* 方块 Grid */}
      <FlatList
        key={NUM_COLUMNS}
        data={paddedList}
        numColumns={NUM_COLUMNS}
        keyExtractor={(item, index) => item?.id ?? `pad_${index}`}
        contentContainerStyle={s.gridContent}
        renderItem={({ item, index }) => {
          if (!item) return <View style={s.cardWrap} />
          return (
            <CardItem
              listInfo={item}
              index={index}
              theme={theme}
              onOpen={handleOpenList}
              onShowDots={handleShowDots}
            />
          )
        }}
      />

      <ActionDialog
        visible={actionVisible}
        menus={actionMenus}
        onAction={handleAction}
        onClose={closeAction}
      />

      <ListNameEdit ref={listNameEditRef} />
      <ListMusicSort ref={listMusicSortRef} />
      <DuplicateMusic ref={duplicateMusicRef} />
      <ListImportExport ref={listImportExportRef} />
    </View>
  )
}))

// ─── 单个方块卡片 ─────────────────────────────────────────────────────────────
const CardItem = memo(({
  listInfo,
  index,
  theme,
  onOpen,
  onShowDots,
}: {
  listInfo: LX.List.MyListInfo
  index: number
  theme: any
  onOpen: (listInfo: LX.List.MyListInfo, btn: TVButtonType) => void
  onShowDots: (listInfo: LX.List.MyListInfo, index: number, btn: TVButtonType) => void
}) => {
  const dotsBtnRef = useRef<TVButtonType>(null)
  const cardBtnRef = useRef<TVButtonType>(null)
  return (
    <View style={s.cardWrap}>
      <TVButton
        ref={cardBtnRef}
        style={[s.card, { backgroundColor: theme['c-primary-background'] }]}
        borderRadius={sr(8)}
        onPress={() => { if (cardBtnRef.current) onOpen(listInfo, cardBtnRef.current) }}
        onFocus={() => setFocusZone('content')}
      >
        <Text size={sf(14)} color={theme['c-primary']} style={s.cardLabel}>列表</Text>
      </TVButton>
      <View style={s.cardBottom}>
        <Text style={s.cardName} size={sf(12)} color={theme['c-font']} numberOfLines={2}>
          {listInfo.name}
        </Text>
        <TVButton
          ref={dotsBtnRef}
          style={s.dotsBtn}
          borderRadius={sr(6)}
          onPress={() => { if (dotsBtnRef.current) onShowDots(listInfo, index, dotsBtnRef.current) }}
          onFocus={() => setFocusZone('content')}
        >
          <Icon name="dots-vertical" size={sf(16)} color={theme['c-font-label']} />
        </TVButton>
      </View>
    </View>
  )
})

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: { paddingHorizontal: sw(16), paddingVertical: sh(4), borderBottomWidth: StyleSheet.hairlineWidth, flexShrink: 0 },
  titleBtn: { alignSelf: 'flex-start', paddingHorizontal: sw(8), paddingVertical: sh(8), borderRadius: sr(6) },
  topTitle: { fontWeight: '600' },
  gridContent: { paddingHorizontal: sw(16), paddingTop: sh(16), paddingBottom: sh(24) },
  cardWrap: { flex: 1, alignItems: 'center', paddingHorizontal: sw(8), paddingBottom: sh(20) },
  card: { width: '100%', aspectRatio: 1.2, borderRadius: sr(8), justifyContent: 'center', alignItems: 'center' },
  cardLabel: { fontWeight: '500' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', marginTop: sh(6), width: '100%' },
  cardName: { flex: 1, lineHeight: sh(18) },
  dotsBtn: { paddingHorizontal: sw(6), paddingVertical: sh(4), borderRadius: sr(6), flexShrink: 0 },
})
