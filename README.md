# Task Management Web

  

这是一个基于四象限法则创建的时间管理辅助工具，使用 **React + TypeScript + Vite + TailwindCSS**（前端网页）


A web application helping you better manage your tasks and get rid of deadlines(mainly made by vibe coding).

  
  

## 🚀 Features

  

- **截止日期追踪**：内置截止日期管理，提醒功能

- **管理任务优先级**：根据艾森豪威尔矩阵设置任务优先级提示，辅助合理分配任务

- **现代风格界面**：简洁直观的用户界面，提升工作效率

- **实时更新**：管理任务时即时同步更新

- **多样化任务管理**：四象限交互式界面和列表模式可自由切换
  

## 📦 安装配置与运行

  

### 配置

- Node.js (v14 or higher)

- npm

  

### 步骤

  

1. **克隆仓库**

   ```bash

   git clone https://github.com/Frank9Lfy/Task-management-web.git

   cd Task-management-web

   ```

  

2. **安装依赖的环境（仅初次使用或删除了node_modules文件夹）**

   ```bash

   npm install

   ```

  

3. **使用开发者模式本地运行**

   ```bash

   npm run dev

  

   ```

 **构建模式（打包生成最终上线用的文件）**

   ```bash

   npm run build

  

   ```

  

## 💡 使用说明

  ### 注意事项
  
1. 运行成功即可在网站上编辑
2. 必须使用<span style="color:red;">同一个</span>浏览器
3. 使用的浏览器请勿开启**无痕/隐私**模式，也不要设置成关闭浏览器时自动清理，否则编辑的数据无法保存




### 效果演示（部分功能）

#### 演示视频

[点击观看功能演示视频](https://www.bilibili.com/video/BV1VVKH6vEWv/?spm_id_from=333.1387.upload.video_card.click&vd_source=4103463234aa9151dcd495c6fa3f24f3)
  
  

## 🎯 项目结构

  

```bash

Task-management-web/
├── LICENSE
├── README.md
├── components.json
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── src
│   ├── App.css
│   ├── App.tsx
│   ├── components
│   │   ├── ConfirmDialog.tsx
│   │   ├── QuadrantChart.tsx
│   │   ├── SmartSuggestions.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskDialog.tsx
│   │   ├── TaskList.tsx
│   │   └── ui
│   │      
│   ├── hooks
│   │   ├── use-mobile.ts
│   │   └── useLocalStorage.ts
│   ├── index.css
│   ├── lib
│   │   └── utils.ts
│   ├── main.tsx
│   └── types
│       └── task.ts
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts

```

  

## 🤝**贡献指南**

### 步骤

我们欢迎各种贡献！请按以下步骤操作：

1. **复刻（Fork）** 该仓库
    
2. 创建一个功能分支（`git checkout -b feature/AmazingFeature`）
    
3. 提交你的更改（`git commit -m '添加某个精彩功能'`）
    
4. 推送到该分支（`git push origin feature/AmazingFeature`）
    
5. 开启一个**拉取请求（Pull Request）**
  
### 额外说明

本项目设有cli工作流

方便检查上传代码的可能错误



## 📝 License

  

**本项目遵循 MIT 许可证，详细信息请查阅 [LICENSE](https://license/) 文件。**

  

## 👨‍💻 Author

  

**Frank9Lfy**

- GitHub: [@Frank9Lfy](https://github.com/Frank9Lfy)

  


## 📞 **支持**  

如果您有任何问题，请随时：

- [开启一个 Issue（问题反馈）](https://github.com/Frank9Lfy/Task-management-web/issues)
    
- [发起一个 Discussion（讨论)](https://github.com/Frank9Lfy/Task-management-web/discussions)



  

---

  

**Happy task managing!** ✨
