"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";

interface ExcelRow {
  krName: string;
  value: number;
}

interface PreviewData {
  krName: string;
  value: number;
  status: "pending" | "success" | "error";
  message?: string;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (selectedFile: File | null) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewData([]);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      const rows: PreviewData[] = jsonData
        .slice(1) // ヘッダー行をスキップ
        .filter((row) => row[0] && row[1]) // 空行をスキップ
        .map((row) => ({
          krName: String(row[0]),
          value: Number(row[1]),
          status: "pending",
        }));

      setPreviewData(rows);
    } catch (error) {
      console.error("Error reading file:", error);
      alert("ファイルの読み込みに失敗しました");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;

    setIsProcessing(true);
    const supabase = createClient();
    const updatedData = [...previewData];

    for (let i = 0; i < updatedData.length; i++) {
      const row = updatedData[i];

      try {
        // KR名でkey_resultsを検索
        const { data: keyResults, error: searchError } = await supabase
          .from("key_results")
          .select("id, title, type, target_value, current_value, unit")
          .eq("title", row.krName);

        if (searchError) throw searchError;

        if (!keyResults || keyResults.length === 0) {
          updatedData[i] = {
            ...row,
            status: "error",
            message: "該当するKRが見つかりません",
          };
          setPreviewData([...updatedData]);
          continue;
        }

        const kr = keyResults[0];

        // current_valueを更新
        const { error: updateError } = await supabase
          .from("key_results")
          .update({ current_value: row.value })
          .eq("id", kr.id);

        if (updateError) throw updateError;

        updatedData[i] = {
          ...row,
          status: "success",
          message: `更新完了: ${row.value} ${kr.unit || ""}`,
        };
        setPreviewData([...updatedData]);
      } catch (error) {
        console.error("Error updating KR:", error);
        updatedData[i] = {
          ...row,
          status: "error",
          message: error instanceof Error ? error.message : "更新に失敗しました",
        };
        setPreviewData([...updatedData]);
      }
    }

    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">KPI実績インポート</h1>
        <p className="text-muted-foreground">
          ExcelファイルからKPI実績データをインポート
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ファイルアップロード</CardTitle>
          <CardDescription>
            Excelファイル形式: 1列目=KR名、2列目=実績値
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                ファイルをドラッグ&ドロップ、またはクリックして選択
              </p>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="max-w-xs mx-auto"
              />
              {file && (
                <p className="text-sm font-medium text-primary">
                  選択中: {file.name}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>プレビュー</CardTitle>
                <CardDescription>
                  {previewData.length}件のデータが検出されました
                </CardDescription>
              </div>
              <Button
                onClick={handleImport}
                disabled={isProcessing}
              >
                {isProcessing ? "インポート中..." : "インポート実行"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-4 pb-2 border-b font-medium text-sm">
                <div>KR名</div>
                <div>実績値</div>
                <div>ステータス</div>
                <div>メッセージ</div>
              </div>
              {previewData.map((row, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-4 gap-4 p-2 rounded ${
                    row.status === "success"
                      ? "bg-green-50"
                      : row.status === "error"
                      ? "bg-red-50"
                      : "bg-muted/30"
                  }`}
                >
                  <div className="text-sm">{row.krName}</div>
                  <div className="text-sm font-medium">{row.value}</div>
                  <div className="text-sm">
                    {row.status === "pending" && (
                      <span className="text-muted-foreground">待機中</span>
                    )}
                    {row.status === "success" && (
                      <span className="text-green-600 font-medium">成功</span>
                    )}
                    {row.status === "error" && (
                      <span className="text-red-600 font-medium">エラー</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {row.message || "-"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>使い方</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Excelファイルを準備してください（1列目: KR名、2列目: 実績値）</p>
          <p>2. ファイルをアップロードエリアにドラッグ&ドロップ、または選択</p>
          <p>3. プレビューでデータを確認</p>
          <p>4. 「インポート実行」ボタンをクリックしてデータを更新</p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-medium text-foreground mb-2">Excelファイル例:</p>
            <div className="font-mono text-xs">
              <div className="grid grid-cols-2 gap-4 mb-1">
                <span>KR名</span>
                <span>実績値</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <span>月間売上高</span>
                <span>5000000</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <span>新規顧客数</span>
                <span>25</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
