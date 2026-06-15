import React from "react";
import { StateCard } from "toban-kit";

export const NotFound = () => (
  <StateCard
    variant="notFound"
    title="ページが見つかりません"
    message="お探しのページは移動または削除された可能性があります。"
  />
);

export const ErrorState = () => (
  <StateCard
    variant="error"
    title="問題が発生しました"
    message="一時的なエラーが発生しました。ページを再読み込みしてください。"
    actionLabel="再読み込み"
  />
);
