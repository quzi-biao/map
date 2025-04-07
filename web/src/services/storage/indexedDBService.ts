/**
 * IndexedDB 数据持久化服务
 * 提供基本的地图存储和加载功能
 */

// 数据库配置
const DB_NAME = 'conceptMapDB';
const DB_VERSION = 1;
const MAPS_STORE = 'maps';
const CURRENT_MAP_KEY = 'currentMapId';

// 初始化数据库
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('数据库打开失败:', event);
      reject('无法打开数据库');
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // 创建地图存储对象
      if (!db.objectStoreNames.contains(MAPS_STORE)) {
        db.createObjectStore(MAPS_STORE, { keyPath: 'id' });
      }
    };
  });
}

// 保存地图
export async function saveMap(mapData: any): Promise<string> {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MAPS_STORE], 'readwrite');
      const store = transaction.objectStore(MAPS_STORE);
      
      // 确保地图有ID
      if (!mapData.id) {
        mapData.id = crypto.randomUUID();
      }
      
      // 添加最后保存时间
      mapData.lastSaved = new Date().toISOString();
      
      const request = store.put(mapData);
      
      request.onsuccess = () => {
        // 保存当前地图ID
        localStorage.setItem(CURRENT_MAP_KEY, mapData.id);
        resolve(mapData.id);
      };
      
      request.onerror = () => {
        reject('保存地图失败');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('保存地图错误:', error);
    throw error;
  }
}

// 加载地图
export async function loadMap(mapId?: string): Promise<any> {
  try {
    // 如果没有指定ID，尝试加载上次使用的地图
    if (!mapId) {
      mapId = localStorage.getItem(CURRENT_MAP_KEY) || undefined;
      
      // 如果仍然没有ID，返回null
      if (!mapId) {
        return null;
      }
    }
    
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MAPS_STORE], 'readonly');
      const store = transaction.objectStore(MAPS_STORE);
      
      // 确保 mapId 不是 undefined
      if (typeof mapId === 'undefined') {
        reject('无效的地图ID');
        return;
      }
      
      const request = store.get(mapId);
      
      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        resolve(result || null);
      };
      
      request.onerror = () => {
        reject('加载地图失败');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('加载地图错误:', error);
    throw error;
  }
}

// 获取所有地图列表
export async function getAllMaps(): Promise<any[]> {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MAPS_STORE], 'readonly');
      const store = transaction.objectStore(MAPS_STORE);
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        resolve(result || []);
      };
      
      request.onerror = () => {
        reject('获取地图列表失败');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('获取地图列表错误:', error);
    throw error;
  }
}

// 删除地图
export async function deleteMap(mapId: string): Promise<void> {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MAPS_STORE], 'readwrite');
      const store = transaction.objectStore(MAPS_STORE);
      const request = store.delete(mapId);
      
      request.onsuccess = () => {
        // 如果删除的是当前地图，清除当前地图ID
        if (localStorage.getItem(CURRENT_MAP_KEY) === mapId) {
          localStorage.removeItem(CURRENT_MAP_KEY);
        }
        resolve();
      };
      
      request.onerror = () => {
        reject('删除地图失败');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('删除地图错误:', error);
    throw error;
  }
} 