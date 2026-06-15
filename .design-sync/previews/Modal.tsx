import React from "react";
import { Modal } from "toban-kit";

export const NewSchedule = () => (
  <Modal
    title="あたらしい当番表"
    message="名前を入力すると、空の当番表ができます。あとからメンバーや回数を編集できます。"
    confirmLabel="作成する"
  />
);

export const DeleteConfirm = () => (
  <Modal
    variant="destructive"
    title="当番表を削除"
    message="「そうじ当番表」を削除します。この操作は取り消せません。"
    confirmLabel="削除する"
  />
);
