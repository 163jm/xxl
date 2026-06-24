import { filterMusicList, toNewMusicInfo } from '@/utils'
import { LIST_IDS, storageDataPrefix, storageDataPrefixOld } from '@/config/constant'
import { getAllKeys, getData, getDataMultiple, removeData, saveData } from '@/plugins/storage'
import { allMusicList, listDataOverwrite, userLists } from '@/utils/listManage'
import { saveListMusics, saveUserList } from '@/utils/data'


interface OldUserListInfo {
  name: string
  id: string
  source?: LX.OnlineSource
  sourceListId?: string
  locationUpdateTime?: number
  list: any[]
}

export const getAllListData = async(): Promise<{
  loveList?: { list: any[] }
  tempList?: { list: any[] }
  userList?: OldUserListInfo[]
}> => {
  const loveListKey = storageDataPrefixOld.list + 'love'
  let loveList
  let userList = []
  const keys = await getAllKeys()
  const listKeys: string[] = []
  for (const key of keys) {
    if (key.startsWith(storageDataPrefixOld.list)) {
      listKeys.push(key)
    }
  }
  const listData = await getDataMultiple(listKeys) as Array<[string, any]>
  for (const [key, value] of listData) {
    switch (key) {
      case loveListKey:
        loveList = value
        break
      default:
        // 跳过 defaultList（试听列表），只保留用户列表
        if (key !== storageDataPrefixOld.list + 'default') {
          userList.push(value)
        }
        break
    }
  }

  const listSort: Record<string, number> = await getData(storageDataPrefixOld.listSort) ?? {}

  userList.sort((a, b) => {
    if (listSort[a.id] == null) return listSort[b.id] == null ? -1 : 1
    return listSort[b.id] == null ? 1 : listSort[a.id] - listSort[b.id]
  })
  userList.forEach((list, index) => {
    if (listSort[list.id] == null) {
      listSort[list.id] = index
      delete list.location
    }
  })

  return {
    loveList,
    userList,
  }
}

/**
 * 迁移 v1.0.0 之前的 list data
 */
export const migrateListData = async() => {
  const playList = await getAllListData()
  const listDataAll: LX.List.ListDataFull = {
    loveList: [],
    userList: [],
    tempList: [],
  }
  if (playList.loveList) listDataAll.loveList = filterMusicList(playList.loveList.list.map(m => toNewMusicInfo(m)))
  if (playList.userList) {
    listDataAll.userList = playList.userList.map(l => {
      return {
        ...l,
        locationUpdateTime: l.locationUpdateTime ?? null,
        list: filterMusicList(l.list.map(m => toNewMusicInfo(m))),
      }
    })
  }
  listDataOverwrite(listDataAll)
  await saveUserList(userLists)
  const allListIds = [LIST_IDS.LOVE, ...userLists.map(l => l.id)]
  await saveListMusics([...allListIds.map(id => ({ id, musics: allMusicList.get(id) as LX.List.ListMusics }))])
  await removeData(storageDataPrefixOld.listSort)

  const listPosition = await getData(storageDataPrefixOld.listPosition)
  if (listPosition != null) {
    await saveData(storageDataPrefix.listScrollPosition, listPosition)
    await removeData(storageDataPrefixOld.listPosition)
  }
}

const timeStr2Intv = (timeStr: string) => {
  const intvArr = timeStr.split(':')
  let intv = 0
  let unit = 1
  while (intvArr.length) {
    intv += parseInt(intvArr.pop()!) * unit
    unit *= 60
  }
  return intv
}
const migratePlayInfo = async() => {
  const playInfo = await getData<any>(storageDataPrefixOld.playInfo)
  if (playInfo == null) return
  if (playInfo.list !== undefined) delete playInfo.list
  if (playInfo.maxTime) playInfo.maxTime = timeStr2Intv(playInfo.maxTime as string)
  await saveData(storageDataPrefix.playInfo, playInfo)
}
/**
 * 迁移 v1.0.0 之前的 meta 数据
 */
export const migrateMetaData = async() => {
  await migratePlayInfo()
}
