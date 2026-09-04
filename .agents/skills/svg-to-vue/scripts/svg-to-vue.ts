/**
 * @file SVGO 命令行封装：优化 SVG 并转换为同名 Vue 单文件组件。
 *
 * 执行（在项目根目录）：
 * pnpm exec jiti .agents/skills/svg-to-vue/scripts/svg-to-vue.ts <路径/至/图标.svg>
 *
 * 示例：
 * pnpm exec jiti .agents/skills/svg-to-vue/scripts/svg-to-vue.ts cache/icon.svg
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { optimize } from "svgo";

const [, , input] = process.argv;
if (!input) {
  console.error(
    "用法: pnpm exec jiti .agents/skills/svg-to-vue/scripts/svg-to-vue.ts <路径/至/图标.svg>",
  );
  process.exit(1);
}

const inputPath = resolve(process.cwd(), input);
if (!/\.svg$/i.test(inputPath)) throw new Error("仅支持 .svg 文件输入");

const svgContent = await readFile(inputPath, "utf8");
const optimizedSvg = optimize(svgContent, { path: inputPath }).data;
const vuePath = inputPath.replace(/\.svg$/i, ".vue");
await writeFile(vuePath, `<template>\n${optimizedSvg}\n</template>\n`, "utf8");
console.log(`优化完成: ${vuePath}`);
