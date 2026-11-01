# 月影书库 · 正式封面素材目录

此目录先保留给未来各卷的正式封面。**目前尚未上传真正的封面，因此网站继续显示原有的银月书本和锁定书架。**

## 约定

- 正式封面：`assets/covers/vol-01.webp`、`vol-02.webp`……`vol-12.webp`
- 建议尺寸：**1600 × 2400 像素（2:3 竖版）**；推荐 WebP 或高质量 JPG
- 单卷的特色横幅（可选）：`assets/hero/vol-01.webp`
- 特典、替换封面（可选）：`assets/covers/vol-01-special-01.webp` 等

## 开启封面的步骤

1. 上传完整的封面文件到仓库对应路径。
2. 打开仓库根目录的 `volumes.json`，找到对应卷，将 `cover_image` 从 `null` 改成例如 `"assets/covers/vol-01.webp"`。
3. 如果有单独制作的首页主视觉，将该卷的 `hero_image` 设置为 `"assets/hero/vol-01.webp"`；若为空，则首页主视觉自动使用正式封面。
4. 第一卷等已开放的书卷会自动在首页卡片和章节阅读页显示封面。未发布卷默认隐藏封面，避免剧透。
5. 如果确实想在发行前公开某卷封面，才把 `cover_revealed` 设为 `true`。
6. 网站主推哪一卷由 `volumes.json` 最上方的 `featured_volume` 控制（只对已发布的卷启用）。

旧版布局有回退保护：图片丢失时自动恢复原有书本和卡片样式。未来的特别画廊可以从 `special_covers` 清单读取，不会提前公开未经确认的图片。

**重要：** `volumes.json` 的 `special_covers` 只是预留字段，目前网站不会自动公开这些特别版本。上传前需确认版权及公开意愿。
