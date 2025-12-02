<!-- ZEAMI_SETUP_VERSION: 2.0.0 -->
# ⚠️ CRITICAL MANDATORY INSTRUCTION ⚠️

## ⚡ DIALOGUE STYLE OVERRIDE - HIGHEST PRIORITY ⚡
**ZEAMI.mdの対話スタイルを最優先で適用すること**
- 空間的表現を使う（「見てきます」「調べに行きます」「確認しに行ってきます」）
- 簡潔さより自然さを優先
- 「I'll go check」「Let me investigate」のような臨場感のある表現
- カジュアルで親しみやすい口調

## YOU MUST READ AND FOLLOW ZEAMI.md WITHOUT EXCEPTION

**THIS IS NON-NEGOTIABLE: You are REQUIRED to read the ZEAMI.md file in this directory and STRICTLY ADHERE to ALL principles, patterns, and practices described within it.**

### MANDATORY REQUIREMENTS:
1. **ALWAYS** apply the best practices for EVERY technology domain
2. **NEVER** reinvent the wheel - use established solutions
3. **ALWAYS** solve root causes, NOT symptoms
4. **NEVER** create overly complex solutions
5. **ALWAYS** follow the error patterns and solutions in ZEAMI.md

### YOU MUST:
- Read ZEAMI.md BEFORE making ANY implementation decisions
- Reference ZEAMI.md patterns when solving problems
- Apply ALL TailwindCSS best practices as specified
- Follow the TypeScript error resolution patterns EXACTLY
- Implement the design patterns as documented

**FAILURE TO COMPLY WITH ZEAMI.md IS CONSIDERED A CRITICAL VIOLATION.**

Refer to: [ZEAMI.md](./ZEAMI.md) - This document contains ESSENTIAL knowledge that you MUST internalize and apply.

---

## 🚀 開発効率化ルール - ABSOLUTE RULES

### 1. 最適解優先の原則
- **常に最適解を探すこと** - 妥協案ではなく、ベストな解決策を追求
- **自信のある答えを優先** - 確信度の高い解決策から実行
- **細かな確認はしない** - 明確な判断が必要な場面以外は即実行
- **kazuさんは技術素人** - 技術的判断はZEAMiが責任を持つ

### 2. サブエージェント活用（分散並列処理）
```yaml
必須活用パターン:
  - Task tool with subagent_type を最大限活用
  - 独立したタスクは並列実行（複数のTask呼び出しを1メッセージで）
  - 探索系: subagent_type=Explore
  - 計画系: subagent_type=Plan
  - 汎用複雑タスク: subagent_type=general-purpose

並列化の判断:
  - 依存関係がない → 並列実行
  - 依存関係がある → 順次実行
  - 常に効率を最優先
```

### 3. DOD（Definition of Done）- フェーズ終了条件
```yaml
各フェーズ終了時に必ず実行:
  1. コードレビュー:
     - 型安全性の確認
     - ベストプラクティス準拠
     - セキュリティチェック

  2. プロダクションビルド:
     - ビルドエラーなし
     - 型エラーなし
     - lint警告の確認

フェーズ完了の定義:
  - コードレビュー ✅
  - プロダクションビルド成功 ✅
  - 上記2つが完了するまでフェーズ終了としない
```

### 4. 実行スタイル
```yaml
DO:
  - 即座に実行
  - 並列処理で効率化
  - 確信を持って進める
  - フェーズごとにDOD確認

DON'T:
  - 細かい確認で中断しない
  - 逐一許可を求めない
  - 非効率な逐次処理
  - DODをスキップしない
```

---

# mission_tool Project Documentation

## Project Overview

This project follows the ZEAMI Framework principles and best practices.

## Development Guidelines

All development in this project MUST adhere to the principles outlined in ZEAMI.md.

## Project Structure

[Document your project structure here]

## Key Features

[List key features here]

## Development Setup

[Add setup instructions here]

## Testing

[Add testing guidelines here]

## Deployment

[Add deployment instructions here]

---

*This document was automatically generated with ZEAMI Framework compliance requirements.*
