import { type NextRequest, NextResponse } from "next/server"
import { getContents, ContentType } from "@/lib/db"
import { formatCharacterCards } from "@/lib/card-formatter"

// 获取角色卡列表 - 兼容客户端cards.json格式
export async function GET(req: NextRequest) {
  try {
    // 获取环境变量中的密钥
    const memberKey = process.env.MEMBER_KEY
    const adminKey = process.env.ADMIN_KEY
    
    // 只有当memberKey被设置时才要求使用带有密钥的路径访问
    if (memberKey && memberKey.trim() !== "") {
      console.log("成员密钥已配置，拒绝访问无密钥的/api/cards.json端点");
      return NextResponse.json({ 
        error: "此服务器已启用密钥保护，请使用带有密钥的链接访问", 
        code: "KEY_REQUIRED" 
      }, { status: 403 });
    }
    
    // 获取所有角色卡
    const characterCards = await getContents(ContentType.CHARACTER_CARD)
    
    // 检查角色卡是否有效
    if (!characterCards || !Array.isArray(characterCards) || characterCards.length === 0) {
      console.log("未找到角色卡数据");
      return NextResponse.json({ cards: [] });
    }
    
    console.log(`获取到 ${characterCards.length} 张角色卡`);
    
    // 获取所有故事书
    let storyBooks = []
    try {
      storyBooks = await getContents(ContentType.STORY_BOOK)
    } catch (error) {
      console.warn("获取故事书失败，可能是数据库枚举未更新:", error)
      // 继续执行，不抛出错误
    }
    
    // 获取所有知识库
    let knowledgeBases = []
    try {
      knowledgeBases = await getContents(ContentType.KNOWLEDGE_BASE)
    } catch (error) {
      console.warn("获取知识库失败:", error)
      // 继续执行，不抛出错误
    }
    
    // 获取所有事件书
    let eventBooks = []
    try {
      eventBooks = await getContents(ContentType.EVENT_BOOK)
    } catch (error) {
      console.warn("获取事件书失败:", error)
      // 继续执行，不抛出错误
    }
    
    // 获取所有提示注入
    let promptInjections = []
    try {
      promptInjections = await getContents(ContentType.PROMPT_INJECTION)
    } catch (error) {
      console.warn("获取提示注入失败:", error)
      // 继续执行，不抛出错误
    }
    
    // 使用共享函数处理格式转换
    console.log("角色卡数据:", JSON.stringify(characterCards).slice(0, 200));
    const cards = await formatCharacterCards(characterCards);
    console.log("格式化后的卡片数据:", JSON.stringify(cards).slice(0, 200));
    
    // 确保cards是数组
    const cardsArray = Array.isArray(cards) ? cards : [];
    
    // 返回符合规范的结果
    return NextResponse.json({ cards: cardsArray })
    
  } catch (error) {
    console.error("获取角色卡列表失败:", error)
    
    // 检查是否是数据库连接错误
    if (error instanceof Error && error.message.includes("数据库连接未初始化")) {
      return NextResponse.json({ error: "数据库连接未初始化，请检查环境变量配置" }, { status: 500 })
    }
    
    return NextResponse.json({ error: "获取角色卡列表失败" }, { status: 500 })
  }
} 