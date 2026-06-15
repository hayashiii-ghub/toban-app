import React from "react";
import { RotationTable } from "toban-kit";

export const WeeklyCleaning = () => (
  <RotationTable
    caption="そうじ当番表"
    columns={["1週", "2週", "3週", "4週"]}
    rows={["まど", "ゆか", "こくばん", "ごみ"]}
    cells={[
      ["あおい", "はると", "ゆい", "そうた"],
      ["はると", "ゆい", "そうた", "あおい"],
      ["ゆい", "そうた", "あおい", "はると"],
      ["そうた", "あおい", "はると", "ゆい"],
    ]}
    currentColumn={1}
  />
);

export const DailyDuty = () => (
  <RotationTable
    caption="日直カレンダー"
    columns={["月", "火", "水", "木", "金"]}
    rows={["日直"]}
    cells={[["さくら", "れん", "ひな", "かいと", "めい"]]}
    currentColumn={2}
  />
);
