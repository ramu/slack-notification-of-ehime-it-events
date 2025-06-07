# slack-notification-of-ehime-it-events

## 概要

["四国方面 IT勉強会と非 IT系の合わせ技カレンダー（仮称"](https://sites.google.com/site/itandothershikoku/home)から愛媛県関連のイベントのみ抽出して
指定した Slack チャンネルにイベント情報を自動通知する Google Apps Script です。
[Ehime IT Slack](https://ehime-it-slack.herokuapp.com/) の #event で稼働中

## セットアップ方法

1. Google Apps Script プロジェクトを作成
2. 本リポジトリのコードをコピー＆貼り付け
3. スクリプトプロパティで必要な設定（webhook url、通知先 Slack チャンネル名など)を行う。設定内容は index.js のコメントを確認して下さい

## 使い方

スクリプトを手動実行、またはトリガーで自動実行してください。
スクリプトプロパティで指定した Slack の指定チャンネルにイベント情報が投稿されます。

## 貢献

Pull Request・Issue 歓迎です！
