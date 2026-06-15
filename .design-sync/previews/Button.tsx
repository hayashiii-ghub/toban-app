import React from "react";
import { Button } from "toban-kit";

export const Primary = () => <Button variant="primary">保存する</Button>;

export const Secondary = () => <Button variant="secondary">キャンセル</Button>;

export const Destructive = () => (
  <Button variant="destructive" icon="🗑">
    削除する
  </Button>
);

export const Disabled = () => (
  <Button variant="primary" disabled>
    保存する
  </Button>
);
