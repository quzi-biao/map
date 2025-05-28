import { openDB, type DBSchema, type IDBPDatabase } from "idb"
import type { KnowledgeMap } from "@/store/use-knowledge-map-store"

// 定义数据库结构
interface KnowledgeMapDB extends DBSchema {
  maps: {
    key: string
    value: KnowledgeMap
    indexes: { "by-name": string }
  }
  settings: {
    key: string
    value: any
  }
}

// 数据库名称和版本
const DB_NAME = "knowledge-map-db"
const DB_VERSION = 1

// 单例模式，确保只有一个数据库连接
let dbPromise: Promise<IDBPDatabase<KnowledgeMapDB>> | null = null

// 初始化数据库
const initDB = async (): Promise<IDBPDatabase<KnowledgeMapDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<KnowledgeMapDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 创建知识地图存储
        const mapStore = db.createObjectStore("maps", { keyPath: "id" })
        mapStore.createIndex("by-name", "name")

        // 创建设置存储
        db.createObjectStore("settings", { keyPath: "id" })
      },
    })
  }
  return dbPromise
}

// 知识地图数据库服务
export const dbService = {
  // 获取所有知识地图
  async getAllMaps(): Promise<KnowledgeMap[]> {
    try {
      const db = await initDB()
      return await db.getAll("maps")
    } catch (error) {
      console.error("获取知识地图失败:", error)
      return []
    }
  },

  // 获取单个知识地图
  async getMap(id: string): Promise<KnowledgeMap | undefined> {
    try {
      const db = await initDB()
      return await db.get("maps", id)
    } catch (error) {
      console.error(`获取知识地图 ${id} 失败:`, error)
      return undefined
    }
  },

  // 保存知识地图
  async saveMap(map: KnowledgeMap): Promise<void> {
    try {
      const db = await initDB()
      await db.put("maps", map)
    } catch (error) {
      console.error("保存知识地图失败:", error)
      throw new Error("保存知识地图失败")
    }
  },

  // 批量保存知识地图
  async saveMaps(maps: KnowledgeMap[]): Promise<void> {
    try {
      const db = await initDB()
      const tx = db.transaction("maps", "readwrite")
      await Promise.all([...maps.map((map) => tx.store.put(map)), tx.done])
    } catch (error) {
      console.error("批量保存知识地图失败:", error)
      throw new Error("批量保存知识地图失败")
    }
  },

  // 删除知识地图
  async deleteMap(id: string): Promise<void> {
    try {
      const db = await initDB()
      await db.delete("maps", id)
    } catch (error) {
      console.error(`删除知识地图 ${id} 失败:`, error)
      throw new Error("删除知识地图失败")
    }
  },

  // 保存设置
  async saveSetting(id: string, value: any): Promise<void> {
    try {
      const db = await initDB()
      await db.put("settings", { id, value })
    } catch (error) {
      console.error("保存设置失败:", error)
      throw new Error("保存设置失败")
    }
  },

  // 获取设置
  async getSetting(id: string): Promise<any> {
    try {
      const db = await initDB()
      const result = await db.get("settings", id)
      return result?.value
    } catch (error) {
      console.error(`获取设置 ${id} 失败:`, error)
      return null
    }
  },

  // 保存活动地图ID
  async saveActiveMapId(id: string): Promise<void> {
    await this.saveSetting("activeMapId", id)
  },

  // 获取活动地图ID
  async getActiveMapId(): Promise<string | null> {
    return await this.getSetting("activeMapId")
  },

  // 从localStorage迁移数据到IndexedDB
  async migrateFromLocalStorage(key: string): Promise<boolean> {
    try {
      // 检查localStorage中是否有数据
      const data = localStorage.getItem(key)
      if (!data) return false

      // 解析数据
      const parsedData = JSON.parse(data)
      if (!parsedData.state) return false

      // 提取知识地图和活动ID
      const { maps, activeMapId } = parsedData.state

      // 保存到IndexedDB
      if (maps && Array.isArray(maps)) {
        await this.saveMaps(maps)
      }

      if (activeMapId) {
        await this.saveActiveMapId(activeMapId)
      }

      // 迁移成功后，可以选择清除localStorage数据
      // localStorage.removeItem(key)

      return true
    } catch (error) {
      console.error("从localStorage迁移数据失败:", error)
      return false
    }
  },
}

// 初始化函数，在应用启动时调用
export const initializeDB = async (): Promise<void> => {
  try {
    // 尝试从localStorage迁移数据
    const migrated = await dbService.migrateFromLocalStorage("knowledge-map-storage")
    if (migrated) {
      console.log("成功从localStorage迁移数据到IndexedDB")
    }

    // 确保至少有一个知识地图
    const maps = await dbService.getAllMaps()
    if (maps.length === 0) {
      // 创建默认知识地图
      const defaultMap: KnowledgeMap = {
        id: "default-map",
        name: "默认知识地图",
        nodes: [],
        edges: [],
        chatHistory: [],
        tokenCount: 0,
      }
      await dbService.saveMap(defaultMap)
      await dbService.saveActiveMapId(defaultMap.id)
    }
  } catch (error) {
    console.error("初始化数据库失败:", error)
  }
}
