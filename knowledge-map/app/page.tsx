"use client"
import { ReactFlowProvider } from "reactflow"
import { useEffect, useState } from "react"
import KnowledgeMap from "@/components/knowledge-map"
import MapsSidebar from "@/components/maps-sidebar"
import useKnowledgeMapStore from "@/store/use-knowledge-map-store"
import { initializeDB } from "@/services/db"

export default function Home() {
  const { initialize, isLoading } = useKnowledgeMapStore()
  const [dbInitialized, setDbInitialized] = useState(false)

  // 初始化数据库和加载数据
  useEffect(() => {
    const init = async () => {
      // 先初始化IndexedDB
      await initializeDB()
      // 然后加载知识地图数据
      await initialize()
      setDbInitialized(true)
    }

    init()
  }, [initialize])

  // 显示加载状态
  if (isLoading || !dbInitialized) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white text-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg">加载知识地图中...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="w-full h-screen flex">
      <ReactFlowProvider>
        <MapsSidebar />
        <div className="flex-1 h-full">
          <KnowledgeMap />
        </div>
      </ReactFlowProvider>
    </main>
  )
}
